# Project Cost Manager

Offline project cost, margin and quote manager for small businesses that work by project.

## Product Direction

Project Cost Manager is a lightweight offline management tool. Its core scope is project economics: costs, revenue, margins, overheads, variance, quotes, Excel sharing and JSON backup.

The US version follows a **No Tax Core** policy: amounts are managed and quoted as pre-tax / tax-excluded values. The app must not calculate, estimate, collect, validate or report Sales Tax, use tax, VAT, exemptions, nexus, filing obligations or tax registrations.

Taxes, if applicable, should be handled outside the app by the user, their accountant, their tax advisor or a dedicated tax/compliance tool.

## What It Does

- Runs offline by opening `index.html` in a modern browser.
- Tracks projects, budget, actuals, overheads, variance and quotes.
- Builds client-facing printable quotes using pre-tax / tax-excluded amounts.
- Exports `.xlsx` workbooks for advisors and consultants.
- Creates/restores complete JSON backups including settings.
- Uses a US-oriented English interface with USD, en-US number formatting and configurable company details.
- Stores data locally in the browser profile via `localStorage`.

## What It Does Not Do

- It does not calculate Sales Tax or use tax.
- It does not look up tax rates.
- It does not decide whether a product, service, quote, project or customer is taxable.
- It does not manage tax-exempt certificates, resale certificates, nexus, registrations, filing calendars or remittances.
- It does not replace an accountant, tax advisor, attorney, state tax authority or certified tax engine.

## Start

Open `index.html`. On first launch, the onboarding screen should ask only for product-relevant settings such as language, currency/locale, company details and optional demo data.

For the US product policy, see `docs/QUICK_START_US.md` and `docs/TAX_HANDLING_US.md`.

## Quote Tax Notice

Recommended default wording for printed quotes:

> Amounts shown are pre-tax. Taxes, if applicable, are excluded unless expressly stated.

## Important Data Note

This app is offline. Data stays in the browser profile on the device. Use
`Backup JSON` regularly to keep a complete copy. Use `Export Excel` when you
need to share project numbers with an accountant, consultant or advisor.

## Included Files

```text
index.html
css/
js/
vendor/sheetjs/
docs/
```

## Commercial Package Notes

- No backend.
- No account.
- No online activation.
- No runtime CDN.
- No tax calculation or tax compliance module.
- SheetJS Community Edition is bundled locally for Excel support. See
  `docs/OPEN_SOURCE_NOTICES.md`.
