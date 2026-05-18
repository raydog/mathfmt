/**
 * Convert an ASCIIMath string into a MathML sequence.
 *
 * @param math ASCII Math
 * @param opts Render options.
 * @returns    HTML MathML code, as a string.
 */
export declare function intoMathML(math: string, opts?: MathMLOpts): string;

/**
 * Options for the MathML rendering.
 */
export declare type MathMLOpts = {
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

export { type MathMLOpts, intoMathML };
