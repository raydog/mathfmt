# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Changes will be broken down by category:

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.
- `Internal` for internal improvements.

## [Unreleased]

### Fixed

- "Stretchy" modifier was being ignored for some math operations.
- Hardened some behavior around inputs. (Providing an object as a param in a way that violated types could cause a crash.)

### Internal

- Improved the bundle size a bit.
- Added more tests around the public API.

## [v0.1.1] - 2026-05-30

Quick hotfix.

### Fixed

- "main" attribute was wrong in npm uploaded asset.

## [v0.1.0] - 2026-05-30

The first release! Yay, hopefully this means that OIDC is working. 😅

This first version is pretty basic on the API side of things, but in terms of functionality, it should support the full list of ASCIIMath features, or at least, all the features I could find.

We provide a few minified browser versions: The .js version will create a global MathFmt object, which contains an `intoMathML` function, for all your formatting needs. The .mjs version will instead _export_ that function using an ESM.

### Added

- Main `intoMathML` method, to convert ASCIIMath syntax into MathML.
