/**
 * Font definition. Allows for optional rulesets for latch alphabets, greek
 * alphabets, and digits.
 *
 * Format of each ruleset is: [
 *  upper_offset, lower_offset, upper_overrides?, lower_overrides
 * ]
 */
type UnicodeFont = {
  _latin?: [number, number, Record<number, string>?, Record<number, string>?];
  _greek?: [number, number, Record<number, string>?, Record<number, string>?];
  _digit?: number;
};

// Note: These tables from: https://en.wikipedia.org/wiki/Mathematical_Alphanumeric_Symbols
// Bless you, Wikipedia. <3

const SerifBold: UnicodeFont = {
  _latin: [0x1d400, 0x1d41a],
  _greek: [0x1d6a8, 0x1d6c2],
  _digit: 0x1d7ce,
};
const SerifItalic: UnicodeFont = {
  _latin: [0x1d434, 0x1d44e, {}, { 7: "ℎ" }],
  _greek: [0x1d6e2, 0x1d6fc],
};
const SerifBoldItalic: UnicodeFont = {
  _latin: [0x1d468, 0x1d482],
  _greek: [0x1d71c, 0x1d736],
};
const SansNormal: UnicodeFont = { _latin: [0x1d5a0, 0x1d5ba], _digit: 0x1d7e2 };
const SansBold: UnicodeFont = {
  _latin: [0x1d5d4, 0x1d5ee],
  _greek: [0x1d756, 0x1d770],
  _digit: 0x1d7ec,
};
const SansItalic: UnicodeFont = { _latin: [0x1d608, 0x1d622] };
const SansBoldItalic: UnicodeFont = {
  _latin: [0x1d63c, 0x1d656],
  _greek: [0x1d790, 0x1d7aa],
};
const ScriptNormal: UnicodeFont = {
  _latin: [
    0x1d49c,
    0x1d4b6,
    { 1: "ℬ", 4: "ℰ", 5: "ℱ", 7: "ℋ", 8: "ℐ", 11: "ℒ", 12: "ℳ", 17: "ℛ" },
    { 4: "ℯ", 6: "ℊ", 14: "ℴ" },
  ],
};
const ScriptBold: UnicodeFont = { _latin: [0x1d4d0, 0x1d4ea] };
const FrakturNormal: UnicodeFont = {
  _latin: [0x1d504, 0x1d51e, { 2: "ℭ", 7: "ℌ", 8: "ℑ", 17: "ℜ", 25: "ℨ" }],
};
const FrakturBold: UnicodeFont = { _latin: [0x1d56c, 0x1d586] };
const Monospace: UnicodeFont = { _latin: [0x1d670, 0x1d68a], _digit: 0x1d7f6 };
const DoubleStruck: UnicodeFont = {
  _latin: [
    0x1d538,
    0x1d552,
    { 2: "ℂ", 7: "ℍ", 13: "ℕ", 15: "ℙ", 16: "ℚ", 17: "ℝ", 25: "ℤ" },
  ],
  _digit: 0x1d7d8,
};

const FONTS = {
  bb: SerifBold,
  bbb: DoubleStruck,
  bbcc: ScriptBold,
  bbfr: FrakturBold,
  bbit: SerifBoldItalic,
  bbsf: SansBold,
  bbsfit: SansBoldItalic,
  cc: ScriptNormal,
  fr: FrakturNormal,
  italic: SerifItalic,
  sf: SansNormal,
  sfit: SansItalic,
  tt: Monospace,
} satisfies Record<string, UnicodeFont>;

/**
 * A valid font style, to be used in the formatter.
 */
export type FontName = keyof typeof FONTS;

export function formatText(font: FontName, str: string): string {
  if (!font || !FONTS.hasOwnProperty(font)) {
    return str;
  }
  const dict = FONTS[font];
  let out = "";
  for (const ch of str) {
    out += transformChar(dict, ch);
  }
  return out;
}

function transformChar(
  { _latin, _greek, _digit }: UnicodeFont,
  ch: string,
): string {
  const code = ch.charCodeAt(0);
  let idx: number | null;
  if (_latin != null) {
    if ((idx = upperLatinIdx(code)) != null) {
      return (_latin[2] && _latin[2][idx]) ?? unicodeChar(_latin[0] + idx);
    }
    if ((idx = lowerLatinIdx(code)) != null) {
      return (_latin[3] && _latin[3][idx]) ?? unicodeChar(_latin[1] + idx);
    }
  }
  if (_digit != null) {
    if ((idx = digitIdx(code)) != null) {
      return unicodeChar(_digit + idx);
    }
  }
  if (_greek != null) {
    if ((idx = upperGreekIdx(code)) != null) {
      return (_greek[2] && _greek[2][idx]) ?? unicodeChar(_greek[0] + idx);
    }
    if ((idx = lowerGreekIdx(code)) != null) {
      return (_greek[3] && _greek[3][idx]) ?? unicodeChar(_greek[1] + idx);
    }
  }
  // Else, no change.
  return ch;
}

function unicodeChar(code: number): string {
  const base = code - 0x10000;
  const high = 0xd800 | (base >> 10);
  const low = 0xdc00 | (base & 0x3ff);
  return String.fromCharCode(high, low);
}

function upperLatinIdx(code: number): number | null {
  return code >= 65 && code <= 90 ? code - 65 : null;
}

function lowerLatinIdx(code: number): number | null {
  return code >= 97 && code <= 122 ? code - 97 : null;
}

function upperGreekIdx(code: number): number | null {
  switch (code) {
    case 0x03f4:
      return 17;
    case 0x2207:
      return 25;
    default:
      return code >= 0x0391 && code <= 0x03a9 ? code - 0x0391 : null;
  }
}

function lowerGreekIdx(code: number): number | null {
  switch (code) {
    case 0x2202:
      return 25;
    case 0x03f5:
      return 26;
    case 0x03d1:
      return 27;
    case 0x03f0:
      return 28;
    case 0x03d5:
      return 29;
    case 0x03f1:
      return 30;
    case 0x03d6:
      return 31;
    default:
      return code >= 0x03b1 && code <= 0x03c9 ? code - 0x03b1 : null;
  }
}

function digitIdx(code: number): number | null {
  return code >= 48 && code <= 57 ? code - 48 : null;
}
