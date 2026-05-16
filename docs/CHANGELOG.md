# Changelog

## Unreleased

- Adopted the **No Tax Core** product direction for the US version.
- Clarified that Project Cost Manager manages pre-tax / tax-excluded project economics, not tax compliance.
- Updated documentation to remove Sales Tax positioning from the product scope.
- Added `docs/CODEX_NO_TAX_REFACTOR_PLAN.md`, a detailed Codex implementation plan for removing active tax UI, calculations, quote fields, KPI cards and Excel tax summaries.
- Updated shop listing copy to avoid Sales Tax compliance claims.

## v1.1.0

- Added explicit US country/tax profile with USD, en-US, Sales Tax and EIN / Tax ID defaults.
- Added manual Sales Tax summary helper with cent rounding and quote-level tax-exempt handling.
- Added customer state/county and Sales Tax note fields to quotes.
- Added US Sales Tax disclaimer copy to printable quotes.
- Added `Quote Tax Summary` sheet to Excel exports.
- Added US quick start and tax handling documentation.

> Note: v1.1.0 tax-related features are scheduled for removal from the active product surface under the No Tax Core refactor.

## v1.0.0

- Rebranded as Project Cost Manager.
- Added first-run onboarding.
- Added English settings.
- Added configurable currency, locale, tax label and tax rates.
- Added local SheetJS bundle for offline Excel import/export.
- Added separate JSON backup and restore flow.
- Added offline hardening for CSP, import limits, backup validation, settings normalization and corrupt local storage recovery.
- Added hardening regression tests and threat model documentation.
- Added commercial documentation and open-source notices.
