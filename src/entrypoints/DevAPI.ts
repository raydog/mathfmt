import * as Lang from "../lang";
import { lexer } from "../lexer";
import { parse } from "../parser";

export { type MathMLOpts, intoMathML } from "./MathFmt";

const lang = new Lang.Lang();

export function parseTree(math: string) {
  const toks = lexer(lang, math);
  return parse(toks);
}

export function tokenFlags(typ: number): string[] {
  return [
    typ & Lang.ID_FLAG ? "ID" : "",
    typ & Lang.OP_FLAG ? "OP" : "",
    typ & Lang.STRING_FLAG ? "STRING" : "",
    typ & Lang.NUMBER_FLAG ? "NUMBER" : "",
    typ & Lang.STACKED_FLAG ? "STACKED" : "",
    typ & Lang.STRETCHY_FLAG ? "STRETCHY" : "",
    typ & Lang.UNARY_FLAG ? "UNARY" : "",
    typ & Lang.BINARY_FLAG ? "BINARY" : "",
    typ & Lang.LBRACK_FLAG ? "LBRACK" : "",
    typ & Lang.RBRACK_FLAG ? "RBRACK" : "",
    typ & Lang.SYM_BRACK_FLAG ? "SYM_BRACK" : "",
    typ & Lang.FORCE_SHOW_FLAG ? "FORCE_SHOW" : "",
    typ & Lang.FORCE_HIDE_FLAG ? "FORCE_HIDE" : "",
    typ & Lang.FONT_FLAG ? "FONT" : "",
    typ & Lang.FUNC_FLAG ? "FUNC" : "",
    typ & ~Lang.ALL_FLAGS ? String(typ & ~Lang.ALL_FLAGS) : "",
  ].filter(Boolean);
}
