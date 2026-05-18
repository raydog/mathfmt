import { Lang } from "../lang";
import { lexer } from "../lexer";
import { parse } from "../parser";
import renderToMathML from "../renderer/mathml";

const lang = new Lang();

/**
 * Options for the MathML rendering.
 */
export type MathMLOpts = {
  /**
   * Id attribute to attach to the root `<math>` element.
   */
  id?: string;

  /**
   * Class attribute to attach to the root `<math>` element.
   */
  class?: string;

  /**
   * Custom CSS style, that will be attached to the root `<math>` element.
   *
   * This value will be HTML-escaped, and then placed _verbatim_ in the `style`
   * attribute. If any of the fields are from an untrusted source, be sure to
   * escape the value properly. This library does _none_ of that.
   */
  style?: string;

  /**
   * True if this text is destined to be inlined with other text. If so, the
   * browser might decide to render the MathML in a more vertically-compact
   * manner. (Such as rendering under-over elements, such as the Sum operator,
   * with their subscripts and superscripts off to the side.)
   *
   * Default is false, which uses more vertical room to make things look pretty.
   */
  inline?: boolean;
};

/**
 * Convert an ASCIIMath string into a MathML sequence.
 *
 * `sum_(n=0)^oo 1/2^n`
 *
 * ![Sum of n from 0 to infinity of 1 over 2 to the N](../../assets/docstring.svg)
 *
 * @param math ASCII Math string.
 * @returns    HTML MathML code, as a string.
 */
export function intoMathML(math: string, opts: MathMLOpts = {}): string {
  const toks = lexer(lang, math);
  const ast = parse(toks);
  return renderToMathML(math, ast, opts);
}
