# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.1.0]

The first release! Yay, hopefully this means that OIDC is working. 😅

This first version is pretty basic on the API side of things, but in terms of
functionality, it should support the full list of ASCIIMath features, or at
least, all the features I could find.

We provide a few minified browser versions: The .js version will create a global
MathFmt object, which contains an `intoMathML` function, for all your formatting
needs. The .mjs version will instead _export_ that function using an ESM.

### Added

- Main `intoMathML` method, to convert ASCIIMath syntax into MathML.
