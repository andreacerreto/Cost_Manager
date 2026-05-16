# Project Cost Manager

Offline project cost, margin and quote manager for small businesses that work by project.

## What It Does

- Runs offline by opening `index.html` in a modern browser.
- Tracks projects, budget, actuals, overheads, variance and quotes.
- Exports `.xlsx` workbooks for advisors and consultants.
- Creates/restores complete JSON backups including settings.
- US-only interface with configurable company details and Sales Tax settings.
- Includes a US manual Sales Tax mode with quote-level tax-exempt and jurisdiction notes.
- Stores data locally in the browser profile via `localStorage`.

## Start

Open `index.html`. On first launch, the onboarding screen asks for language,
currency, tax settings, company details and optional demo data.

For US use, see `docs/QUICK_START_US.md` and `docs/TAX_HANDLING_US.md`.

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
- SheetJS Community Edition is bundled locally for Excel support. See
  `docs/OPEN_SOURCE_NOTICES.md`.
