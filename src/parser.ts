/*
 * expr := term*
 * term = simp ('_' simp)? ('^' simp)? ('/' term)?
 * simp := paren | unary | binary | leaf
 * paren := ('(' | '[' | ...) expr (')' | ']' | ...)
 * unary := ('sqrt' | 'floor' | ...) simp
 * binary := ('root' | 'frac' | ...) simp simp
 * leaf := (str literal) | (num literal) | (symbol)
 */

import {
  BINARY_FLAG,
  LBRACK_FLAG,
  RBRACK_FLAG,
  SYM_BRACK_FLAG,
  UNARY_FLAG,
} from "./lang";
import type { Token } from "./lexer";

export type AstAny =
  | AstExpr
  | AstTerm
  | AstSimp
  | AstParen
  | AstUnary
  | AstBinary
  | AstLeaf;
export type AstExpr = { t: "expr"; terms: AstTerm[] };
export type AstTerm = {
  t: "term";
  base: AstSimp;
  sub?: AstSimp;
  sup?: AstSimp;
  div?: AstTerm;
};
export type AstSimp = AstParen | AstUnary | AstBinary | AstLeaf;
export type AstParen = { t: "paren"; l: Token; expr: AstExpr; r?: Token };
export type AstUnary = { t: "unary"; tok: Token; a?: AstSimp };
export type AstBinary = { t: "binary"; tok: Token; a?: AstSimp; b?: AstSimp };
export type AstLeaf = { t: "leaf"; tok: Token };

/**
 * Wraps an array of Tokens, and gives the typical stack methods WITH an ability
 * to revert a series of actions easily.
 *
 * (We need that ability to rewind the stream of tokens without mutating the
 * array, since | is only a brace token IF there's a matching token found. But
 * we only know if there's a matching token if we consume an expression first,
 * and so we _might_ need to revert some expression ops...)
 */
class TokenStack {
  private _idx = 0;
  constructor(private readonly _toks: Token[]) {}

  _more(): boolean {
    return this._idx < this._toks.length;
  }
  _front(): Token | null {
    return this._toks[this._idx] ?? null;
  }
  _shift(): Token | null {
    return this._toks[this._idx++] ?? null;
  }
  _save(): number {
    return this._idx;
  }
  _restore(idx: number) {
    this._idx = idx;
  }
}

export function parse(tokens: Token[]): AstExpr {
  const toks = new TokenStack(tokens);
  return parseExpr(toks, false, false);
}

/**
 * Parse an Expression. (Expressions are sequences of Terms)
 *
 * stopOnBrace is used to end the expression when encountering a closing brace.
 * (ASCIIMath is _staggeringly_ permissive, and so encountering a closing brace
 * normally would just include that brace as a token.)
 */
function parseExpr(
  toks: TokenStack,
  stopOnBrace: boolean,
  stopOnSym: boolean,
): AstExpr {
  const terms: AstTerm[] = [];
  while (toks._more()) {
    if (stopOnBrace && toks._front()!.typ & RBRACK_FLAG) {
      break;
    }
    if (stopOnSym && toks._front()!.typ & SYM_BRACK_FLAG) {
      break;
    }
    const term = parseTerm(toks);
    if (term) {
      terms.push(term);
      continue;
    }
    break;
  }
  return { t: "expr", terms };
}

/**
 * Parse a Term. A term is a base "Simple" expr, plus an optional subscript,
 * then an optional exponent, then an optional divisor.
 */
function parseTerm(toks: TokenStack): AstTerm | null {
  const base = parseSimp(toks, true);
  if (!base) {
    return null;
  }
  const out: AstTerm = { t: "term", base };
  if (toks._front()?.sym === "_") {
    toks._shift();
    const sub = parseSimp(toks, false);
    sub && (out.sub = sub);
  }
  if (toks._front()?.sym === "^") {
    toks._shift();
    const sup = parseSimp(toks, false);
    sup && (out.sup = sup);
  }
  if (toks._front()?.sym === "/") {
    toks._shift();
    const div = parseTerm(toks);
    div && (out.div = div);
  }
  return out;
}

/**
 * Parse a simple expression. That is a (parenthesized) section, a unary (like
 * `sin(x)`), a binary (like `frac(x)(y)`), or a "leaf" expression.
 * @param toks
 */
function parseSimp(toks: TokenStack, all: boolean): AstSimp | null {
  return (
    parseParen(toks) ||
    parseSymParen(toks) ||
    parseUnary(toks) ||
    parseBinary(toks) ||
    parseLeaf(toks, all)
  );
}

/**
 * Parse a parenthesized section. Ending brace is optional if EOF comes first.
 * Mixed parenthesis types are also allowed.
 */
function parseParen(toks: TokenStack): AstParen | null {
  if (!toks._more() || (toks._front()!.typ & LBRACK_FLAG) === 0) {
    return null;
  }
  const l = toks._shift()!;
  const expr = parseExpr(toks, true, false); // << Stop on rbrace only.
  const out: AstParen = { t: "paren", l, expr };
  const r =
    toks._more() && toks._front()!.typ & RBRACK_FLAG ? toks._shift()! : null;
  r && (out.r = r);
  return out;
}

/**
 * Parse a symmetrical parenthesized section. Ending brace is required.
 */
function parseSymParen(toks: TokenStack): AstParen | null {
  if (!toks._more() || (toks._front()!.typ & SYM_BRACK_FLAG) === 0) {
    return null;
  }
  const save = toks._save()!;
  const l = toks._shift()!;
  const expr = parseExpr(toks, true, true); // << Stop on sym.
  // Matching token MUST match the orig, else, we'll revert this whole thing.
  const r = toks._shift();
  if (!r || (r.typ & SYM_BRACK_FLAG) === 0 || r.sym !== l.sym) {
    toks._restore(save);
    return null;
  }
  return { t: "paren", l, expr, r };
}

/**
 * Parse a unary expression. (sin, log, ...) followed by a simple expr.
 *
 * @param toks
 */
function parseUnary(toks: TokenStack): AstUnary | null {
  if (!toks._more() || (toks._front()!.typ & UNARY_FLAG) === 0) {
    return null;
  }
  const tok = toks._shift()!;
  const out: AstUnary = { t: "unary", tok };
  const a = parseSimp(toks, false);
  a && (out.a = a);
  return out;
}

/**
 * Parse a binary expression. (frac, root, ...) followed by 2 simple exprs.
 *
 * @param toks
 */
function parseBinary(toks: TokenStack): AstBinary | null {
  if (!toks._more() || (toks._front()!.typ & BINARY_FLAG) === 0) {
    return null;
  }
  const tok = toks._shift()!;
  const out: AstBinary = { t: "binary", tok };
  const a = parseSimp(toks, false);
  const b = parseSimp(toks, false);
  a && (out.a = a);
  b && (out.b = b);
  return out;
}

/**
 * Parse a leaf. Accepts a wide range of tokens as a fallback.
 *
 * @param toks
 * @param all True when we'll accept ANY token at this point. (Normally, we
 *            reject end braces)
 */
function parseLeaf(toks: TokenStack, all: boolean): AstLeaf | null {
  const front = toks._front();
  if (!front || (!all && front.typ & RBRACK_FLAG)) {
    return null;
  }
  return { t: "leaf", tok: toks._shift()! };
}
