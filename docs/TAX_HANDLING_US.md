# US Sales Tax Handling

Project Cost Manager supports a conservative offline workflow for US users:

- `Country / tax profile: United States`
- `USD`
- `en-US`
- `Sales Tax`
- manual Sales Tax rate presets
- quote-level `Tax exempt`, customer state/county, and Sales Tax note fields
- `Quote Tax Summary` sheet in Excel exports

## What The App Does

- Estimates Sales Tax from the rate entered by the user.
- Rounds taxable base, tax amount and total to cents.
- Records whether a quote is tax exempt.
- Records the customer state/county or jurisdiction note.
- Exports quote tax metadata for review by an accountant or tax advisor.

## What The App Does Not Do

- It does not look up rates automatically.
- It does not decide whether a product or service is taxable.
- It does not determine nexus, registration, filing, resale certificate or exemption rules.
- It does not replace a certified tax engine, accountant, attorney or state tax authority.

## Why Rates Are Manual

US sales tax is state and local. The IRS sales tax calculator FAQ notes that many ZIP codes can include more than one local taxing jurisdiction, and state/local business tax obligations differ by jurisdiction. For current obligations, use official state tax authority resources or a qualified advisor.

Official references:

- IRS Sales Tax Deduction Calculator FAQ: https://www.irs.gov/salestax
- SBA Pay Taxes guide: https://www.sba.gov/business-guide/manage-your-business/pay-taxes
- SBA federal and state tax ID guide: https://www.sba.gov/business-guide/launch-your-business/get-federal-state-tax-id-numbers

## Recommended Quote Workflow

1. Confirm whether the customer/project is taxable with your advisor or state tax authority.
2. Enter the applicable manual Sales Tax rate in the quote line.
3. Fill `Customer state / county`.
4. Check `Tax exempt` only when you have a valid basis and documentation.
5. Use `Sales Tax note` to record the source or assumption.
6. Export Excel and keep the `Quote Tax Summary` sheet with your records.

