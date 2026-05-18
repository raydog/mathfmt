import { expect } from "earl";
import { parse } from "./parser";
import { lexer } from "./lexer";
import {
  BINARY_FLAG,
  FORCE_SHOW_FLAG,
  ID_FLAG,
  Lang,
  LBRACK_FLAG,
  NUMBER_FLAG,
  OP_FLAG,
  RBRACK_FLAG,
  STRETCHY_FLAG,
  SYM_BRACK_FLAG,
  UNARY_FLAG,
} from "./lang";

describe("Parser", function () {
  const lang = new Lang();

  it("handles basic expressions", function () {
    const src = "1+2";
    expect(parse(lexer(lang, src))).toEqual({
      t: "expr",
      terms: [
        {
          t: "term",
          base: {
            t: "leaf",
            tok: { typ: NUMBER_FLAG, num: "1", idx: 0 },
          },
        },
        {
          t: "term",
          base: {
            t: "leaf",
            tok: { typ: OP_FLAG, sym: "+", idx: 1 },
          },
        },
        {
          t: "term",
          base: {
            t: "leaf",
            tok: { typ: NUMBER_FLAG, num: "2", idx: 2 },
          },
        },
      ],
    });
  });

  it("handles terms", function () {
    const src = "alpha_0^beta/2";
    expect(parse(lexer(lang, src))).toEqual({
      t: "expr",
      terms: [
        {
          t: "term",
          base: {
            t: "leaf",
            tok: {
              idx: 0,
              sym: "α",
              typ: ID_FLAG,
            },
          },
          sub: {
            t: "leaf",
            tok: {
              idx: 6,
              num: "0",
              typ: NUMBER_FLAG,
            },
          },
          sup: {
            t: "leaf",
            tok: {
              idx: 8,
              sym: "β",
              typ: ID_FLAG,
            },
          },
          div: {
            t: "term",
            base: {
              t: "leaf",
              tok: {
                idx: 13,
                num: "2",
                typ: NUMBER_FLAG,
              },
            },
          },
        },
      ],
    });
  });

  it("handles normal brackets", function () {
    const src = "({])_{<<}^|:a:|";
    expect(parse(lexer(lang, src))).toEqual({
      t: "expr",
      terms: [
        {
          base: {
            expr: {
              t: "expr",
              terms: [
                {
                  base: {
                    expr: {
                      t: "expr",
                      terms: [],
                    },
                    l: {
                      idx: 1,
                      sym: "{",
                      typ: LBRACK_FLAG | STRETCHY_FLAG | OP_FLAG,
                    },
                    r: {
                      idx: 2,
                      sym: "]",
                      typ: RBRACK_FLAG | STRETCHY_FLAG | OP_FLAG,
                    },
                    t: "paren",
                  },
                  t: "term",
                },
              ],
            },
            l: {
              idx: 0,
              sym: "(",
              typ: LBRACK_FLAG | STRETCHY_FLAG | OP_FLAG,
            },
            r: {
              idx: 3,
              sym: ")",
              typ: RBRACK_FLAG | STRETCHY_FLAG | OP_FLAG,
            },
            t: "paren",
          },
          sub: {
            expr: {
              t: "expr",
              terms: [
                {
                  base: {
                    expr: {
                      t: "expr",
                      terms: [],
                    },
                    l: {
                      idx: 6,
                      sym: "⟨",
                      typ: LBRACK_FLAG | STRETCHY_FLAG | OP_FLAG,
                    },
                    r: {
                      idx: 8,
                      sym: "}",
                      typ: RBRACK_FLAG | STRETCHY_FLAG | OP_FLAG,
                    },
                    t: "paren",
                  },
                  sup: {
                    expr: {
                      t: "expr",
                      terms: [
                        {
                          base: {
                            t: "leaf",
                            tok: {
                              char: "a",
                              idx: 12,
                              typ: ID_FLAG,
                            },
                          },
                          t: "term",
                        },
                      ],
                    },
                    l: {
                      idx: 10,
                      sym: "|:",
                      typ: LBRACK_FLAG | STRETCHY_FLAG | OP_FLAG,
                    },
                    r: {
                      idx: 13,
                      sym: ":|",
                      typ: RBRACK_FLAG | STRETCHY_FLAG | OP_FLAG,
                    },
                    t: "paren",
                  },
                  t: "term",
                },
              ],
            },
            l: {
              idx: 5,
              sym: "{",
              typ: LBRACK_FLAG | STRETCHY_FLAG | OP_FLAG,
            },
            t: "paren",
          },
          t: "term",
        },
      ],
    });
  });

  it("abs groups can be grouped", function () {
    const src = "Gamma^|x|-2";
    expect(parse(lexer(lang, src))).toEqual({
      t: "expr",
      terms: [
        {
          base: {
            t: "leaf",
            tok: {
              idx: 0,
              sym: "Γ",
              typ: ID_FLAG,
            },
          },
          sup: {
            expr: {
              t: "expr",
              terms: [
                {
                  base: {
                    t: "leaf",
                    tok: {
                      char: "x",
                      idx: 7,
                      typ: ID_FLAG,
                    },
                  },
                  t: "term",
                },
              ],
            },
            l: {
              idx: 6,
              sym: "|",
              typ: SYM_BRACK_FLAG | FORCE_SHOW_FLAG | STRETCHY_FLAG | OP_FLAG,
            },
            r: {
              idx: 8,
              sym: "|",
              typ: SYM_BRACK_FLAG | FORCE_SHOW_FLAG | STRETCHY_FLAG | OP_FLAG,
            },
            t: "paren",
          },
          t: "term",
        },
        {
          base: {
            t: "leaf",
            tok: {
              idx: 9,
              sym: "-",
              typ: OP_FLAG,
            },
          },
          t: "term",
        },
        {
          base: {
            t: "leaf",
            tok: {
              idx: 10,
              num: "2",
              typ: NUMBER_FLAG,
            },
          },
          t: "term",
        },
      ],
    });
  });

  it("handles unaries", function () {
    const src = "sqrt x";
    expect(parse(lexer(lang, src))).toEqual({
      t: "expr",
      terms: [
        {
          base: {
            a: {
              t: "leaf",
              tok: {
                char: "x",
                idx: 5,
                typ: ID_FLAG,
              },
            },
            t: "unary",
            tok: {
              idx: 0,
              sym: "sqrt",
              typ: UNARY_FLAG | OP_FLAG,
            },
          },
          t: "term",
        },
      ],
    });
  });

  it("handles binaries", function () {
    const src = "root 3 x";
    expect(parse(lexer(lang, src))).toEqual({
      t: "expr",
      terms: [
        {
          base: {
            a: {
              t: "leaf",
              tok: {
                idx: 5,
                num: "3",
                typ: NUMBER_FLAG,
              },
            },
            b: {
              t: "leaf",
              tok: {
                char: "x",
                idx: 7,
                typ: ID_FLAG,
              },
            },
            t: "binary",
            tok: {
              idx: 0,
              sym: "root",
              typ: BINARY_FLAG | OP_FLAG,
            },
          },
          t: "term",
        },
      ],
    });
  });
});
