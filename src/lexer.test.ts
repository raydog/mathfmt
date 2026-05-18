import { expect } from "earl";
import {
  ID_FLAG,
  Lang,
  LBRACK_FLAG,
  NUMBER_FLAG,
  OP_FLAG,
  RBRACK_FLAG,
  STACKED_FLAG,
  STRETCHY_FLAG,
  STRING_FLAG,
} from "./lang";
import { lexer } from "./lexer";

describe("Lexer", function () {
  const lang = new Lang();

  it("handles symbols", function () {
    const src = "lim_[beta->oo]=Theta";
    expect(lexer(lang, src)).toEqual([
      { typ: OP_FLAG | STACKED_FLAG, sym: "lim", idx: 0 },
      { typ: OP_FLAG, sym: "_", idx: 3 },
      { typ: OP_FLAG | STRETCHY_FLAG | LBRACK_FLAG, sym: "[", idx: 4 },
      { typ: ID_FLAG, sym: "β", idx: 5 },
      { typ: OP_FLAG, sym: "→", idx: 9 },
      { typ: ID_FLAG, sym: "∞", idx: 11 },
      { typ: OP_FLAG | STRETCHY_FLAG | RBRACK_FLAG, sym: "]", idx: 13 },
      { typ: OP_FLAG, sym: "=", idx: 14 },
      { typ: ID_FLAG, sym: "Θ", idx: 15 },
    ]);
  });

  it("handles numbers", function () {
    const src = "123 .123 1.23 123. -123";
    expect(lexer(lang, src)).toEqual([
      { typ: NUMBER_FLAG, num: "123", idx: 0 },
      { typ: NUMBER_FLAG, num: ".123", idx: 4 },
      { typ: NUMBER_FLAG, num: "1.23", idx: 9 },
      { typ: NUMBER_FLAG, num: "123.", idx: 14 },
      { typ: OP_FLAG, sym: "-", idx: 19 },
      { typ: NUMBER_FLAG, num: "123", idx: 20 },
    ]);
  });

  it("handles strings", function () {
    const src = '"" "foo" """hello"" ""world"""';
    expect(lexer(lang, src)).toEqual([
      { typ: STRING_FLAG, str: "", idx: 0 },
      { typ: STRING_FLAG, str: "foo", idx: 3 },
      { typ: STRING_FLAG, str: '"hello" "world"', idx: 9 },
    ]);
  });

  it("falls back to chars", function () {
    const src = "a=b+c";
    expect(lexer(lang, src)).toEqual([
      { typ: ID_FLAG, char: "a", idx: 0 },
      { typ: OP_FLAG, sym: "=", idx: 1 },
      { typ: ID_FLAG, char: "b", idx: 2 },
      { typ: OP_FLAG, sym: "+", idx: 3 },
      { typ: ID_FLAG, char: "c", idx: 4 },
    ]);
  });
});
