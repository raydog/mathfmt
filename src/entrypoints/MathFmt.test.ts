import { expect } from "earl";
import { intoMathML } from "./MathFmt";

describe("MathFmt public API", function () {
  it("default args", function () {
    const math = intoMathML("1+1=2");
    expect(math).toMatchRegex(/^<math display="block"/);
  });

  it("can customize id", function () {
    const math = intoMathML("1+1=2", { id: "test" });
    expect(math).toMatchRegex(/^<math[^>]*id="test"/);
  });

  it("can customize class name", function () {
    const math = intoMathML("1+1=2", { class: "test" });
    expect(math).toMatchRegex(/^<math[^>]*class="test"/);
  });

  it("can customize style", function () {
    const math = intoMathML("1+1=2", { style: "font-size: 1.2em" });
    expect(math).toMatchRegex(/^<math[^>]*style="font-size: 1.2em"/);
  });

  it("customized attributes are escaped", function () {
    const math = intoMathML("1+1=2", { class: "<script>" });
    expect(math).toMatchRegex(/&lt;script&gt;/);
  });

  it("will not choke on bonkers parameters", function () {
    expect(() => {
      intoMathML("1+1=2", { id: null as any });
      intoMathML("1+1=2", { id: undefined as any });
      intoMathML("1+1=2", { id: 1234 as any });
      intoMathML("1+1=2", { id: (() => "no") as any });
      intoMathML("1+1=2", { id: { wrong: true } as any });
    }).not.toThrow();
  });

  it("will not choke on bonkers math string", function () {
    expect(() => {
      intoMathML(null as any);
      intoMathML(undefined as any);
      intoMathML(1234 as any);
      intoMathML((() => "no") as any);
      intoMathML({ wrong: true } as any);
    }).not.toThrow();
  });
});
