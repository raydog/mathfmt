import type { Token } from "../../lexer";
import type { AstExpr, AstParen, AstTerm } from "../../parser";

export type AstMatrix = {
  t: "matrix";

  /** Left brace token */
  l: Token;

  /** Right brace token */
  r?: Token;

  /** Column that is consistently | for augmented matrixes. */
  aug: number | null;

  /**
   * Row-major packing of all Expression terms from the nested AstParen nodes.
   */
  data: AstExpr[][];
};

/**
 * A "Matrix" is a parenthesized sequence where:
 * - Both braces are present. || braces only allowed for the OUTSIDE braces.
 * - Every even index is nested parenthesized sequence.
 * - Every odd index is a ",".
 * - Each of those nested sequences have the same number of "," chars.
 * - There must be at least two nested sequences.
 *
 * Extensions from base ASCIIMath:
 * - The _last_ entry of the matrix can have _fewer_ entries than the rest. This
 *   helps when interactively typing out the formula, since it allows partial
 *   renders to succeed.
 * - ASCIIMath disallowed {} braces for some reason, unless the left was visible
 *   and the right side was invisible. We remove that restriction: any braces
 *   are valid.
 * - (: :) sides weren't "stretchy" in upstream AM, but ours are.
 * - AM mandated that if || braces are on the outside, they must be consistent -
 *   both must be |s. We remove that restriction. But still, don't use || for
 *   the inside sequences - it'll mess up the parser.
 *
 * TODO:
 *   How handle interior | chars for augmented matrixes!? D:
 *   Oh I got an idea
 */
export function extractMatrix(ast: AstParen): AstMatrix | null {
  // We NEED at least 3 items (paren, sep, paren):
  if (ast.expr.terms.length < 3) {
    return null;
  }
  let commonLen: number = -1;
  const lastIdx = ast.expr.terms.length - 1;
  for (const [idx, term] of ast.expr.terms.entries()) {
    const isEven = idx % 2 === 0;
    if (isEven) {
      // Even indexes get parens.
      if (term.sub || term.sup || term.div || term.base.t !== "paren") {
        return null;
      }
      const count = astParenCount(term.base);
      if (commonLen < 0) {
        commonLen = count;
      }
      if (idx < lastIdx && count !== commonLen) {
        return null;
      }
      if (idx === lastIdx && count > commonLen) {
        return null;
      }
    } else {
      // Odd indexes get ","s:
      if (!isSep(term)) {
        return null;
      }
    }
  }
  // Else, this array is acceptable. Pull the new expressions into the correct
  // places:
  const data: AstExpr[][] = [];
  let augCol: number | null = null;
  let maybeAug = true;
  for (const [idx, term] of ast.expr.terms.entries()) {
    if (idx % 2) {
      continue;
    }
    let start = 0;
    const paren = term.base as AstParen;
    const row: AstExpr[] = [];
    for (const [subIdx, term] of paren.expr.terms.entries()) {
      if (isSep(term)) {
        const terms = paren.expr.terms.slice(start, subIdx);
        row.push({ t: "expr", terms });
        if (maybeAug && isAug(terms)) {
          if (row.length === 1) {
            // Cannot be in first column.
            augCol = null;
            maybeAug = false;
          } else if (augCol == null) {
            augCol = row.length - 1;
          } else if (augCol !== row.length - 1) {
            augCol = null;
            maybeAug = false;
          }
        }
        start = subIdx + 1;
      }
    }
    const terms = paren.expr.terms.slice(start);
    row.push({ t: "expr", terms });
    data.push(row);
    if (maybeAug && augCol == null) {
      // Aug bar must be in _every_ row.
      maybeAug = false;
    }
  }

  const { l, r } = ast;
  const out: AstMatrix = { t: "matrix", l, aug: augCol, data };
  r && (out.r = r);
  return out;
}

function astParenCount(ast: AstParen): number {
  let num = 1;
  for (const term of ast.expr.terms) {
    if (isSep(term)) {
      num++;
    }
  }
  return num;
}

function isSep(term: AstTerm): boolean {
  // No subscripts, etc...
  if (term.sub || term.sup || term.div) {
    return false;
  }
  const { base } = term;
  return base.t === "leaf" && base.tok.sym === ",";
}

function isAug(terms: AstTerm[]): boolean {
  if (terms.length !== 1) {
    return false;
  }
  // No subscripts, etc...
  const term = terms[0]!;
  if (term.sub || term.sup || term.div) {
    return false;
  }
  const { base } = term;
  return base.t === "leaf" && base.tok.sym === "|";
}
