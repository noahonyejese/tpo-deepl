# Changelog

All notable changes to this project will be documented in this file.

---

## [1.2.1] - 2025-06-14

### Updated

- Made duplicates useful within CI implementations

---

## [1.2.0] - 2025-06-14

### Added

- Detect duplicate or similar msgstr

### Updated

- Made translated text accessible via quick link

---

## [1.1.0] - 2025-06-10

### Added

- Support for preserving dynamic values like `{value}` during translation.
- String batching to improve translation speed and reduce API calls.

---

## [1.0.4] - 2025-06-02

### Added

- CLI powered by `commander` with support for commands and options.
- `translate` command now supports:
  - `--dry-run` to preview untranslated entries without modifying files.
  - `--formality` flag to control DeepL tone (`less`, `more`, `default`, `prefer_less`, `prefer_more`).
  - `--only` flag to restrict translation to a specific language.
  - `--silent` flag to suppress output.

### Updated

- Refactored CLI to replace manual `process.argv` parsing with `commander`.
- Improved UX with better help messages and error handling.

---

## [1.0.3] - 2025-05-29

### Removed

- reference to project in the `README.md`

## [1.0.2] - 2025-05-28

### Added

- `README.md` with setup instructions and usage.
- `CHANGELOG.md` file to track updates.

---

## [1.0.1] - 2025-05-28

### Fixed

- Runtime issues related to TypeScript module resolution.
- Support for reading `.json` config files instead of only `.ts`.
- Improved error handling and fallback behavior.

---

## [1.0.0] - 2025-05-28

### Initial Release

- Project scaffolding and CLI setup.
- DeepL API integration for translating missing `.po` entries.
- Support for config via `tpo.config.ts`.
