import {
  ID_FLAG,
  NUMBER_FLAG,
  STRING_FLAG,
  type Lang,
  type SymInfo,
} from "./lang";

export type Token = {
  /** Type flags. */
  typ: number;

  /** The index in the source text where this token starts. */
  idx: number;

  /** Language symbol. */
  sym?: string;

  /** Numeric literal. */
  num?: string;

  /** String literal. */
  str?: string;

  /** Character identifier */
  char?: string;
};

const LEADING_WS_RE = /^\s+/;
const NUMBER_RE = /^(?:\.\d+|\d+(?:\.\d*)?)/;
const STRING_RE = /^(?:"[^"]*")+/;

export function lexer(lang: Lang, src: string): Token[] {
  const out: Token[] = [];
  let idx = 0;
  src = String(src ?? "");

  function _step(n: number) {
    idx += n;
    src = src.slice(n);
  }

  while (src.length) {
    // Skip all whitespace while looking for tokens:
    const skip = _eatSpace(src);
    skip && _step(skip);

    // Might have hit end:
    if (!src) {
      break;
    }

    // Maybe a lang-supplied symbol?
    const [symLen, sym] = lang.findLongestPrefix(src);
    if (symLen && sym) {
      out.push({ typ: sym.typ, idx, sym: sym.tok });
      _step(symLen);
      continue;
    }

    // Maybe a numeric literal?
    const num = _eatNumber(src);
    if (num) {
      out.push({ typ: NUMBER_FLAG, idx, num });
      _step(num.length);
      continue;
    }

    // Maybe a string literal?
    const str = _eatString(src);
    if (str != null) {
      out.push({ typ: STRING_FLAG, idx, str: _intoInternalString(str) });
      _step(str.length);
      continue;
    }

    // Else, fall back on a single char identifier. (The "" default value is
    // only for TS, we've already checked the string length at this point, and
    // so there should be SOMETHING in there...)
    const [char = ""] = src;
    out.push({ typ: ID_FLAG, idx, char });
    _step(char.length);
  }
  return out;
}

function _eatSpace(src: string): number {
  const m = src.match(LEADING_WS_RE);
  if (!m) {
    return 0;
  }
  return m[0].length;
}

/**
 * Eat a numeric literal, if one is there.
 *
 * The ASCIIMath ruby library seems to require at least one digit to the left of
 * any decimal points, but the OG AM library didn't have that requirement, so
 * I'll attempt to emulate the more permissive behavior of the orig library.
 *
 * Numbers don't have unary "-" prefixes as they'd be parsed as "-" ops above.
 */
function _eatNumber(src: string): string | null {
  const m = src.match(NUMBER_RE);
  if (!m) {
    return null;
  }
  return m[0];
}

/**
 * Eat a string literal, if one is there.
 *
 * In the orig syntax, there was no mechanism for a string to contain a " char.
 * We allow " chars by using a "". (it's the easiest to support with the
 * smallest change on language impact.)
 */
function _eatString(src: string): string | null {
  const m = src.match(STRING_RE);
  if (!m) {
    return null;
  }
  return m[0];
}

function _intoInternalString(str: string): string {
  const trimmed = str.slice(1, -1);
  return trimmed.replaceAll('""', '"');
}
