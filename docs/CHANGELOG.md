# CHANGELOG

> Format for tracking **m7Fetch** changes over time. Based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and **Semantic Versioning (SemVer)**.

Use the sections below for each release. Keep entries terse and user‑facing. Technical details (PR numbers, internal notes) belong in commit messages.

---

## \[Unreleased]

### Added

*

### Changed

*

### Deprecated

*

### Removed

*

### Fixed

*

### Security

*

### Docs

*

---

## \[x.y.z] - YYYY-MM-DD

> Short, human summary for the release. Mention notable modules (HTTP, Specs, Modules, Batch/Sync) and any **breaking changes**.

### Added

*

### Changed

*

### Deprecated

*

### Removed

*

### Fixed

*

### Security

*

### Docs

*

#### Migration Notes

* **Breaking:**
*

---

## Release Checklist (maintainers)

* [ ] Update version in `package.json` (or build metadata).
* [ ] Fill **Unreleased** → new `[x.y.z]` section; set date.
* [ ] Ensure **Migration Notes** for any breaking changes.
* [ ] Update docs pages impacted by changes (HTTP\_GUIDE, SPEC\_MANAGER, MODULES, BATCHING\_AND\_COORDINATION, etc.).
* [ ] Run tests and linters; attach CI badge if applicable.
* [ ] Tag and push: `git tag vx.y.z && git push --tags`.
* [ ] Update compare links at the bottom of this file.

---

## Conventions & Tips

* **SemVer:**

  * **MAJOR** x.0.0 → breaking changes (removals, API signature changes).
  * **MINOR** 0.y.0 → backwards‑compatible features.
  * **PATCH** 0.0.z → bug fixes and docs-only changes.
* Use the **same headings** in every section: Added / Changed / Deprecated / Removed / Fixed / Security / Docs.
* Prefix breaking items with **Breaking:** and provide a migration snippet.
* Group related changes (HTTP vs Batch vs Specs) under bullet sub‑headers if helpful.

---

## Example Entry (delete when you publish real releases)

## \[0.1.0] - 2025-08-14

> Initial public documentation set and baseline runtime APIs.

### Added

* HTTP helpers with `format: body|full|raw` and `timeout`.
* SpecManager `load()` + `call()` by `operationId`.
* ModuleManager dynamic `import()` registry by `id`.
* BatchLoader with `awaitAll` and `limit`, default `batchStatus` handler.

### Docs

* Usage Guide TOC + INTRODUCTION/INSTALLATION/QUICK\_START.
* BASIC\_CONCEPTS, HTTP\_GUIDE, CONFIGURATION\_AND\_DEFAULTS.
* SPEC\_MANAGER, AUTOLOADER, MODULES, BATCHING\_AND\_COORDINATION.
* AUTHENTICATION\_AND\_SECURITY, ERROR\_HANDLING\_AND\_DEBUGGING, CONCURRENCY\_LIMITING, EXAMPLES\_LIBRARY, TROUBLESHOOTING, GLOSSARY, CHANGELOG template.

#### Migration Notes

* N/A (first release).

---

## Link References (update for your repo)

<!-- Replace <REPO_URL> with your repository URL (e.g., https://github.com/yourorg/m7fetch) -->

\[Unreleased]: \<REPO\_URL>/compare/v0.1.0...HEAD
\[0.1.0]: \<REPO\_URL>/releases/tag/v0.1.0
