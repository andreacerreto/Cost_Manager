# Project Cost Manager Threat Model

Date: 2026-05-11

## Scope

Project Cost Manager v1 is a static offline browser app opened from
`index.html`. It has no backend, no online license activation, no remote auth
provider and no runtime CDN. Data is stored in the user's browser profile via
`localStorage`.

In scope:

- `index.html`
- `css/`
- `js/`
- `vendor/sheetjs/`
- Excel `.xlsx` import/export
- JSON backup/restore

Out of scope:

- device compromise
- browser profile compromise
- cloud synchronization outside this app
- multi-user access control

## Assets

- Project master data and client names.
- Budget and actual costs/revenue.
- Overheads and variance analysis.
- Quotes and quote line items.
- Company settings, tax labels, currency and tax ID fields.
- JSON backup files and Excel workbooks created by the user.

## Trust Boundaries

1. Manual user input to DOM and local storage.
2. Excel workbook selected by the user to browser parser and app storage.
3. JSON backup selected by the user to browser parser and app storage.
4. `localStorage` content to app runtime after future launches.
5. App runtime to exported `.xlsx`, `.json` and quote print popup.
6. Vendored SheetJS runtime to app code.

## Entry Points

- Forms rendered by project, budget, actuals, overheads, pricing, quotes and
  settings modules.
- `importExcel(event)` in `js/excel.js`.
- `restoreBackupJson(event)` in `js/excel.js`.
- Existing `localStorage` data read by `js/database.js` and `js/settings.js`.
- Quote print popup in `js/preventivi.js`.

## Attacker Capabilities

Realistic attackers can:

- convince a user to import a malformed or very large `.xlsx` or `.json` file;
- provide spreadsheet cells with HTML/script-like strings;
- provide formula-like strings intended to execute in spreadsheet software;
- tamper with local browser storage on the same device or browser profile.

Attackers cannot, in the v1 offline model:

- call server APIs, because none exist;
- bypass server-side auth, because none exists;
- attack other tenants, because there is no multi-tenant service;
- exfiltrate data through app network calls, because runtime networking is not
  required and CSP now blocks browser connection primitives.

## Threats And Mitigations

### T1: Malformed import causes local denial of service

Impact: medium. Likelihood: medium.

An oversized workbook or backup could consume browser memory or pollute
`localStorage` with unexpected data shapes.

Mitigations:

- file size limit for Excel and JSON imports in `js/helpers.js`;
- sheet and row limits for Excel import in `js/helpers.js` and `js/excel.js`;
- backup table validation in `js/excel.js`;
- defensive store normalization in `js/database.js`.

### T2: Settings poisoning breaks formatting or UI

Impact: medium. Likelihood: medium.

A malicious JSON backup could set unsupported locale/currency/tax settings and
trigger runtime errors in currency formatting.

Mitigations:

- whitelist language, currency and locale in `js/settings.js`;
- normalize tax labels and tax rates in `js/settings.js`;
- cap company text field length in `js/settings.js`;
- fallback currency formatting in `js/settings.js`.

### T3: XSS through user-controlled text

Impact: medium. Likelihood: low to medium.

User-controlled text reaches dynamic HTML renderers. The app already escapes
most displayed values with `F.esc()`.

Mitigations:

- maintain `F.esc()` output encoding for DOM HTML strings;
- import text remains plain data and is escaped at render time;
- CSP in `index.html` blocks network exfiltration paths and object/frame loads.

### T4: Spreadsheet formula injection on export

Impact: low to medium. Likelihood: low.

If user text beginning with formula control characters is exported, spreadsheet
software may treat it as a formula.

Mitigations:

- `ImportSafety.safeExcelRows()` prefixes formula-like exported strings before
  SheetJS writes the workbook.

## Residual Risk

- Data confidentiality depends on the user's device, OS account and browser
  profile.
- `localStorage` is not encrypted.
- Offline login is not a security boundary; it is only a local entry overlay.
- Imported files still come from the user, so users should keep JSON backups
  and import only trusted workbooks.

## Recommended Release Gate

Before every commercial ZIP:

- run JavaScript syntax checks;
- run hardening tests;
- run browser smoke test from `file:///index.html`;
- confirm `typeof XLSX !== 'undefined'`;
- confirm no HTTP/HTTPS runtime scripts;
- package `vendor/sheetjs/` and `docs/OPEN_SOURCE_NOTICES.md`.
