/**
 * A math identifier. (aleph, gamma, ...)
 */
export const ID_FLAG = 1 << 0;

/**
 * A math operator. (+, *, int, ...)
 */
export const OP_FLAG = 1 << 1;

/**
 * A string literal. From the user.
 */
export const STRING_FLAG = 1 << 2;

/**
 * A number literal. From the user.
 */
export const NUMBER_FLAG = 1 << 3;

/**
 * Is "stacked" - ie: subscript and superscripts should be rendered above and
 * below this item, and not off to the right.
 */
export const STACKED_FLAG = 1 << 4;

/**
 * Is "stretchy" - ie: will scale veritcally to match the size of the math
 * around it. (ie: sum, int, ...)
 */
export const STRETCHY_FLAG = 1 << 5;

/**
 * Is a "unary" op. (sqrt, font commands, ...)
 */
export const UNARY_FLAG = 1 << 6;

/**
 * Is a "binary" op. (frac, root, ...)
 */
export const BINARY_FLAG = 1 << 7;

/**
 * Is a opening bracket. ie: (, [, {, ...
 */
export const LBRACK_FLAG = 1 << 8;

/**
 * Is a closing bracket. ie: (, [, {, ...
 */
export const RBRACK_FLAG = 1 << 9;

/**
 * A symmetrical bracket. Opens AND closes, but _needs_ there to be a matching
 * bracket of the same type. ie: |.
 */
export const SYM_BRACK_FLAG = 1 << 10;

/**
 * Force a token to be visible.
 */
export const FORCE_SHOW_FLAG = 1 << 11;

/**
 * Force a token to be not visible.
 */
export const FORCE_HIDE_FLAG = 1 << 12;

/**
 * Is a font command. The op's string is a FontName for the formatText function.
 */
export const FONT_FLAG = 1 << 13;

/**
 * Is a "standard function". These function flags are not super useful - they
 * are ignored in the parser. But annotating some tokens with these values
 * improves the docs.
 */
export const FUNC_FLAG = 1 << 14;

/**
 * Mask of all flags. Only used in dev server.
 */
export const ALL_FLAGS = (1 << 15) - 1;

/** An identifier. String if one, and use an array if there are aliases. */
export type NameSet = string | [string, ...string[]];

export type SymInfo = {
  tok: string;
  typ: number;
};

/**
 * Storage class for language parsing details.
 *
 * Functions as an extendable helper class for the lexer.
 */
export class Lang {
  /**
   * Registry mapping input strings to a token name and type.
   *
   * Top-level map is keyed by the first character, to speed up longest-token
   * searches.
   *
   * Second-leven is an array, sorted by the token length, so we can search
   * linearly through the list of candidates, and the first match is always the
   * longest.
   */
  private sym: Map<string, [string, SymInfo][]> = new Map();

  constructor() {
    this._addSymbols(ID_FLAG, [
      ["α", "alpha"],
      ["β", "beta"],
      ["γ", "gamma"],
      ["δ", "delta"],
      ["ε", "epsilon", "epsi"],
      ["ζ", "zeta"],
      ["η", "eta"],
      ["θ", "theta"],
      ["ι", "iota"],
      ["κ", "kappa"],
      ["λ", "lambda", "lamda"],
      ["μ", "mu"],
      ["ν", "nu"],
      ["ξ", "xi"],
      ["ο", "omicron"],
      ["π", "pi"],
      ["ρ", "rho"],
      ["σ", "sigma"],
      ["τ", "tau"],
      ["υ", "upsilon"],
      ["ϕ", "phi"],
      ["χ", "chi"],
      ["ψ", "psi"],
      ["ω", "omega"],

      ["Α", "Alpha"],
      ["Β", "Beta"],
      ["Γ", "Gamma"],
      ["Δ", "Delta"],
      ["Ε", "Epsilon"],
      ["Ζ", "Zeta"],
      ["Η", "Eta"],
      ["Θ", "Theta"],
      ["Ι", "Iota"],
      ["Κ", "Kappa"],
      ["Λ", "Lambda", "Lamda"],
      ["Μ", "Mu"],
      ["Ν", "Nu"],
      ["Ξ", "Xi"],
      ["Ο", "Omicron"],
      ["Π", "Pi"],
      ["Ρ", "Rho"],
      ["Σ", "Sigma"],
      ["Τ", "Tau"],
      ["Υ", "Upsilon"],
      ["Φ", "Phi"],
      ["Χ", "Chi"],
      ["Ψ", "Psi"],
      ["Ω", "Omega"],

      ["ɛ", "varepsilon"],
      ["ϑ", "vartheta"],
      ["ϖ", "varpi"],
      ["ϱ", "varrho"],
      ["ς", "varsigma"],
      ["φ", "varphi"],

      "dx",
      "dy",
      "dz",
      "dt",

      // AM handles these as <mo>s, but we will output <mi>:
      ["ℂ", "CC"],
      ["ℕ", "NN"],
      ["ℚ", "QQ"],
      ["ℝ", "RR"],
      ["ℤ", "ZZ"],
      ["∞", "oo", "infty"],
      ["∅", "O/", "emptyset"],
      ["ℵ", "aleph"],
      ["ℏ", "hbar"],
    ]);

    this._addSymbols(OP_FLAG, [","]);

    this._addSymbols(OP_FLAG, [
      // Operation symbols:
      "^",
      "_",
      "/",
      "+",
      "-",
      ["⋅", "*", "cdot"],
      ["∗", "**", "ast"],
      ["⋆", "***", "star"],
      ["∕", "//"],
      ["∖", "\\\\", "backslash", "setminus"],
      ["×", "xx", "times"],
      ["÷", "-:", "div", "divide"],
      ["⋉", "|><", "ltimes"],
      ["⋊", "><|", "rtimes"],
      ["⋈", "|><|", "bowtie"],
      ["∘", "@", "circ"],
      ["⊕", "o+", "oplus"],
      ["⊖", "o-", "ominus"],
      ["⊗", "ox", "otimes"],
      ["⊙", "o.", "odot"],
      ["∧", "^^", "wedge"],
      ["∨", "vv", "vee"],
      ["∩", "nn", "cap"],
      ["∪", "uu", "cup"],
      ["†", "dag", "dagger"],
      ["‡", "ddag", "ddagger"],
      [":|:"],

      // Miscellaneous symbols:
      ["∂", "del", "partial"],
      ["∇", "grad", "nabla"],
      ["±", "+-", "pm"],
      ["∴", ":.", "therefore"],
      ["∵", ":'", "because"],
      ["…", "...", "ldots"],
      ["⋯", "cdots"],
      ["⋮", "vdots"],
      ["⋱", "ddots"],
      ["∠", "/_", "angle"],
      ["⌢", "frown"],
      ["△", "/_\\", "triangle"],
      ["⋄", "diamond"],
      ["□", "square"],
      ["⌊", "|__", "lfloor"],
      ["⌋", "__|", "rfloor"],
      ["⌈", "|~", "lceiling"],
      ["⌉", "~|", "rceiling"],
      ["′", "'", "prime"],

      // Spacing symbols (each space is 0.25em)
      [" ", "thinspace", "\\ "],
      ["  ", "enspace"],
      ["    ", "quad", "mspace"], // << I'm just guessing that mspace is a quad
      ["        ", "qquad"],

      // Relation symbols
      "=",
      ["≠", "!=", "ne"],
      ["<", "lt"],
      [">", "gt"],
      ["≤", "<=", "le"],
      ["≥", ">=", "ge"],
      ["≪", "mlt", "ll"],
      ["≫", "mgt", "gg"],
      ["≺", "-<", "prec"],
      ["⪯", "-<=", "preceq"],
      ["≻", ">-", "succ"],
      ["⪰", ">-=", "succeq"],
      ["∈", "in"],
      ["∉", "!in", "notin"],
      ["⊂", "sub", "subset"],
      ["⊄", "!sub", "notsubset"],
      ["⊃", "sup", "supset"],
      ["⊅", "!sup", "notsupset"],
      ["⊆", "sube", "subseteq"],
      ["⊈", "!sube", "notsubseteq"],
      ["⊇", "supe", "supseteq"],
      ["⊉", "!supe", "notsupseteq"],
      ["≡", "-=", "equiv"],
      ["≢", "!-=", "notequiv"],
      ["≅", "~=", "cong"],
      ["≈", "~~", "approx"],
      ["∼", "~", "sim"],
      ["∝", "prop", "propto"],

      // Logical Symbols
      "and",
      "or",
      ["¬", "not", "neg"],
      "if",
      ["∀", "AA", "forall"],
      ["∃", "EE", "exists"],
      ["⊥", "_|_", "bot"],
      ["⊤", "TT", "top"],
      ["⊢", "|--", "vdash"],
      ["⊨", "|==", "models"],

      // Arrows:
      ["↑", "uarr", "uparrow"],
      ["↓", "darr", "downarrow"],
      ["→", "->", "rarr", "to", "rightarrow"],
      ["↣", ">->", "rightarrowtail"],
      ["↠", "->>", "twoheadrightarrow"],
      ["⤖", ">->>", "twoheadrightarrowtail"],
      ["↦", "|->", "mapsto"],
      ["←", "<-", "larr", "leftarrow"],
      ["↔", "<->", "harr", "leftrightarrow"],
      ["⇒", "implies", "rArr", "Rightarrow"], // No <= or => due to overlap
      ["⇐", "lArr", "Leftarrow"],
      ["⇔", "<=>", "iff", "hArr", "Leftrightarrow"],
      ["⇓", "dArr", "Downarrow"],
      ["⇌", "rightleftharpoons"],
    ]);

    this._addSymbols(LBRACK_FLAG | STRETCHY_FLAG | OP_FLAG, [
      ["(", "left("],
      ["[", "left["],
      "{",
      "|:",
      ["⟨", "langle", "<<", "(:"], // 0x2329 -> 0x27e8 as it's the math version
    ]);

    this._addSymbols(LBRACK_FLAG | STRETCHY_FLAG | FORCE_HIDE_FLAG | OP_FLAG, [
      "{:",
    ]);

    this._addSymbols(RBRACK_FLAG | STRETCHY_FLAG | OP_FLAG, [
      [")", "right)"],
      ["]", "right]"],
      "}",
      ":|",
      ["⟩", "rangle", ">>", ":)"], // 0x232a -> 0x27e9
    ]);

    this._addSymbols(RBRACK_FLAG | STRETCHY_FLAG | FORCE_HIDE_FLAG | OP_FLAG, [
      ":}",
    ]);

    this._addSymbols(
      SYM_BRACK_FLAG | STRETCHY_FLAG | FORCE_SHOW_FLAG | OP_FLAG,
      ["|"],
    );

    this._addSymbols(UNARY_FLAG | OP_FLAG, [
      // Formatting unaries:
      "sqrt",
      ["abs", "Abs"],
      "floor",
      "ceil",
      "vec",
      "norm",
      "hat",
      ["bar", "overline"],
      ["ul", "underline"],
      "tilde",
      "dot",
      "ddot",
      "cancel",
      ["overarc", "overparen"],
      ["text", "mbox"],
    ]);

    this._addSymbols(UNARY_FLAG | FUNC_FLAG | OP_FLAG, [
      "sin",
      "Sin",
      "cos",
      "Cos",
      "tan",
      "Tan",
      "sinh",
      "Sinh",
      "cosh",
      "Cosh",
      "tanh",
      "Tanh",
      "cot",
      "Cot",
      "sec",
      "Sec",
      "csc",
      "Csc",
      "arcsin",
      "Arcsin",
      "arccos",
      "Arccos",
      "arctan",
      "Arctan",
      "arcsec",
      "arccsc",
      "arccot",
      "coth",
      "sech",
      "csch",
      "exp",
      "log",
      "Log",
      "ln",
      "Ln",
      "det",
      "dim",
      "ker",
      "mod",
      "gcd",
      "lcm",
      "lub",
      "glb",
    ]);

    this._addSymbols(STACKED_FLAG | UNARY_FLAG | OP_FLAG, [
      ["ubrace", "underbrace"],
      ["obrace", "overbrace"],
    ]);

    this._addSymbols(FONT_FLAG | FORCE_HIDE_FLAG | UNARY_FLAG | OP_FLAG, [
      ["bb", "mathbf"],
      ["bbb", "mathbb"],
      ["cc", "mathcal"],
      ["tt", "mathtt"],
      ["fr", "mathfrak"],
      ["sf", "mathsf"],
      "sfit",
      "bbsf",
      "bbcc",
      "bbfr",
      "bbit",
      "bbsfit",
      ["italic", "mathit"],
    ]);

    this._addSymbols(BINARY_FLAG | OP_FLAG, [
      "root",
      "frac",
      "color",
      ["overset", "stackrel"],
      "underset",
      "id",
      "class",
    ]);

    this._addSymbols(STACKED_FLAG | STRETCHY_FLAG | OP_FLAG, [
      ["∑", "sum"],
      ["∏", "prod"],
      ["⋀", "^^^", "bigwedge"],
      ["⋁", "vvv", "bigvee"],
      ["⋂", "nnn", "bigcap"],
      ["⋃", "uuu", "bigcup"],
    ]);

    this._addSymbols(STRETCHY_FLAG | OP_FLAG, [
      ["∫", "int"],
      ["∮", "oint"],
    ]);

    this._addSymbols(STACKED_FLAG | OP_FLAG, ["lim", "Lim", "min", "max"]);

    this._sortAllSymbols();
  }

  *iter(): Iterable<[string, SymInfo]> {
    for (const map of this.sym.values()) {
      for (const [from, sym] of map) {
        yield [from, sym];
      }
    }
  }

  /**
   * Will attempt to find a token at the start of the input string. Returns the
   * longest one found.
   *
   * Returns the length of the found token _in addition to_ the tok obj itself,
   * since the tok object probably is an alias, and we need to know how many
   * bytes to remove from the front of the string.
   */
  findLongestPrefix(str: string): [number, SymInfo | null] {
    const [first] = str;
    const charMap = first && this.sym.get(first);
    if (charMap) {
      for (const [token, entry] of charMap) {
        if (str.startsWith(token)) {
          // Must be the longest, since this list is sorted by length, desc.
          return [token.length, entry];
        }
      }
    }
    return [0, null];
  }

  private _sortAllSymbols() {
    for (const list of this.sym.values()) {
      list.sort(cmpStrLen);
    }
  }

  /**
   * Inserts a set of symbols into the symbol table. Does NOT resort that table,
   * since it's likely that we'll be doing a crap-ton more inserts, and we can
   * just resort at the end.
   * @param typ
   * @param names
   */
  private _addSymbols(typ: number, names: NameSet[]) {
    for (const current of names) {
      const array = Array.isArray(current) ? current : [current];
      const tok = array[0]!;
      for (const name of array) {
        const [char] = name;
        if (!char) {
          throw new Error("Invalid symbol");
        }
        let charMap = this.sym.get(char);
        if (!charMap) {
          charMap = [];
          this.sym.set(char, charMap);
        }
        if (charMap.some(([symName]) => symName === name)) {
          throw new Error(`Duplicate symbol: '${name}'`);
        }
        charMap.push([name, { tok, typ }]);
      }
    }
  }
}

function cmpStrLen(a: [string, SymInfo], b: [string, SymInfo]): number {
  // This sorts symbols with equiv lengths non-deterministically, but who cares.
  return b[0].length - a[0].length;
}
