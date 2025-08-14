↑ [Usage Guide Index](../TOC.md) | ← [Core API OVERVIEW](OVERVIEW.md)

# CORE\_API\_VERSIONING (Versioning & Compatibility)

## Overview

m7Fetch follows **semantic versioning** principles (MAJOR.MINOR.PATCH) for public API stability. Breaking changes are gated to **major releases**. Minor and patch updates are additive or bug‑fix only.

This page covers:

* How versioning works for core classes and APIs
* How to maintain compatibility across upgrades
* Recommended practices for consuming the library in long‑lived projects

---

## Versioning Policy

### 1. **MAJOR** — Breaking Changes

* Removal or renaming of public methods/properties.
* Changes to method signatures or option shapes.
* Alterations to default behaviors that could break existing code.
* Removal of deprecated features flagged in prior major versions.

### 2. **MINOR** — Backwards‑Compatible Additions

* New public methods, classes, or configuration options.
* Additional allowed values in enums (e.g., `FETCH_CONSTANTS`).
* New batch handlers, spec loaders, or module loader types.

### 3. **PATCH** — Bug Fixes / Internal Improvements

* Non‑breaking bug fixes.
* Performance optimizations.
* Documentation and tooling changes.

---

## Compatibility Guidelines

### For Consumers

* Pin a **minor version range** (`^1.4.0`) to get bug fixes and additive features without breaking changes.
* Review changelogs before bumping major versions.
* Use `format:'full'` when you need stable inspection of responses; body shapes can vary by endpoint, but the `full` envelope is stable.
* Avoid relying on undocumented internal properties — they may change in any release.

### For Extenders

* If subclassing core classes, prefer using documented methods and hooks.
* Watch for deprecation notices in the release notes; migrate before the next major.
* If overriding defaults (e.g., `FETCH_DEFAULTS`), verify against `FETCH_CONSTANTS` after minor bumps.

---

## Deprecation Process

* Deprecated APIs will be annotated in docs and release notes.
* Removal will occur **no sooner** than the next major release.
* Where feasible, shims or adapter methods will be provided during the deprecation period.

---

## Testing & Verification

* Maintain integration tests for your usage of m7Fetch APIs.
* After upgrading, run full test suites before deploying.
* For network‑sensitive changes (HTTP, SpecManager), use a staging environment to validate against your APIs.

---

## Example Upgrade Workflow

```sh
# Update to latest minor within major 1
npm install m7fetch@^1.4.0

# Review changelog for any new features you might use
# Run test suite
npm test
```

When upgrading to a **new major** (e.g., 1.x → 2.x):

1. Read the migration guide in the repo/docs.
2. Update code where APIs were removed or changed.
3. Run tests and manual checks.

---

## Resources

* [Semantic Versioning 2.0.0](https://semver.org/)
* Project changelog (in repo root)
* Migration guides (docs/migration/)
