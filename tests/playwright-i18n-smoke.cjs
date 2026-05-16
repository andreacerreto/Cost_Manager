const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadPlaywright() {
  try {
    return require('playwright');
  } catch (err) {
    try {
      return require('playwright-core');
    } catch (coreErr) {
      console.log('SKIP playwright-us-only-smoke: Playwright is not installed.');
      return null;
    }
  }
}

async function main() {
  const playwright = await loadPlaywright();
  if (!playwright) return;

  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  const appUrl = pathToFileURL(path.resolve(__dirname, '..', 'index.html')).href;

  try {
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
      AppSettings.save({
        ...AppSettings.get(),
        country_profile: 'US',
        language: 'en',
        currency: 'USD',
        locale: 'en-US',
        first_run_done: true,
      });
      App.go('settings');
    });

    const result = await page.evaluate(() => ({
      htmlLang: document.documentElement.lang,
      countryProfile: AppSettings.countryProfile(),
      currency: AppSettings.get().currency,
      locale: AppSettings.get().locale,
      taxLabel: AppSettings.taxLabel(),
      taxIdLabel: AppSettings.taxIdLabel(),
      rates: AppSettings.taxRates(),
      bodyText: document.body.innerText,
    }));

    assert.equal(result.htmlLang, 'en');
    assert.equal(result.countryProfile, 'US');
    assert.equal(result.currency, 'USD');
    assert.equal(result.locale, 'en-US');
    assert.equal(result.taxLabel, 'Sales Tax');
    assert.equal(result.taxIdLabel, 'EIN / Tax ID');
    assert(result.rates.includes(8.25), 'US rate preset should include 8.25.');
    assert(!result.rates.includes(22), 'US-only rate preset should not include 22.');
    const removedTerms = [
      String.fromCharCode(73, 86, 65),
      'P.' + String.fromCharCode(73, 86, 65),
      'country profile ' + String.fromCharCode(73, 84),
    ];
    assert(!removedTerms.some((term) => result.bodyText.includes(term)), 'US-only UI leaked a removed tax profile.');

    console.log('PASS playwright-us-only-smoke');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
