# LLM Brain - Project Cost Manager

Project Cost Manager is a static offline browser app for small businesses that
work by project. It manages projects, budget, actuals, overheads, variance,
pricing settings, quotes, Excel sharing and JSON backup.

## Core Constraints

- No backend.
- No account or online activation.
- No runtime CDN.
- Data persists in browser `localStorage`.
- Excel support is bundled locally through SheetJS CE in `vendor/sheetjs/`.
- `app.js` must stay last.

## Important Globals

- `AppSettings`: language, currency, locale, tax label, tax rates, company data.
- `DB`: local CRUD wrapper.
- `F`: formatting, escaping, tax helpers and KPI helpers.
- `Pages`: page renderers.

## Data Tables

- `anagrafica`
- `budget_costi`
- `budget_ricavi`
- `consuntivo_costi`
- `consuntivo_ricavi`
- `cg_budget`
- `cg_consuntivo`
- `politica_prezzi`
- `preventivi`
- `preventivi_righe`

## Export Policy

- Excel `.xlsx`: advisor/consultant sharing and operational import.
- JSON: full backup/restore including settings.

## Security Notes

- Escape user-controlled values with `F.esc()` before injecting HTML.
- Do not reintroduce remote scripts.
- Local data protection depends on the device and browser profile.
