# Codex No Tax Refactor Plan

Date: 2026-05-16
Target branch: `sviluppo-cost-manager-2026-05-15`
Product decision: **No Tax Core**

## 1. Objective

Refactor Project Cost Manager so the US product is a lightweight offline project economics tool, not a tax tool.

The app should manage:

- projects;
- planned costs and planned revenue;
- actual costs and actual revenue;
- overheads;
- margins;
- variance;
- client-facing quotes;
- Excel sharing;
- JSON backup and restore.

The app should not calculate, estimate, validate, collect, summarize, export or report Sales Tax, use tax, VAT, exemptions, nexus, registrations, filing obligations or remittances.

All operational values should be treated as **pre-tax / tax-excluded**.

Recommended quote wording:

> Amounts shown are pre-tax. Taxes, if applicable, are excluded unless expressly stated.

## 2. Non-goals

Do not implement:

- automatic tax rate lookup;
- manual Sales Tax presets;
- tax-exempt quote workflows;
- resale certificate or exemption certificate tracking;
- nexus monitoring;
- filing calendars;
- tax return exports;
- payable/receivable tax ledgers;
- external tax API integrations;
- backend services;
- runtime CDN dependencies;
- cloud sync;
- online license activation.

## 3. Constraints To Preserve

The refactor must preserve the existing offline product constraints:

- static browser app opened from `index.html`;
- no backend;
- no account requirement;
- no online activation;
- no runtime CDN;
- data persisted in browser `localStorage`;
- Excel support bundled locally through SheetJS CE in `vendor/sheetjs/`;
- `app.js` loaded last;
- user-controlled values escaped with `F.esc()` before HTML injection;
- restrictive offline CSP in `index.html`;
- JSON backup remains the complete backup/restore mechanism;
- Excel remains an operational/advisor-sharing export, not a tax filing export.

## 4. High-level Design

### Before

The branch currently contains a manual US Sales Tax workflow:

- `Sales Tax` label and rate presets;
- tax rate columns in Budget, Actuals and Quotes;
- quote-level `tax_exempt`, `tax_jurisdiction`, `tax_note` and `tax_mode`;
- quote PDF Sales Tax disclaimer;
- `Quote Tax Summary` Excel sheet;
- dashboard/variance tax net metrics.

### After

The product should use a simpler model:

- cost and revenue amounts are stored as pre-tax values;
- quotes display line amounts, subtotal and total pre-tax;
- no tax rate fields appear in the UI;
- no tax amount is calculated;
- no tax KPI is shown;
- no tax summary sheet is exported;
- a simple quote footer note clarifies that taxes are excluded if applicable;
- legacy tax fields may be tolerated during import/restore but are not rendered or recalculated.

## 5. Data Model Policy

### 5.1 Active data fields

Keep active fields focused on project economics.

Examples:

- `importo`
- `qta`
- `costo_unitario`
- `prezzo_unitario`
- `markup_pct`
- `note`
- `company` settings
- `currency`
- `locale`

### 5.2 Legacy tax fields

The following legacy fields may exist in old localStorage data or backup files:

- `tax_rate`
- `tax_exempt`
- `tax_jurisdiction`
- `tax_note`
- `tax_mode`

Policy:

- do not break restore/import when these fields are present;
- do not show them in the active UI;
- do not recalculate them;
- do not export calculated tax summaries;
- do not add new user-facing tax fields;
- optionally strip them from newly saved active records, except where preserving old backups is necessary.

## 6. Refactor Phases For Codex

Run these phases as small separate Codex tasks. Each phase should be reviewed and tested before moving to the next one.

---

# Phase 0 — Baseline inspection and safety check

## Goal

Let Codex inspect the repository, confirm current tax touchpoints, and produce a small implementation checklist before editing.

## Files to inspect

- `README.md`
- `docs/QUICK_START_US.md`
- `docs/TAX_HANDLING_US.md`
- `docs/SHOP_LISTING.md`
- `docs/CHANGELOG.md`
- `index.html`
- `js/config.js`
- `js/settings.js`
- `js/helpers.js`
- `js/budget.js`
- `js/dashboard.js`
- `js/varianze.js`
- `js/analytics.js`
- `js/preventivi.js`
- `js/politicaprezzi.js`
- `js/excel.js`
- `tests/hardening-tests.mjs`

## Codex prompt

```text
You are working on Project Cost Manager, branch sviluppo-cost-manager-2026-05-15.

Before editing, inspect the repo and list every user-facing or calculated tax feature. Focus on strings, settings fields, helper functions, UI columns, KPI cards, quote PDF content, Excel sheets, backup/import behavior, tests and docs.

Do not change files yet. Produce a concise checklist grouped by file.

Product decision: No Tax Core. The app must treat amounts as pre-tax / tax-excluded and must not calculate or expose Sales Tax, use tax, VAT, exemptions, nexus, filing or remittance features.
```

## Acceptance criteria

- Codex identifies all relevant tax references.
- Codex does not modify files in this phase.
- The checklist is used to drive the next tasks.

---

# Phase 1 — Simplify settings and onboarding

## Goal

Remove tax settings from the active user configuration while preserving US-oriented product settings.

## Target files

- `js/settings.js`
- possibly `js/config.js`
- tests if needed

## Required changes

1. Remove user-facing `tax_label`, `tax_id_label`, `tax_rates` and `tax_disclaimer` from the settings form.
2. Keep only settings that are coherent with the product:
   - country/profile if still useful;
   - language;
   - currency `USD`;
   - locale `en-US`;
   - company name;
   - address;
   - ZIP/postal code;
   - phone;
   - email;
   - optional company identifier field only if it is generic and not presented as a tax workflow.
3. Rename any `Country / tax profile` label to a neutral label, for example `Country / market profile`.
4. If keeping `EIN / Tax ID`, present it only as optional company header text, not as a tax module.
5. Ensure `AppSettings.money()` continues to work.
6. Keep normalization and defensive settings loading.
7. Preserve backward compatibility with old settings containing tax fields.

## Suggested implementation detail

Keep internal defaults for backward compatibility if necessary, but stop rendering tax inputs.

Example policy:

```js
const SETTINGS_LEGACY_TAX_FIELDS = ['tax_label', 'tax_id_label', 'tax_rates', 'tax_disclaimer'];
```

Do not expose them in `formHtml()`.

## Codex prompt

```text
Refactor settings for the No Tax Core product direction.

Remove all user-facing tax settings from js/settings.js. The settings page should no longer expose tax labels, tax rates, tax disclaimers, Sales Tax copy, or tax profile wording.

Keep USD, en-US, English interface, company details, dark mode, demo data and JSON backup compatibility. Preserve defensive normalization so old backups containing tax fields do not break restore.

Rename "Country / tax profile" to a neutral "Country / market profile" if the field remains. Do not add any backend, CDN, API or network dependency.

After changes, run syntax checks and existing tests. Update tests only where they assert old tax settings behavior.
```

## Acceptance criteria

- Settings UI has no tax rate inputs.
- Settings UI has no Sales Tax disclaimer.
- Settings UI has no wording implying tax calculation.
- Old backups with tax fields do not crash settings load.
- `AppSettings.money(10)` still returns valid USD formatting.

---

# Phase 2 — Remove tax columns from Budget and Actuals

## Goal

Budget and Actuals should track only pre-tax costs and revenue.

## Target files

- `js/budget.js`
- `js/helpers.js`
- possibly `css/style.css`

## Required changes

1. Remove `Tax %` and tax amount columns from cost tables.
2. Remove `Tax %` and tax amount columns from revenue tables.
3. Remove all live calculations of tax amount.
4. Remove `Sales Tax Net` / `Tax Net` / equivalent KPI cards.
5. Save rows without `tax_rate` for newly entered Budget/Actuals data.
6. Continue to tolerate old rows containing `tax_rate`.
7. Keep totals:
   - total costs;
   - total revenue;
   - gross margin;
   - margin percentage.

## Codex prompt

```text
Refactor js/budget.js for No Tax Core.

Budget and Actuals must no longer show tax columns, tax rate selectors, tax amount cells, or tax KPI cards. They should only track pre-tax planned/actual costs and revenue, gross margin and margin percentage.

When saving new rows, do not write tax_rate. When loading old rows that include tax_rate, ignore it without crashing. Keep autosave and existing row behavior intact. Do not change storage architecture or add dependencies.

Update any affected helper calls if needed. Run syntax checks and tests.
```

## Acceptance criteria

- Budget cost table has no tax columns.
- Budget revenue table has no tax columns.
- Actual cost table has no tax columns.
- Actual revenue table has no tax columns.
- Newly saved budget/actual rows do not include `tax_rate`.
- Existing rows with `tax_rate` still load.

---

# Phase 3 — Remove tax math from helpers and project totals

## Goal

Make `helpers.js` reflect the product economics model instead of a tax model.

## Target files

- `js/helpers.js`
- any file using `F.taxMultiplier`, `F.taxRate`, `F.salesTaxSummary`, `F.taxLabel`, `F.defaultTaxRate`

## Required changes

1. Remove or deprecate active usage of:
   - `F.taxMultiplier()`;
   - `F.taxRate()`;
   - `F.salesTaxSummary()`;
   - `F.taxLabel()`;
   - `F.taxIdLabel()` if not needed;
   - `F.defaultTaxRate()`.
2. Keep `F.money`, `F.pct`, `F.esc`, `F.roundMoney`, `F.sel`, `F.kpi`, `F.cls`.
3. Refactor `totali()` to return only:
   - `costi`;
   - `ricavi`;
   - `margine`.
4. Remove `taxCosts`, `taxRevenue`, `taxNet` from active totals.
5. Update all downstream callers.

## Codex prompt

```text
Refactor js/helpers.js for No Tax Core.

Remove active tax calculation helpers and update totali() so it returns only project economics: costi, ricavi and margine. Keep formatting, escaping, rounding, select, KPI and class helpers.

Find all callers expecting taxCosts, taxRevenue or taxNet and update them. Do not leave dead user-facing tax helpers unless required for backward-compatible import normalization; if kept, mark as legacy and ensure they are not used by the UI.

Run syntax checks and tests.
```

## Acceptance criteria

- No active UI caller uses `F.taxMultiplier`, `F.salesTaxSummary` or `F.defaultTaxRate`.
- `totali()` no longer computes tax net values.
- Dashboard, variance and exports still work.

---

# Phase 4 — Simplify quote editor and quote PDF

## Goal

Quotes should be client-facing pre-tax / tax-excluded commercial documents.

## Target files

- `js/preventivi.js`
- `index.html` print CSS if needed
- `css/style.css` if needed

## Required changes

1. Remove quote-level fields:
   - tax exempt;
   - customer state/county for tax;
   - Sales Tax note;
   - tax mode.
2. Remove quote line tax rate selector and tax amount column.
3. Remove tax total from quote editor footer.
4. Remove Sales Tax handling disclaimer block from PDF.
5. Add simple quote notice:

   > Amounts shown are pre-tax. Taxes, if applicable, are excluded unless expressly stated.

6. Save new quote headers without tax fields.
7. Save new quote lines without `tax_rate`.
8. Ignore legacy tax fields when opening old quotes.
9. Keep internal cost hidden in print/PDF.
10. Keep quote margin/internal summary for internal use only.

## Codex prompt

```text
Refactor js/preventivi.js for No Tax Core.

Quotes must become pre-tax / tax-excluded commercial quotes. Remove tax-exempt UI, jurisdiction fields, Sales Tax notes, line tax selectors, line tax amount cells, tax totals and Sales Tax handling PDF wording.

Add the quote notice: "Amounts shown are pre-tax. Taxes, if applicable, are excluded unless expressly stated."

Do not break opening old quotes that contain tax_exempt, tax_jurisdiction, tax_note, tax_mode or tax_rate fields. Ignore those fields in the active UI and do not write them for newly saved quotes. Preserve print/PDF generation, internal cost hiding, quote list, quote overwrite behavior, delete behavior and markup calculations.

Run syntax checks and tests.
```

## Acceptance criteria

- Quote editor has no tax fields or tax columns.
- Quote PDF has no Sales Tax handling block.
- Quote PDF includes the simple tax exclusion notice.
- New quote headers do not include `tax_exempt`, `tax_jurisdiction`, `tax_note`, `tax_mode`.
- New quote lines do not include `tax_rate`.
- Old quotes still open and print.

---

# Phase 5 — Update Excel export/import and backup behavior

## Goal

Excel should share operational project data, not tax summaries.

## Target files

- `js/excel.js`
- tests if needed

## Required changes

1. Remove `Quote Tax Summary` from calculated sheets.
2. Remove `_quoteTaxSummaryRows()` or mark it unused and delete active export call.
3. Remove tax metrics from `Dashboard Summary`.
4. Remove tax metrics from `Variance Analysis`.
5. Keep operational sheets:
   - Projects;
   - Budget Costs;
   - Budget Revenue;
   - Actual Costs;
   - Actual Revenue;
   - Overheads Budget;
   - Overheads Actual;
   - Quotes;
   - Quote Lines;
   - Settings.
6. When exporting rows, optionally strip legacy tax fields from operational Excel exports so Excel does not present old tax data as active product data.
7. JSON backup may preserve all stored rows for complete restore, including legacy fields, but documentation must explain that legacy tax fields are inactive.
8. Import Excel should ignore unknown/calculated sheets and not require tax columns.

## Codex prompt

```text
Refactor js/excel.js for No Tax Core.

Excel export must no longer include Quote Tax Summary, tax net metrics, tax settings rows, Sales Tax disclaimers or calculated tax fields. It should remain an operational workbook for project costs, revenue, actuals, overheads, quotes, quote lines, variance and settings.

Keep JSON backup/restore complete and backward compatible. It may preserve legacy tax fields in restored rows, but the active UI must not expose or recalculate them.

Consider adding a small helper to strip legacy tax fields from Excel operational exports while leaving JSON backup untouched.

Run syntax checks and tests.
```

## Acceptance criteria

- Exported workbook has no `Quote Tax Summary` sheet.
- Exported workbook has no tax net metrics.
- Exported settings rows have no tax settings.
- Operational export still works.
- JSON backup/restore still works.
- Import Excel still works for existing operational sheets.

---

# Phase 6 — Dashboard, variance and analytics cleanup

## Goal

Remove any remaining tax metrics from reporting screens.

## Target files

- `js/dashboard.js`
- `js/varianze.js`
- `js/analytics.js`
- possibly `js/helpers.js`

## Required changes

1. Remove tax cards from dashboard.
2. Remove tax columns from variance tables.
3. Remove tax charts or tax summaries from analytics.
4. Ensure all reports focus on:
   - costs;
   - revenue;
   - margin;
   - margin percentage;
   - overheads;
   - variance.

## Codex prompt

```text
Search dashboard, variance and analytics modules for all tax-related metrics, labels and calculations. Remove them for No Tax Core.

Reports should focus only on costs, revenue, gross margin, margin percentage, overheads and variance. Update any references to totali() after its tax fields are removed.

Run syntax checks and tests.
```

## Acceptance criteria

- No report screen displays tax values.
- No report screen references removed tax fields.
- Dashboard, variance and analytics still render with demo data.

---

# Phase 7 — Demo data cleanup

## Goal

Demo data must not seed tax rates or imply tax handling.

## Target files

- `js/settings.js`
- possibly docs/screenshots if any

## Required changes

1. Remove `tax_rate` from seeded demo rows.
2. Remove any Sales Tax references in demo data.
3. Keep realistic US project examples.

## Codex prompt

```text
Clean demo data for No Tax Core.

Remove tax_rate and any Sales Tax-related seeded values from the demo data. Keep the demo useful for project cost, revenue, actuals, overheads and margin analysis.

Run syntax checks and tests.
```

## Acceptance criteria

- Demo data loads.
- Demo data contains no active tax fields in newly inserted rows.
- Dashboard and quote creation still work after loading demo data.

---

# Phase 8 — Tests and regression coverage

## Goal

Codify the No Tax Core behavior with tests.

## Target files

- `tests/hardening-tests.mjs`
- optionally new `tests/no-tax-core-tests.mjs`
- `package.json` if present and needed

## Required tests

Add tests that verify:

1. Settings normalization does not require tax settings.
2. Old settings containing tax fields do not break load/save.
3. `totali()` returns only economic totals or at least no active tax net values.
4. Excel calculated sheet list does not include `Quote Tax Summary`.
5. Demo data does not insert active tax fields.
6. Import normalization still tolerates legacy tax fields.
7. Formula injection protection still works.
8. CSP/offline assumptions are unchanged.

## Codex prompt

```text
Add regression tests for the No Tax Core refactor.

The tests should prove that tax settings are not required, legacy tax fields do not crash import/restore, active totals do not expose tax net values, Excel exports do not include Quote Tax Summary, and hardening protections still pass.

Prefer small Node-based tests consistent with tests/hardening-tests.mjs. Do not add remote dependencies.
```

## Acceptance criteria

- Existing hardening tests pass.
- New no-tax tests pass.
- Tests do not require network access.

---

# Phase 9 — Documentation and commercial copy final pass

## Goal

Make all public-facing docs consistent with the product decision.

## Target files

- `README.md`
- `docs/QUICK_START_US.md`
- `docs/TAX_HANDLING_US.md`
- `docs/SHOP_LISTING.md`
- `docs/CHANGELOG.md`
- `docs/SECURITY_REVIEW.md`
- `docs/PROJECT-COST-MANAGER-THREAT-MODEL.md`
- `docs/HARDENING_REPORT_2026-05-11.md` if present

## Required changes

1. Remove copy that sells or implies Sales Tax support.
2. Replace with No Tax Core copy.
3. Keep the simple quote notice.
4. Update changelog with a new version entry:
   - removed manual Sales Tax workflow from product scope;
   - clarified pre-tax / tax-excluded quote policy;
   - removed tax calculations from implementation plan;
   - preserved offline constraints.
5. Ensure docs do not claim completed code changes until the code refactor is actually merged.

## Codex prompt

```text
Perform a documentation consistency pass for No Tax Core.

Search all docs for Sales Tax, tax rate, tax exempt, nexus, exemption, tax label, tax summary and tax compliance wording. Replace product claims with the No Tax Core policy: Project Cost Manager uses pre-tax / tax-excluded amounts and does not calculate or manage taxes.

Update changelog carefully. Do not claim implementation is complete unless the code changes in this branch have actually been made.
```

## Acceptance criteria

- No doc markets the app as a Sales Tax tool.
- Docs consistently say taxes are outside app scope.
- Shop listing remains clear and simple.

---

# Phase 10 — Final browser smoke test

## Goal

Verify the refactored app still works from `file:///index.html`.

## Manual browser checklist

1. Open `index.html` locally.
2. Confirm no console errors on startup.
3. Confirm dashboard renders.
4. Open Settings and confirm no tax inputs appear.
5. Load demo data.
6. Create a project.
7. Enter Budget cost and revenue rows.
8. Enter Actual cost and revenue rows.
9. Confirm margins update.
10. Create a quote.
11. Confirm quote editor has no tax fields.
12. Print/preview quote.
13. Confirm quote includes the tax exclusion notice.
14. Export Excel.
15. Confirm workbook has no `Quote Tax Summary` sheet.
16. Backup JSON.
17. Restore JSON.
18. Confirm data reloads.
19. Import Excel operational workbook.
20. Confirm no network requests are required.

## Codex prompt

```text
After the No Tax Core refactor, run all available automated checks and summarize the manual browser smoke test checklist. If a browser automation environment is available, execute a file:// smoke test for index.html and report console errors.

Do not add network dependencies. Confirm that the app still works offline and that the quote, Excel and backup flows remain intact.
```

## Acceptance criteria

- Syntax checks pass.
- Automated tests pass.
- Browser smoke test passes.
- No runtime HTTP/HTTPS scripts are introduced.
- App remains usable from a static ZIP.

## 7. Recommended Commit Strategy

Use small commits:

1. `docs: clarify no tax core product direction`
2. `refactor: remove tax settings from ui`
3. `refactor: remove tax columns from budget actuals`
4. `refactor: simplify totals to project economics`
5. `refactor: remove tax workflow from quotes`
6. `refactor: remove tax summary from excel export`
7. `test: add no tax core regression coverage`
8. `docs: align commercial copy with no tax policy`

## 8. Recommended Pull Request Description

```markdown
## Summary

This PR aligns Project Cost Manager with the No Tax Core product direction.

The app now treats operational values as pre-tax / tax-excluded and removes Sales Tax calculation/workflow features from the active product surface.

## Product policy

Project Cost Manager is a lightweight offline project cost, margin and quote tool. It is not a tax or compliance application.

## Main changes

- Removed tax settings from active UI.
- Removed tax columns from Budget and Actuals.
- Removed tax fields and calculations from Quotes.
- Added simple quote notice: "Amounts shown are pre-tax. Taxes, if applicable, are excluded unless expressly stated."
- Removed tax net metrics and Quote Tax Summary export.
- Preserved backward tolerance for legacy tax fields in old data/backups.
- Updated docs and tests.

## Validation

- [ ] JavaScript syntax checks pass.
- [ ] Hardening tests pass.
- [ ] No-tax regression tests pass.
- [ ] Browser smoke test from file:// passes.
- [ ] Excel export works.
- [ ] JSON backup/restore works.
- [ ] No runtime network dependencies were introduced.
```

## 9. Important Review Notes

Reviewers should reject the PR if it:

- reintroduces Sales Tax calculation;
- reintroduces tax rate presets in user-facing UI;
- adds tax compliance copy;
- creates a tax ledger or tax report;
- introduces runtime network calls;
- weakens import/export hardening;
- breaks old JSON restore;
- breaks offline ZIP distribution.

## 10. Final Definition Of Done

The refactor is complete only when:

- the user can operate the app without seeing tax controls;
- all monetary values are clearly pre-tax / tax-excluded;
- printed quotes include the simple tax exclusion note;
- Excel export is operational, not tax/compliance-oriented;
- legacy tax data does not crash the app;
- docs, listing and README no longer market Sales Tax support;
- tests and smoke checks pass;
- the offline security posture remains unchanged.
