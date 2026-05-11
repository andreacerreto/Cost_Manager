# Hardening Report

Date: 2026-05-11

## Executive Summary

This hardening cycle focused on the offline commercial v1 risk profile:
untrusted Excel/JSON imports, poisoned local settings, malformed local storage
and accidental network-capable browser surfaces. No backend or CDN dependency
was introduced.

## Findings Fixed

### H-1: Malformed `localStorage` could break app startup

Severity: medium.

Evidence: `DB.all()` previously assumed every persisted table value was an
array. A corrupted or manually modified `localStorage` value could make table
reads throw before the UI recovered.

Fix:

- Added table-shape normalization and a per-table row cap in
  `js/database.js:16` and `js/database.js:40`.
- Unknown tables and non-array table values are ignored.

Regression test:

- `tests/hardening-tests.mjs` verifies corrupted storage returns an empty table
  instead of throwing.

### H-2: Backup JSON could poison app settings

Severity: medium.

Evidence: restored settings were merged directly into runtime settings. Invalid
currency, locale, tax labels or oversized company strings could break
formatting or degrade the UI.

Fix:

- Added whitelists for language, currency and locale in `js/settings.js:8`.
- Added settings text, label and tax-rate normalization in
  `js/settings.js:223`.
- Added fallback currency formatting in `js/settings.js`.

Regression test:

- `tests/hardening-tests.mjs` verifies invalid settings normalize to safe
  defaults and do not break `AppSettings.money()`.

### H-3: Excel/JSON import had no size or row limits

Severity: medium.

Evidence: imports are local and user-confirmed, but a very large or malformed
file could still cause browser memory pressure or pollute stored rows with
unexpected object values.

Fix:

- Added `ImportSafety` limits in `js/helpers.js:76`.
- Enforced file size and workbook sheet limits in `js/excel.js:270` and
  `js/excel.js:362`.
- Normalized imported rows before writing them in `js/excel.js:257` and
  `js/excel.js:376`.
- Added backup table validation in `js/excel.js:321`.

Regression test:

- `tests/hardening-tests.mjs` verifies rows are bounded, nested values are
  dropped and malformed backup tables are rejected.

### H-4: Exported spreadsheet text could begin with formula characters

Severity: low to medium.

Evidence: user-entered values can be exported to `.xlsx`. Spreadsheet tools may
interpret formula-like strings in some contexts.

Fix:

- `ImportSafety.safeExcelRows()` prefixes text values starting with `=`, `+`,
  `-` or `@` before workbook generation in `js/helpers.js:130`.
- Excel append now routes rows through that protection in `js/excel.js`.

### H-5: Browser security policy was implicit

Severity: low.

Evidence: the offline app should not make network requests or embed remote
objects. This was a product requirement but not enforced by the document.

Fix:

- Added a restrictive offline CSP in `index.html:6`.
- Network connections are blocked with `connect-src 'none'`.
- Object and frame embedding are blocked.

## Residual Risk

- The app stores data in browser `localStorage`, not encrypted storage.
- Offline login is not authentication and should not be presented as data
  protection.
- Users must keep JSON backups because browser profile cleanup can delete app
  data.
- A future online demo, licensing service or cloud sync would require a new
  threat model.

## Verification Required Per Release

- `node tests/hardening-tests.mjs`
- JavaScript syntax check for every file in `js/`
- Browser smoke test from `file:///index.html`
- Check `typeof XLSX !== 'undefined'`
- Check no runtime `http://` or `https://` scripts
- Rebuild the release ZIP after verification
