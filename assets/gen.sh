#!/bin/bash

COLOR="#99c3ff"

render() {
  # Note: ziamath occasionally breaks if some parts of MathML are rendered on the same
  # line. I don't get it (if I did, I'd probably open a PR) but until then, break all
  # tags out onto new lines:
  echo "$2" | sed 's/<m/\n<m/g' | python3 -m ziamath --size 18 | sed 's/fill="black"/fill="'$COLOR'"/g;s/stroke="black"/stroke="'$COLOR'"/g' > "./$1.svg"
}

# Generates math images for use in the README. We can't use our own stuff
# directly, since we produce MathML, and that can't be embedded in Github
# markdown.

# Uses ziamath for this. `pip install ziamath` and all that.

# For docstrings:
render docstring '<math display="block"><munderover><mo stretchy="true">∑</mo><mrow><mi>n</mi><mo>=</mo><mn>0</mn></mrow><mi>∞</mi></munderover><mfrac><mn>1</mn><msup><mn>2</mn><mi>n</mi></msup></mfrac></math>'

# For the README:
render example-sub '<math display="block"><msub><mi>β</mi><mn>0</mn></msub></math>'
render example-sup '<math display="block"><msup><mi>x</mi><mn>3</mn></msup></math>'
render example-frac '<math display="block"><mfrac><mi>a</mi><mi>b</mi></mfrac></math>'
render example-sup-brace '<math display="block"><msup><mi>α</mi><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow></msup></math>'
render example-sqrt '<math display="block"><msqrt><mrow><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><msup><mi>y</mi><mn>2</mn></msup></mrow></msqrt></math>'
render example-formula '<math display="block"><munderover><mo stretchy="true">∑</mo><mrow><mi>n</mi><mo>=</mo><mn>0</mn></mrow><mi>∞</mi></munderover><mfrac><mn>1</mn><msup><mn>2</mn><mi>n</mi></msup></mfrac><mo>=</mo><munderover><mo>lim</mo><mrow><mi>n</mi><mo>→</mo><mi>∞</mi></mrow><mspace /></munderover><mfrac><mrow><msup><mn>2</mn><mi>n</mi></msup><mo>-</mo><mn>1</mn></mrow><msup><mn>2</mn><mrow><mi>n</mi><mo>-</mo><mn>1</mn></mrow></msup></mfrac><mo>=</mo><mn>2</mn></math>'
render invisible_brace '<math display="block"><mfrac><mrow><msup><mi>x</mi><mn>2</mn></msup><mo>-</mo><mn>1</mn></mrow><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow></mfrac></math>'
render lim '<math display="block"><munderover><mo>lim</mo><mrow><mi>x</mi><mo>→</mo><mi>∞</mi></mrow><mspace /></munderover></math>'
render Lim '<math display="block"><munderover><mo>Lim</mo><mrow><mi>x</mi><mo>→</mo><mi>∞</mi></mrow><mspace /></munderover></math>'
render max '<math display="block"><munderover><mo>max</mo><mi>x</mi><mspace /></munderover></math>'
render min '<math display="block"><munderover><mo>min</mo><mi>x</mi><mspace /></munderover></math>'
render prod '<math display="block"><munderover><mo stretchy="true">∏</mo><mrow><mi>i</mi><mo>=</mo><mn>0</mn></mrow><mi>n</mi></munderover></math>'
render sum '<math display="block"><munderover><mo stretchy="true">∑</mo><mrow><mi>i</mi><mo>=</mo><mn>0</mn></mrow><mi>n</mi></munderover></math>'
render bigwedge '<math display="block"><munderover><mo stretchy="true">⋀</mo><mrow><mi>i</mi><mo>=</mo><mn>0</mn></mrow><mi>n</mi></munderover></math>'
render bigvee '<math display="block"><munderover><mo stretchy="true">⋁</mo><mrow><mi>i</mi><mo>=</mo><mn>0</mn></mrow><mi>n</mi></munderover></math>'
render bigcap '<math display="block"><munderover><mo stretchy="true">⋂</mo><mrow><mi>i</mi><mo>=</mo><mn>0</mn></mrow><mi>n</mi></munderover></math>'
render bigcup '<math display="block"><munderover><mo stretchy="true">⋃</mo><mrow><mi>i</mi><mo>=</mo><mn>0</mn></mrow><mi>n</mi></munderover></math>'
render int '<math display="block"><msubsup><mo stretchy="true">∫</mo><mn>0</mn><mi>n</mi></msubsup></math>'
render oint '<math display="block"><msub><mo stretchy="true">∮</mo><mi>C</mi></msub></math>'
render abs '<math display="block"><mrow><mo>|</mo><mi>x</mi><mo>|</mo></mrow></math>'
render overline '<math display="block"><mover accent="true"><mi>x</mi><mo>¯</mo></mover></math>'
render cancel '<math display="block"><menclose notation="updiagonalstrike"><mi>x</mi></menclose></math>'
render ceil '<math display="block"><mrow><mo>⌈</mo><mi>x</mi><mo>⌉</mo></mrow></math>'
render ddot '<math display="block"><mover accent="true"><mi>x</mi><mo>..</mo></mover></math>'
render dot '<math display="block"><mover accent="true"><mi>x</mi><mo>.</mo></mover></math>'
render floor '<math display="block"><mrow><mo>⌊</mo><mi>x</mi><mo>⌋</mo></mrow></math>'
render hat '<math display="block"><mover accent="true"><mi>x</mi><mo>^</mo></mover></math>'
render norm '<math display="block"><mrow><mo>∥</mo><mi>x</mi><mo>∥</mo></mrow></math>'
render overbrace '<math display="block"><munderover><mover accent="true"><mrow><mi>m</mi><mo>⋅</mo><mi>x</mi><mo>+</mo><mi>b</mi></mrow><mo>⏞</mo></mover><mspace /><mtext>linear</mtext></munderover></math>'
render overparen '<math display="block"><mover accent="true"><mi>x</mi><mo>⏜</mo></mover></math>'
render sqrt '<math display="block"><msqrt><mi>x</mi></msqrt></math>'
render text '<math display="block"><mtext>Hello "World"</mtext></math>'
render tilde '<math display="block"><mover accent="true"><mi>x</mi><mo>~</mo></mover></math>'
render underbrace '<math display="block"><munderover><munder accentunder="true"><mrow><msup><mi>x</mi><mn>2</mn></msup><mo>-</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1</mn></mrow><mo>⏟</mo></munder><mtext>quadratic</mtext><mspace /></munderover></math>'
render underline '<math display="block"><munder accentunder="true"><mi>x</mi><mo>̲</mo></munder></math>'
render vec '<math display="block"><mover accent="true"><mi>x</mi><mo>→</mo></mover></math>'
render color '<math display="block"><mstyle mathcolor="red"><mrow><mi>M</mi><mo>=</mo><mi>E</mi><mo>-</mo><mi>e</mi><mo>⋅</mo><mrow><mo>sin</mo><mi>E</mi></mrow></mrow></mstyle></math>'
render frac '<math display="block"><mfrac><mrow><mi>d</mi><mover accent="true"><mi>L</mi><mo>→</mo></mover></mrow><mi>dt</mi></mfrac></math>'
render stackrel '<math display="block"><mover><mi>y</mi><mi>x</mi></mover></math>'
render root '<math display="block"><mroot><mi>x</mi><mn>3</mn></mroot></math>'
render underset '<math display="block"><munder><mi>y</mi><mi>x</mi></munder></math>'
render bold-quadratic '<math display="block"><mrow><mi>𝐱</mi><mo>=</mo><mfrac><mrow><mo>-</mo><mi>𝐛</mi><mo>±</mo><msqrt><mrow><msup><mi>𝐛</mi><mn>𝟐</mn></msup><mo>-</mo><mn>𝟒</mn><mi>𝐚</mi><mi>𝐜</mi></mrow></msqrt></mrow><mrow><mn>𝟐</mn><mi>𝐚</mi></mrow></mfrac></mrow></math>'
render spacing '<math display="block"><mrow><mo stretchy="true">(</mo><mtable><mtr><mtd><mi>a</mi><mi>b</mi></mtd></mtr><mtr><mtd><mi>a</mi><mspace width="1em"/><mi>b</mi></mtd></mtr></mtable><mo stretchy="true">)</mo></mrow></math>'
render matrix-basic '<math display="block"><mrow><mo stretchy="true">[</mo><mtable><mtr><mtd><mi>a</mi></mtd><mtd><mi>b</mi></mtd></mtr><mtr><mtd><mi>c</mi></mtd><mtd><mi>d</mi></mtd></mtr></mtable><mo stretchy="true">]</mo></mrow></math>'
render matrix-vandermonde '<math display="block"><mrow><mo stretchy="true">(</mo><mtable><mtr><mtd><mn>1</mn></mtd><mtd><msub><mi>x</mi><mn>1</mn></msub></mtd><mtd><msubsup><mi>x</mi><mn>1</mn><mn>2</mn></msubsup></mtd><mtd><mo>⋯</mo></mtd><mtd><msubsup><mi>x</mi><mn>1</mn><mrow><mi>n</mi><mo>-</mo><mn>1</mn></mrow></msubsup></mtd></mtr><mtr><mtd><mn>1</mn></mtd><mtd><msub><mi>x</mi><mn>2</mn></msub></mtd><mtd><msubsup><mi>x</mi><mn>2</mn><mn>2</mn></msubsup></mtd><mtd><mo>⋯</mo></mtd><mtd><msubsup><mi>x</mi><mn>2</mn><mrow><mi>n</mi><mo>-</mo><mn>1</mn></mrow></msubsup></mtd></mtr><mtr><mtd><mn>1</mn></mtd><mtd><msub><mi>x</mi><mn>3</mn></msub></mtd><mtd><msubsup><mi>x</mi><mn>3</mn><mn>2</mn></msubsup></mtd><mtd><mo>⋯</mo></mtd><mtd><msubsup><mi>x</mi><mn>3</mn><mrow><mi>n</mi><mo>-</mo><mn>1</mn></mrow></msubsup></mtd></mtr><mtr><mtd><mo>⋮</mo></mtd><mtd><mo>⋮</mo></mtd><mtd><mo>⋮</mo></mtd><mtd><mo>⋱</mo></mtd><mtd><mo>⋮</mo></mtd></mtr><mtr><mtd><mn>1</mn></mtd><mtd><msub><mi>x</mi><mi>n</mi></msub></mtd><mtd><msubsup><mi>x</mi><mi>n</mi><mn>2</mn></msubsup></mtd><mtd><mo>⋯</mo></mtd><mtd><msubsup><mi>x</mi><mi>n</mi><mrow><mi>n</mi><mo>-</mo><mn>1</mn></mrow></msubsup></mtd></mtr></mtable><mo stretchy="true">)</mo></mrow></math>'
render matrix-augmented '<math display="block"><mrow><mo stretchy="true">[</mo><mtable columnspacing="100% 50% 50%"><mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd><mtd><mo>│</mo></mtd><mtd><mi>a</mi></mtd></mtr><mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd><mtd><mo>│</mo></mtd><mtd><mi>b</mi></mtd></mtr></mtable><mo stretchy="true">]</mo></mrow></math>'
