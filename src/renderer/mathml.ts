import {
  FONT_FLAG,
  FORCE_HIDE_FLAG,
  FORCE_SHOW_FLAG,
  ID_FLAG,
  LBRACK_FLAG,
  NUMBER_FLAG,
  OP_FLAG,
  RBRACK_FLAG,
  STACKED_FLAG,
  STRETCHY_FLAG,
  STRING_FLAG,
  SYM_BRACK_FLAG,
} from "../lang";
import type { Token } from "../lexer";
import type {
  AstAny,
  AstBinary,
  AstExpr,
  AstLeaf,
  AstParen,
  AstSimp,
  AstTerm,
  AstUnary,
} from "../parser";
import { extractMatrix, type AstMatrix } from "./utilities/detectMatrix";
import { formatText, type FontName } from "./utilities/fancyText";

/**
 * Only allow named + #<3,6,8 hex> colors
 * Maybe others in the future?
 */
const COLOR_RE = /^(?:\w+|#[0-9a-f]{3}|#[0-9a-f]{6}|#[0-9a-f]{8})$/i;

/**
 * A quick utility class for generating the MathML structure. This speeds up the
 * HTML generation a little, since escaping and string concats are deferred, and
 * then done all at once. Plus, this structures the output in a way where the
 * same code can be used to generate other outputs, like SVG.
 */
class Node {
  private attributes: [string, string][] = [];

  constructor(
    readonly tag: string,
    readonly children: (Node | string)[] = [],
  ) {
    this.children = children;
  }

  _addAttr(name: string, value: string | null): Node {
    if (value) {
      this.attributes.push([name, value]);
    }
    return this;
  }

  html(): string {
    const { tag } = this;
    let attrStr = "";
    for (const [key, val] of this.attributes) {
      attrStr += ` ${key}="${_html(val)}"`;
    }
    let inside = "";
    for (const child of this.children) {
      inside += typeof child === "string" ? _html(child) : child.html();
    }
    return !tag
      ? inside
      : inside
        ? `<${tag}${attrStr}>${inside}</${tag}>`
        : `<${tag}/>`;
  }
}

/**
 * Options for the MathML rendering.
 */
export type RenderOpts = {
  /** id for the root math element. */
  id?: string;

  /** class name for the root math element. */
  class?: string;

  /** CSS styles for the root math element. */
  style?: string;

  /**
   * True if this math element is going to be inlined, and so should aim to have
   * a lower vertical footprint.
   */
  inline?: boolean;
};

/**
 * Shared context obj, for all AST handler funcs.
 */
type RenderCtx = {
  /**
   * The full ASCIIMath source. Used when extracting strings for args.
   */
  src: string;

  /**
   * A String prep function. Used to apply string transformations (like bb, ...)
   * for strings that are about to be put into the HTML.
   */
  stringFn: (s: string) => string;
};

/**
 * Render an AST to a subset of MathML that is understood by the VAST majority
 * of browsers. Produces a MathML _STRING_ instead of producing the nodes
 * directly, so that this method can work for both in-render use, and in SSR.
 */
export default function renderToMathML(
  src: string,
  ast: AstExpr,
  opts: RenderOpts = {},
): string {
  const ctx: RenderCtx = { src, stringFn: String };
  const terms = ast.terms.map((t) => handleTerm(ctx, t));
  const math = new Node("math", terms)
    ._addAttr("id", opts.id ?? null)
    ._addAttr("class", opts.class ?? null)
    ._addAttr("style", opts.style ?? null)
    ._addAttr("display", opts.inline ? "inline" : "block");

  return math.html();
}

function handleExpr(ctx: RenderCtx, ast: AstExpr): Node {
  return new Node(
    "mrow",
    ast.terms.map((t) => handleTerm(ctx, t)),
  );
}

function handleTerm(ctx: RenderCtx, ast: AstTerm): Node {
  let base = handleSimp(ctx, ast.base, !!ast.div);
  let sub = ast.sub && handleSimp(ctx, ast.sub, true);
  let sup = ast.sup && handleSimp(ctx, ast.sup, true);
  let div: Node | null = null;

  // Hack: Divs.
  // We want to suppress parens in both the numerator and denominator. Problem:
  // the denom is a Term, not a Simp / Paren node. This means that the denom can
  // have super or subscripts. We DON'T want to remove the parens in that case,
  // so look into the div, to figure out the course-of-action.
  if (ast.div) {
    if (!ast.div.sub && !ast.div.sup && !ast.div.div) {
      // Simple case.
      div = handleSimp(ctx, ast.div.base, true);
    } else {
      // Complex case.
      div = handleTerm(ctx, ast.div);
    }
  }

  // Hack: stacked nodes.
  // We need to know if the base of the current term is "stacked", ie: displayed
  // with super / subscripts directly over / under the term itself, and not to
  // the right. (Like a normal exponent.) However, base is a Simp, and there are
  // several ways that a Simp node can be determined "stacked":
  const isStacked =
    (ast.base.t === "leaf" && ast.base.tok.typ & STACKED_FLAG) ||
    (ast.base.t === "unary" && ast.base.tok.typ & STACKED_FLAG);
  if (isStacked) {
    sub ??= new Node("mspace");
    sup ??= new Node("mspace");
    base = new Node("munderover", [base, sub, sup]);
  } else if (sub && sup) {
    base = new Node("msubsup", [base, sub, sup]);
  } else if (sub) {
    base = new Node("msub", [base, sub]);
  } else if (sup) {
    base = new Node("msup", [base, sup]);
  }
  if (div) {
    base = new Node("mfrac", [base, div]);
  }
  return base;
}

function handleSimp(ctx: RenderCtx, ast: AstSimp, hideParens: boolean): Node {
  switch (ast.t) {
    case "paren":
      return handleParen(ctx, ast, hideParens);
    case "unary":
      return handleUnary(ctx, ast);
    case "binary":
      return handleBinary(ctx, ast);
    case "leaf":
      return handleLeaf(ctx, ast);
    default: {
      const _exhaustive: never = ast;
      throw new Error("Unhandled: " + JSON.stringify(_exhaustive));
    }
  }
}

function handleParen(ctx: RenderCtx, ast: AstParen, hideParens: boolean): Node {
  const m = extractMatrix(ast);
  if (m) {
    return handleMatrix(ctx, m);
  }
  const l =
    !hideParens || ast.l.typ & FORCE_SHOW_FLAG
      ? handleToken(ctx, ast.l, true)
      : "";
  const r =
    ast.r && (!hideParens || ast.l.typ & FORCE_SHOW_FLAG)
      ? handleToken(ctx, ast.r, true)
      : "";
  const middle = handleExpr(ctx, ast.expr);
  return l || r ? new Node("mrow", [l, middle, r]) : middle;
}

function handleMatrix(ctx: RenderCtx, m: AstMatrix): Node {
  const l = handleToken(ctx, m.l, true);
  const r = m.r ? handleToken(ctx, m.r, true) : "";
  const rows: Node[] = m.data.map((row) => {
    const cols = row.map(
      (expr, idx) =>
        new Node("mtd", [
          idx === m.aug
            ? "<mo>\u2502</mo>" // << Unicode extra-tall "|" character
            : handleExpr(ctx, expr),
        ]),
    );
    return new Node("mtr", cols);
  });
  // Columnspacing is not super-widely supported, but it is not _critical_ to
  // render the augmented matrix, and does make things look a little nicer.
  let spacing: string | null = null;
  if (m.aug) {
    // If we have C cols, then we have C-1 gaps between those cols. We need to
    // reduce the width of the two cols around our | character, which are at gap
    // indexes aug-1 and aug.
    spacing = Array(m.data[0]!.length - 1)
      .fill(0)
      .map((_val, idx) =>
        idx === m.aug! - 1 || idx === m.aug ? "50%" : "100%",
      )
      .join(" ");
  }
  return new Node("mrow", [
    l,
    new Node("mtable", rows)._addAttr("spacing", spacing),
    r,
  ]);
}

function handleUnary(ctx: RenderCtx, ast: AstUnary): Node {
  const { tok, a } = ast;
  switch (tok.sym) {
    case "sqrt": {
      const arg = a ? handleSimp(ctx, a, true) : "";
      return new Node("msqrt", [arg]);
    }
    case "abs":
      return unaryWrap(ctx, "|", a, "|");
    case "floor":
      return unaryWrap(ctx, "⌊", a, "⌋");
    case "ceil":
      return unaryWrap(ctx, "⌈", a, "⌉");
    case "vec":
      return unaryOver(ctx, a, "→");
    case "norm":
      return unaryWrap(ctx, "∥", a, "∥");
    case "hat":
      return unaryOver(ctx, a, "^");
    case "bar":
      return unaryOver(ctx, a, "¯");
    case "ul":
      return unaryUnder(ctx, a, "̲");
    case "tilde":
      return unaryOver(ctx, a, "~");
    case "dot":
      return unaryOver(ctx, a, ".");
    case "ddot":
      return unaryOver(ctx, a, "..");
    case "cancel":
      return unaryCancel(ctx, a);
    case "overarc":
      return unaryOver(ctx, a, "⏜");
    case "obrace":
      return unaryOver(ctx, a, "⏞");
    case "ubrace":
      return unaryUnder(ctx, a, "⏟");
    case "text":
      return new Node("mtext", [argString(ctx, a)]);
  }
  // Font commands (bb, fr, ...):
  if (tok.typ & FONT_FLAG) {
    const font = tok.sym as FontName;
    const newCtx: RenderCtx = {
      ...ctx,
      stringFn: (txt) => formatText(font, txt),
    };
    return a ? handleSimp(newCtx, a, true) : new Node("");
  }
  // Fallback (sin, log, ...):
  const base = handleToken(ctx, tok, false);
  const arg = ast.a ? handleSimp(ctx, ast.a, false) : "";
  return new Node("mrow", [base, arg]);
}

function unaryWrap(
  ctx: RenderCtx,
  l: string,
  mid: AstSimp | undefined,
  r: string,
): Node {
  const a = mid ? handleSimp(ctx, mid, true) : "";
  return new Node("mrow", [new Node("mo", [l]), a, new Node("mo", [r])]);
}

function unaryOver(
  ctx: RenderCtx,
  base: AstSimp | undefined,
  over: string,
): Node {
  const a = base ? handleSimp(ctx, base, true) : "";
  return new Node("mover", [a, new Node("mo", [over])])._addAttr(
    "accent",
    "true",
  );
}

function unaryUnder(
  ctx: RenderCtx,
  base: AstSimp | undefined,
  under: string,
): Node {
  const a = base ? handleSimp(ctx, base, true) : "";
  return new Node("munder", [a, new Node("mo", [under])])._addAttr(
    "accentunder",
    "true",
  );
}

function unaryCancel(ctx: RenderCtx, base: AstSimp | undefined): Node {
  const a = base ? handleSimp(ctx, base, true) : "";
  return new Node("menclose", [a])._addAttr("notation", "updiagonalstrike");
}

function handleBinary(ctx: RenderCtx, ast: AstBinary): Node {
  const { tok, a, b } = ast;
  switch (tok.sym) {
    case "color": {
      if (!a) {
        break;
      }
      const color = argString(ctx, a).trim();
      if (!COLOR_RE.test(color)) {
        break;
      }
      const main = b ? handleSimp(ctx, b, true) : "";
      return new Node("mstyle", [main])._addAttr("mathcolor", color);
    }
    case "root":
      return binaryStack(ctx, "mroot", b, a);
    case "frac":
      return binaryStack(ctx, "mfrac", a, b);
    case "overset":
      return binaryStack(ctx, "mover", b, a);
    case "underset":
      return binaryStack(ctx, "munder", b, a);
    case "id": {
      const id = argString(ctx, a);
      const main = b ? handleSimp(ctx, b, true) : "";
      return new Node("mrow", [main])._addAttr("id", id);
    }
    case "class": {
      const classname = argString(ctx, a);
      const main = b ? handleSimp(ctx, b, true) : "";
      return new Node("mrow", [main])._addAttr("class", classname);
    }
  }
  // Fallback:
  const base = handleToken(ctx, tok, false);
  const arga = a ? handleSimp(ctx, a, false) : "";
  const argb = b ? handleSimp(ctx, b, false) : "";
  return new Node("mrow", [base, arga, argb]);
}

function argString(ctx: RenderCtx, arg: AstSimp | undefined): string {
  if (!arg) {
    return "";
  }
  if (arg.t === "leaf" && arg.tok.str) {
    return arg.tok.str;
  }
  if (arg.t === "paren" && arg.l.sym) {
    const left = arg.l.idx + arg.l.sym.length;
    return arg.r ? ctx.src.slice(left, arg.r.idx) : ctx.src.slice(left);
  }
  return "";
}

function binaryStack(
  ctx: RenderCtx,
  tag: string,
  top: AstSimp | undefined,
  bot: AstSimp | undefined,
): Node {
  const a = top ? handleSimp(ctx, top, true) : new Node("mspace");
  const b = bot ? handleSimp(ctx, bot, true) : new Node("mspace");
  return new Node(tag, [a, b]);
}

function handleLeaf(ctx: RenderCtx, ast: AstLeaf): Node {
  return handleToken(ctx, ast.tok, false);
}

function handleToken(
  { stringFn }: RenderCtx,
  tok: Token,
  isParen: boolean,
): Node {
  const { typ } = tok;
  if (typ & FORCE_HIDE_FLAG) {
    return new Node("");
  }
  if (typ & OP_FLAG) {
    let stretchy: boolean | null = typ & STRETCHY_FLAG ? true : null;

    // Parens are all stretchy, but we don't want them to be if this is not a
    // part of a paren node. Suppress stretchiness, in that case:
    if (!isParen && typ & (LBRACK_FLAG | RBRACK_FLAG | SYM_BRACK_FLAG)) {
      stretchy = false;
    }

    let value = tok.str ?? tok.sym ?? "";
    // Hack for "|:", ":|", and ":|:" symbols, as result in the same text:
    if (value === "|:" || value === ":|" || value === ":|:") {
      value = "|";
    }
    // Whitespace operators:
    if (value.trim() === "") {
      return new Node("mspace")._addAttr("width", value.length * 0.25 + "em");
    }
    return new Node("mo", [stringFn(value)])._addAttr(
      "stretchy",
      stretchy ? "true" : "",
    );
  }

  if (typ & ID_FLAG) {
    const value = tok.str ?? tok.sym ?? tok.char ?? "";
    return new Node("mi", [stringFn(value)]);
  }

  if (typ & NUMBER_FLAG) {
    return new Node("mn", [stringFn(tok.num ?? "")]);
  }

  if (typ & STRING_FLAG) {
    return new Node("mtext", [stringFn(tok.str ?? "")]);
  }

  // !?!
  return new Node("");
}

// TODO: This from he or html-entities
function _html(text: string): string {
  return text.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        throw new Error("Unexpected char: " + char);
    }
  });
}
