# US Tax Handling Policy

Project Cost Manager intentionally does **not** handle US Sales Tax.

The product follows a **No Tax Core** policy: all operational amounts should be treated as pre-tax / tax-excluded values. Tax calculation, tax compliance and tax filing workflows are outside the app scope.

## What The App Does

- Tracks project costs, revenue, actuals, overheads, margins and variance.
- Builds client-facing printable quotes using pre-tax / tax-excluded amounts.
- Exports operational data to Excel for review by accountants, consultants or advisors.
- Creates and restores JSON backups of local app data.
- Keeps data offline in the browser profile.

## What The App Does Not Do

- It does not calculate Sales Tax or use tax.
- It does not look up state, county, city or district tax rates.
- It does not determine whether a product, service, project, quote or customer is taxable.
- It does not manage tax-exempt customers, resale certificates, exemption certificates or certificate expiration.
- It does not determine nexus, economic thresholds, registrations, filing obligations, filing periods or remittances.
- It does not create a Sales Tax ledger, payable account, return worksheet or compliance report.
- It does not replace an accountant, tax advisor, attorney, state tax authority or certified tax engine.

## Quote Wording

Recommended default wording for quote printouts:

> Amounts shown are pre-tax. Taxes, if applicable, are excluded unless expressly stated.

This note keeps the quote clear without implying that Project Cost Manager performs tax calculations.

## Why Tax Is Out Of Scope

US Sales Tax varies by state, local jurisdiction, product/service taxability, customer status, seller nexus, marketplace facilitation rules and filing obligations. Supporting this correctly would require a much more complex tax/compliance product, and would not fit the current offline lightweight scope.

Project Cost Manager should remain a project economics tool, not a tax engine.

## Implementation Direction

The application code should be refactored so that:

- tax rate presets are removed from user-facing settings;
- tax columns are removed from Budget, Actuals and Quotes;
- tax KPI cards are removed from Dashboard, Budget, Actuals, Variance and Analytics;
- the Excel export no longer contains a `Quote Tax Summary` sheet;
- legacy tax fields may remain tolerated during import/backup restore for backward compatibility, but should not be shown, recalculated or exported as active product features;
- documentation and shop listing should describe the app as pre-tax / tax-excluded.

See `docs/CODEX_NO_TAX_REFACTOR_PLAN.md` for the detailed implementation plan.
