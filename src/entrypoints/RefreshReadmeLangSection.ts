import { promisify } from "node:util";
import * as fs from "node:fs/promises";
import * as child_process from "node:child_process";
import {
  BINARY_FLAG,
  FONT_FLAG,
  FUNC_FLAG,
  ID_FLAG,
  Lang,
  LBRACK_FLAG,
  OP_FLAG,
  RBRACK_FLAG,
  STACKED_FLAG,
  STRETCHY_FLAG,
  SYM_BRACK_FLAG,
  UNARY_FLAG,
} from "../lang";
import { formatText, type FontName } from "../renderer/utilities/fancyText";
import { intoMathML } from "./MathFmt";

const processSpawnPromise = promisify(child_process.spawn);

const GREEK = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡϴΣΤΥΦΧΨΩ∇αβγδεɛζηθικλμνξοπρςστυφχψω∂ϵϑϰϕϱϖ";

const START = "## Syntax";
const STOP = "## Differences from main ASCIIMath";
const DEBUG_FORMULAS = process.argv.includes("--formulas");

type PrintFn = (...lines: string[]) => void;

async function main() {
  const lang = new Lang();

  const fname = process.argv[2];
  if (!fname) {
    console.error("Usage: %s %s <readme path>", ...process.argv.slice(0, 2));
    process.exit(1);
  }

  const readme_lines = (await fs.readFile(fname, "utf8")).split("\n");
  const start_idx = readme_lines.findIndex((line) =>
    line.trim().startsWith(START),
  );
  const stop_idx = readme_lines.findIndex((line) =>
    line.trim().startsWith(STOP),
  );
  if (start_idx < 0) {
    throw new Error("Count not find line: " + START);
  }
  if (stop_idx < 0) {
    throw new Error("Count not find line: " + STOP);
  }

  let data: string[] = [];

  // Simple util, that just makes lined output a wee bit easier:
  function print(...lines: string[]) {
    for (const line of lines) {
      data.push(line);
    }
  }

  const id_names: string[] = [];
  const func_names: string[] = [];

  const id_greek: Map<string, string[]> = new Map();
  const ids: Map<string, string[]> = new Map();
  const ops: Map<string, string[]> = new Map();
  const op_solo: Map<string, string[]> = new Map();
  const op_space: Map<string, string[]> = new Map();
  const op_stacked: Map<string, string[]> = new Map();
  const op_stretchy: Map<string, string[]> = new Map();
  const op_unary: Map<string, string[]> = new Map();
  const op_binary: Map<string, string[]> = new Map();
  const op_brace: Map<string, string[]> = new Map();
  const op_fonts: Map<string, string[]> = new Map();
  const other: Map<string, string[]> = new Map();

  for (const [string, token] of lang.iter()) {
    if (!_isASCII(string)) {
      // We allow the actual unicode char to be used as the token, as it'd take
      // more code to do otherwise. But we're not interested in the non-ascii
      // versions of these tokens:
      continue;
    }

    if (token.typ & ID_FLAG) {
      if (string === token.tok) {
        id_names.push(string);
      } else if (GREEK.includes(token.tok)) {
        _getOrInsert(id_greek, token.tok, []).push(string);
      } else {
        _getOrInsert(ids, token.tok, []).push(string);
      }
    } else if (token.typ & OP_FLAG) {
      if (token.tok.trim() === "") {
        _getOrInsert(op_space, token.tok, []).push(string);
      } else if (token.typ === OP_FLAG) {
        _getOrInsert(op_solo, token.tok, []).push(string);
      } else if (token.typ & STACKED_FLAG && (token.typ & UNARY_FLAG) === 0) {
        _getOrInsert(op_stacked, token.tok, []).push(string);
      } else if (token.typ === (OP_FLAG | STRETCHY_FLAG)) {
        _getOrInsert(op_stretchy, token.tok, []).push(string);
      } else if (token.typ & FONT_FLAG) {
        _getOrInsert(op_fonts, token.tok, []).push(string);
      } else if (token.typ & (LBRACK_FLAG | RBRACK_FLAG | SYM_BRACK_FLAG)) {
        _getOrInsert(op_brace, token.tok, []).push(string);
      } else if (token.typ & UNARY_FLAG) {
        if (token.typ & FUNC_FLAG) {
          func_names.push(string);
        } else {
          _getOrInsert(op_unary, token.tok, []).push(string);
        }
      } else if (token.typ & BINARY_FLAG) {
        _getOrInsert(op_binary, token.tok, []).push(string);
      } else {
        _getOrInsert(ops, token.tok, []).push(string);
      }
    } else {
      _getOrInsert(other, token.tok, []).push(string);
    }
  }

  print(
    "## Syntax",
    "",
    "ASCIIMath is a simple format: it is parsed left to right without any real",
    "operator precedence. It will simply look for 'symbols', which are short strings",
    "with special significance. (For example, typing 'beta' will put a 'β' symbol in",
    "the output.) If a symbol can't be found at the current place in the source text,",
    "the current character is treated as as simple single-character identifier, and",
    "we move on.",
    "",
    "A few characters have special significance:",
    "",
    "- `_` will add a subscript. (eg:`beta_0` will output ![Example subscript](./assets/example-sub.svg))",
    "- `^` will add a superscript. (eg: `x^3` will output ![Example superscript](./assets/example-sup.svg))",
    "- `/` will add a fraction. (eg: `a/b` will output ![Example subscript](./assets/example-frac.svg))",
    "",
    "Most of the language will simply work like that - running from left-to-right,",
    "assembling a Math string from the symbols encountered. If you want to group",
    "some of those symbols together (eg: you want alpha to the power of x + 1) you",
    "can use parentheses / braces to group symbols. For example, `alpha^(x + 1)` will",
    "result in: ![Example complex superscript](./assets/example-sup-brace.svg).",
    "ASCIIMath supports a wide range of brace types - you can read more about those",
    "below.",
    "",
    "Some symbols come with special formatting rules. For example, `sqrt` is a",
    "'unary' symbol, which will draw a square-root bar around the symbol /",
    "parenthesized group that follows it. For example: `sqrt (x^2 + y^2)` results in:",
    "![Square root expression](./assets/example-sqrt.svg)",
    "There are a large number of unaries available, described below. There are also a",
    "few 'binary' symbols, which apply some effect to the next TWO symbols / groups.",
    "Those are also described below.",
    "",
    "Literal strings and numbers can also be included. Strings (aka: text blocks)",
    'are surrounded by double quote characters, like: `"text here"`. If you want',
    'double quotes within that string, put two double quotes in a row: `""`. Literal',
    "numbers can be included as well, and will look like: `123` or `12.34`.",
    "",
    "All of these rules can be combined together to create complex formulas:",
    "",
    '<figure style="text-align: center">',
    '  <img src="./assets/example-formula.svg" alt="Example formula">',
    "  <figcaption><code>sum_(n=0)^oo 1/2^n = lim_(n->oo)(2^n-1)/2^(n-1) = 2</code></figcaption>",
    "</figure>",
    "",
    "## Symbols",
    "",
  );

  DEBUG_FORMULAS &&
    console.log("render", "example-sub", "'" + intoMathML("beta_0") + "'");

  DEBUG_FORMULAS &&
    console.log("render", "example-sup", "'" + intoMathML("x^3") + "'");

  DEBUG_FORMULAS &&
    console.log("render", "example-frac", "'" + intoMathML("a/b") + "'");

  DEBUG_FORMULAS &&
    console.log(
      "render",
      "example-sup-brace",
      "'" + intoMathML("alpha^(x + 1)") + "'",
    );

  DEBUG_FORMULAS &&
    console.log(
      "render",
      "example-sqrt",
      "'" + intoMathML("sqrt (x^2 + y^2)") + "'",
    );

  DEBUG_FORMULAS &&
    console.log(
      "render",
      "example-formula",
      "'" +
        intoMathML("sum_(n=0)^oo 1/2^n = lim_(n->oo)(2^n-1)/2^(n-1) = 2") +
        "'",
    );

  printGreek(print, id_greek);
  printIdOther(print, ids);
  printBasic(print, id_names, func_names);

  printSoloOp(print, op_solo);
  printBraces(print, op_brace);
  printStackedOps(print, op_stacked);
  printStretchyOps(print, op_stretchy);
  printUnaryOps(print, op_unary);
  printBinaryOps(print, op_binary);
  printFonts(print, op_fonts);
  printSpacingOps(print, op_space);

  printMatrix(print);
  printGrammar(print);

  if (ops.size) {
    console.warn("Unused OP:", ops);
  }

  if (other.size) {
    console.warn("Unused Tokens:", other);
  }

  const updated = [
    ...readme_lines.slice(0, start_idx),
    ...data,
    ...readme_lines.slice(stop_idx),
  ];
  await fs.writeFile(fname, updated.map((l) => l + "\n").join(""), "utf8");

  await processSpawnPromise("prettier", ["--write", fname], {});
}

function printGreek(print: PrintFn, map: Map<string, string[]>) {
  print(
    "### Greek Letters",
    "",
    "Most greek letters can be simply referenced by name. A few extra mathematically",
    "significant variations of these symbols are also available.",
    "",
    "Upper Case | Lower case | Variant",
    "-----------|------------|---------",
  );
  const groups: Map<
    string,
    { o: number; u: string[]; l: string[]; v: string[] }
  > = new Map();

  for (const [unicode, aliases] of map.entries()) {
    const first = aliases[0]!;
    let kind: "u" | "l" | "v" = first === first.toLowerCase() ? "l" : "u";
    // How letters will find each other:
    // Find longest alias:
    let id = [...aliases].sort((a, b) => -cmpStrLen(a, b))[0]!.toUpperCase();
    if (id.startsWith("VAR")) {
      kind = "v";
      id = id.slice(3);
    }
    const cur = _getOrInsert(groups, id, { o: 100, u: [], l: [], v: [] });
    cur[kind][0] = unicode;
    cur[kind].push(...aliases);
    const idx = GREEK.indexOf(unicode);
    if (idx >= 0 && idx < cur.o) {
      cur.o = idx;
    }
  }

  const rows = [...groups.values()];
  rows.sort((a, b) => {
    // Sort a and b based on the min index of any of the symbols in the row:
    return a.o - b.o;
  });

  print(
    ...rows.map(({ u, l, v }) => {
      const ustr = u.length
        ? `${u[0]}: ${u.slice(1).map(tokenString).join(" ")}`
        : "";
      const lstr = l.length
        ? `${l[0]}: ${l.slice(1).map(tokenString).join(" ")}`
        : "";
      const vstr = v.length
        ? `${v[0]}: ${v.slice(1).map(tokenString).join(" ")}`
        : "";

      return [ustr, lstr, vstr].join(" | ");
    }),
    "",
  );
}

function printIdOther(print: PrintFn, other: Map<string, string[]>) {
  print(
    "### Other Math Identifiers",
    "",
    "Symbols | Output",
    "--------|-------",
    ...[...other.keys()].sort().map((key) => {
      const aliases = [...other.get(key)!].sort(cmpStrLen);
      return `${aliases.map(tokenString).join(" ")} | ${key}`;
    }),
    "",
  );
}

function printBasic(print: PrintFn, ids: string[], funcs: string[]) {
  print(
    "### Standard Functions and Other Identifiers",
    "",
    "ASCIIMath knows about a number of basic identifiers and functions, and will",
    "describe these symbols to MathML in a way that is appropriate. For example,",
    "identifiers like 'dx' will be presented to MathML as a single identifier, while",
    "functions like 'sin' or 'tan' will be rendered as operators, and will have some",
    "special spacing + grouping rules applied with their arguments.",
    "",
    "#### Identifiers",
    ...wrap80([...ids].sort(cmpNoCase).map(tokenString)),
    "",
    "#### Standard Functions",
    ...wrap80([...funcs].sort(cmpNoCase).map(tokenString)),
    "",
  );
}

function printSoloOp(print: PrintFn, solo: Map<string, string[]>) {
  print(
    "### Basic Op symbols",
    "",
    "A large number of basic op symbols are available.",
    "",
    "Symbols | Output",
    "--------|---------",
    ...[...solo.keys()].sort(cmpNoCase).map((key) => {
      const aliases = solo
        .get(key)!
        .filter((x) => x.trim())
        .sort(cmpStrLen);
      return (
        aliases.map(tokenString).join(" ") +
        " | " +
        _safe(key === ":|:" ? "|" : key)
      );
    }),
    "",
  );
}

function printStackedOps(print: PrintFn, stacks: Map<string, string[]>) {
  print(
    '### "Stacked" Operator Symbols',
    "",
    "A stacked symbol will render the superscript and subscripts above and below the",
    "operator, which looks pretty neat.",
    "",
    "Symbols | Example | Output",
    "--------|---------|---------",
    ...[...stacks.keys()].sort(cmpNoCase).map((key) => {
      const aliases = stacks.get(key)!.sort(cmpStrLen);
      const name = aliases[0]!;
      const longname = aliases[aliases.length - 1]!;
      let am: string;
      switch (key.toLowerCase()) {
        case "lim":
          am = `${name}_{x->oo}`;
          break;
        case "min":
        case "max":
          am = `${name}_x`;
          break;
        default:
          am = `${name}_{i=0}^n`;
          break;
      }
      DEBUG_FORMULAS &&
        console.log("render", longname, "'" + intoMathML(am) + "'");
      return [
        aliases.map(tokenString).join(" "),
        tokenString(am),
        `![${longname} formula](./assets/${longname}.svg)`,
      ].join(" | ");
    }),
    "",
  );
}

function printStretchyOps(print: PrintFn, stretchy: Map<string, string[]>) {
  print(
    '### "Stretchy" Operator Symbols',
    "",
    'A few other symbols are "stretchy" - in that, they\'ll stretch to match the',
    "height of the formula next to it.",
    "",
    "Symbols | Example | Output",
    "--------|---------|---------",
    ...[...stretchy.keys()].sort(cmpNoCase).map((key) => {
      const aliases = stretchy.get(key)!.sort(cmpStrLen);
      const name = aliases[0]!;
      const longname = aliases[aliases.length - 1]!;
      const am: string = name === "oint" ? `${name}_C` : `${name}_0^n`;
      DEBUG_FORMULAS &&
        console.log("render", longname, "'" + intoMathML(am) + "'");
      return [
        aliases.map(tokenString).join(" "),
        tokenString(am),
        `![${longname} formula](./assets/${longname}.svg)`,
      ].join(" | ");
    }),
    "",
  );
}

function printBraces(print: PrintFn, braces: Map<string, string[]>) {
  // Braces are pretty specific, so we'll manually call out the braces that we
  // know about, and warn if there's anything left.
  const pluck = (name: string): [string, string[]] | null => {
    const found = braces
      .entries()
      .find(([sym, aliases]) => aliases.includes(name));
    if (found) {
      braces.delete(found[0]);
    }
    return found ?? null;
  };
  const row = (left: string, right: string): string => {
    const l = pluck(left),
      r = left === right ? l : pluck(right);
    const lstr = left === "{:" ? "" : left === "|:" ? "|" : (l?.[0] ?? "");
    const rstr = right === ":}" ? "" : right === ":|" ? "|" : (r?.[0] ?? "");
    return [
      l ? l[1].sort(cmpStrLen).map(tokenString).join(" ") : "",
      r ? r[1].sort(cmpStrLen).map(tokenString).join(" ") : "",
      _safe(lstr + " ... " + rstr),
    ].join(" | ");
  };

  print(
    "### Parenthesis and Other Braces",
    "",
    "A number of different braces are supported, and can be (with one exception)",
    "freely mix-and-matched, just so long as left braces are paired with right",
    "braces.",
    "",
    "The brace symbols are usually visible, but can sometimes be made invisible due",
    "to certain features of the formula's structure. For example:",
    "",
    '<figure style="text-align: center">',
    '  <img src="./assets/invisible_brace.svg" alt="Math formula showing invisible braces">',
    "  <figcaption><code>{x^2-1}/{x+1}</code></figcaption>",
    "</figure>",
    "",
    "If you want to keep those braces in the output, add another set of braces around",
    "each section - the outside ones will be hidden, the inside ones will be shown.",
    "",
    "If you _WANT_ the braces to be hidden in a situation where they'd normally be",
    "shown, use the `{:` and `:}` braces - they'll be invisible in the output.",
    "",
    "Left Brace Symbols | Right Brace Symbols | Output",
    "-------------------|---------------------|----------",
    row("(", ")"),
    row("[", "]"),
    row("{", "}"),
    row("(:", ":)"),
    row("|:", ":|"),
    row("{:", ":}"),
    "",
    "Additionally, `|` braces without the `:` bits are also supported, but hey differ",
    "from the other braces, and they cannot be mix-and-matched with other braces.",
    "They MUST be paired with another `|` brace.",
    "",
    "Left Brace Symbols | Right Brace Symbols | Output",
    "-------------------|---------------------|----------",
    row("|", "|"),
    "",
  );

  DEBUG_FORMULAS &&
    console.log(
      "render",
      "invisible_brace",
      "'" + intoMathML("{x^2-1}/{x+1}") + "'",
    );

  if (braces.size) {
    console.warn("Missed Braces:", braces);
  }
}

function printUnaryOps(print: PrintFn, unary: Map<string, string[]>) {
  print(
    "### Unary Symbols",
    "",
    "A unary is a symbol that will apply some sort of effect to the symbol / term",
    "immediately after it, which is called the 'argument'.",
    "",
    "Unary Symbols | Example | Output",
    "--------------|---------|---------",
    ...[...unary.keys()].sort(cmpNoCase).map((key) => {
      const aliases = unary.get(key)!.sort(cmpStrLen);
      let name = aliases[0]!;
      let longname = aliases[aliases.length - 1]!;
      let am: string;
      switch (name) {
        case "obrace":
          am = `${name} (m*x + b)^"linear"`;
          break;
        case "ubrace":
          am = `${name} (x^2 - 2x + 1)_"quadratic"`;
          break;
        case "mbox":
        case "text":
          name = longname = "text";
          am = `${name}(Hello "World")`;
          break;
        default:
          am = `${name} x`;
      }
      DEBUG_FORMULAS &&
        console.log(
          "render",
          longname.toLowerCase(),
          "'" + intoMathML(am) + "'",
        );
      return [
        aliases.map(tokenString).join(" "),
        tokenString(am),
        `![${longname} formula](./assets/${longname.toLowerCase()}.svg)`,
      ].join(" | ");
    }),
    "",
    "Note: `cancel` depends on the non-standard &lt;menclose&gt; tag. Support between",
    "browsers varies.",
    "",
  );
}

function printBinaryOps(print: PrintFn, binary: Map<string, string[]>) {
  const special = new Set(["id", "class"]);

  print(
    "### Binary Symbols",
    "",
    "A binary is a symbol that will apply some sort of special layout action using",
    "the next _two_ symbols / terms after it, which are called the 'arguments'. Which",
    "effect is applied varies based on the symbol:",
    "",
    "Binary Symbols | Example | Output",
    "---------------|---------|---------",
    ...[...binary.keys()]
      .filter((key) => !special.has(key))
      .sort(cmpNoCase)
      .map((key) => {
        const aliases = binary.get(key)!.sort(cmpStrLen);
        const name = aliases[0]!;
        const longname = aliases[aliases.length - 1]!;
        let am: string;
        switch (name) {
          case "color":
            am = `${name}(red)(M = E-e*sin E)`;
            break;
          case "frac":
            am = `${name}(d vec L) dt`;
            break;
          case "root":
            am = `${name} 3 x`;
            break;
          default:
            am = `${name} x y`;
        }
        DEBUG_FORMULAS &&
          console.log("render", longname, "'" + intoMathML(am) + "'");
        return [
          aliases.map(tokenString).join(" "),
          tokenString(am),
          `![${longname} formula](./assets/${longname}.svg)`,
        ].join(" | ");
      }),
    "",
    "A few additional notes:",
    "- For `color`, textual color names, `#rgb`, `#rrggbb` and `#rrggbbaa` strings are",
    "  all supported.",
    "- For `root`, Chrome-based browsers render these VERY poorly when the enclosed",
    "  segment is more than 1 line tall. Firefox gets it right, however.",
    "",
    "There are also two special HTML-oriented binary symbols available: `id` and",
    "`class`, which allows you to set the id / class name of a particular element in",
    "the formula.",
    "",
    "Binary HTML Symbols | Example | Description",
    "---------------|---------|---------",
    "`id` | `id (special-id) (x^2)` | Will set the id of the HTML entity that contains 'x^2' to 'special-id'",
    "`class` | `class (class-name) (x^2)` | Will set the class of the HTML entity that contains 'x^2' to 'class-name'",
  );
}

function printFonts(print: PrintFn, fonts: Map<string, string[]>) {
  const PANGRAM = "The Five Boxing Wizards Jump Quickly.";
  print(
    "### Unicode Lettering Styles",
    "",
    "A number of different lettering styles can be applied to strings or terms using",
    'the special "font" unary symbols.',
    "",
    "These styles are applied by transforming the characters in the argument into the",
    "'Mathematical Alphanumeric Symbols' Unicode block. All styles support the latin",
    "upper/lowercase letters. Some might additionally support numbers, or the greek",
    "alphabet - it's all up to what is defined within that Unicode block.",
    "",
    "Letter Style Symbols | Example",
    "---------------------|----------",
  );
  const names = [...fonts.keys()].sort(cmpNoCase);
  print(
    ...names.map((name) => {
      const aliases = fonts
        .get(name)!
        .filter((alias) => alias != name)
        .sort();
      return [
        [name, ...aliases].map(tokenString).join(" "),
        formatText(name as FontName, PANGRAM),
      ].join(" | ");
    }),
    "",
    'These styles can either be applied to text (eg: `bb"Text"`), but can also be',
    "applied directly to groups of symbols.",
    "",
    '<figure style="text-align: center">',
    '  <img src="./assets/bold-quadratic.svg" alt="Bold quadratic formula">',
    "  <figcaption><code>bb (x=(-b+-sqrt(b^2-4ac))/(2a))</code></figcaption>",
    "</figure>",
    "",
  );
  DEBUG_FORMULAS &&
    console.log(
      "render",
      "bold-quadratic",
      "'" + intoMathML("bb (x=(-b+-sqrt(b^2-4ac))/(2a))") + "'",
    );
}

function printSpacingOps(print: PrintFn, spacing: Map<string, string[]>) {
  print(
    "### Spacing Symbols",
    "",
    "A few symbols exist to introduce whitespace into the rendered formula.",
    "",
    '<figure style="text-align: center">',
    '  <img src="./assets/spacing.svg" alt="Formula showcasing spacing commands">',
    "  <figcaption><code>((a b),(a quad b))</code></figcaption>",
    "</figure>",
    "",
    "Spacing Symbols | Output",
    "----------------|--------",
    ...[...spacing.keys()].sort(cmpStrLen).map((key) => {
      const aliases = spacing
        .get(key)!
        .sort(cmpStrLen)
        .filter((x) => x.trim());
      return [
        aliases.map(tokenString).join(" "),
        tokenString(`<mspace width="${0.25 * key.length}em"/>`),
      ].join(" | ");
    }),
    "",
  );

  DEBUG_FORMULAS &&
    console.log(
      "render",
      "spacing",
      "'" + intoMathML("((a b),(a quad b))") + "'",
    );
}

function printMatrix(print: PrintFn) {
  print(
    "## Matrixes",
    "",
    "Parenthesized lists of lists are treated as Matrixes, and rendered in a grid.",
    "The outer-most braces are stretched to match the height of the full matrix.",
    "",
    '<figure style="text-align: center">',
    '  <img src="./assets/matrix-basic.svg" alt="Basic matrix">',
    "  <figcaption><code>[(a,b), (c,d)]</code></figcaption>",
    "</figure>",
    "",
    "Each 'row' in a matrix needs the same number of items it it, so that the number",
    "of columns in the matrix is consistent. However, the cells in the matrix can be",
    "arbitrarily complex.",
    "",
    "![Vandermonde Matrix](./assets/matrix-vandermonde.svg)",
    "```",
    "( (1,     x_1,   x_1^2, cdots, x_1^{n-1}),",
    "  (1,     x_2,   x_2^2, cdots, x_2^{n-1}),",
    "  (1,     x_3,   x_3^2, cdots, x_3^{n-1}),",
    "  (vdots, vdots, vdots, ddots, vdots    ),",
    "  (1,     x_n,   x_n^2, cdots, x_n^{n-1}) )",
    "```",
    "",
    "Augmented matrixes can be drawn by filling a column with `|` symbols.",
    "",
    '<figure style="text-align: center">',
    '  <img src="./assets/matrix-augmented.svg" alt="Augmented matrix">',
    "  <figcaption><code>[(1,2,|,a), (3,4,|,b)]</code></figcaption>",
    "</figure>",
    "",
    "Note: The main ASCIIMathML project uses the 'columnlines' attribute to draw a",
    "solid line through the augmented matrix. This looks really pretty, but sadly,",
    "Chrome doesn't support that feature, and this leaves the matrix without any",
    "visible separator, which is very confusing. (Honestly, Chrome's MathML support",
    "is pretty lacking, generally.) So this library instead uses an extra-tall",
    "unicode bar character, and tweaks the column spacing to draw the separator",
    "column a little tighter. This doesn't look AS good, but still looks _alright_.",
    "Plus, it'll yield a drawing that is more visually understandable whenever the",
    "browser only supports a _subset_ of MathML.",
    "",
  );

  DEBUG_FORMULAS &&
    console.log(
      "render",
      "matrix-basic",
      "'" + intoMathML("[(a,b), (c,d)]") + "'",
    );

  DEBUG_FORMULAS &&
    console.log(
      "render",
      "matrix-vandermonde",
      "'" +
        intoMathML(
          "( (1,x_1,x_1^2,cdots,x_1^{n-1}), (1,x_2,x_2^2,cdots,x_2^{n-1}), (1,x_3,x_3^2,cdots,x_3^{n-1}), (vdots,vdots,vdots, ddots,vdots), (1, x_n, x_n^2, cdots, x_n^{n-1}) )",
        ) +
        "'",
    );

  DEBUG_FORMULAS &&
    console.log(
      "render",
      "matrix-augmented",
      "'" + intoMathML("[(1,2,|,a), (3,4,|,b)]") + "'",
    );
}

function printGrammar(print: PrintFn) {
  print(
    "## Language Grammar",
    "",
    "In EBNF, ASCIIMath looks like:",
    "",
    "```ebnf",
    "expr := term*;",
    "term := simp ('_' simp)? ('^' simp)? ('/' term)?;",
    "simp := paren | unary | binary | leaf;",
    "paren := ('(' | '[' | ...) expr (')' | ']' | ...);",
    "unary := ('sqrt' | 'floor' | ...) simp;",
    "binary := ('root' | 'frac' | ...) simp simp;",
    "leaf := (str literal) | (num literal) | (symbol) | (char);",
    "```",
    "",
    "Where:",
    '- `(str literal)` is a "double quoted string", with internal `""` sequences',
    '   becoming literal `"` characters.',
    "- `(num literal)` is an integer or floating-point string. Leading / trailing",
    "   decimal point characters are allowed. (ie: `123.` and `.123` are both fine.)",
    "- `(symbol)` is one of the many special symbols described in this document.",
    "- `(char)` is a single character, which will be used as a math identifier.",
    "",
  );
}

function _getOrInsert<K, V>(map: Map<K, V>, key: K, def: V): V {
  const value = map.get(key);
  if (value) {
    return value;
  }
  map.set(key, def);
  return def;
}

function _isASCII(str: string): boolean {
  for (const ch of str) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x20 || code >= 0x7f) {
      return false;
    }
  }
  return true;
}

function tokenString(tok: string): string {
  return "<code>" + _safe(tok) + "</code>";
}

function wrap80(toks: string[]): string[] {
  let lines = [];
  let line = "";
  for (const tok of toks) {
    if (line.length + tok.length + 1 > 80) {
      lines.push(line);
      line = "";
    }
    if (line) {
      line += " ";
    }
    line += tok;
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}

function cmpNoCase(a: string, b: string) {
  a = a.toLowerCase();
  b = b.toLowerCase();
  return a < b ? -1 : a > b ? 1 : 0;
}

function cmpStrLen(a: string, b: string) {
  // Fallback on case-insensitive ordering, just to give deterministic results:
  return a.length < b.length ? -1 : a.length > b.length ? 1 : cmpNoCase(a, b);
}

// TODO: This from he or html-entities
function _safe(text: string): string {
  return text.replace(/[<>&"'|`\\]/g, (char) => {
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
      case "|":
        return "&mid;";
      case "`":
        return "&grave;";
      case "\\":
        return "&bsol;";
      default:
        throw new Error("Unexpected char: " + char);
    }
  });
}

main();
