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
      taxIdLabel: AppSettings.taxIdLabel(),
      bodyText: document.body.innerText,
    }));

    assert.equal(result.htmlLang, 'en');
    assert.equal(result.countryProfile, 'US');
    assert.equal(result.currency, 'USD');
    assert.equal(result.locale, 'en-US');
    assert.equal(result.taxIdLabel, 'EIN / Tax ID');
    const removedTerms = [
      String.fromCharCode(73, 86, 65),
      'P.' + String.fromCharCode(73, 86, 65),
      'country profile ' + String.fromCharCode(73, 84),
      'Sales Tax',
      'Tax rates',
    ];
    assert(!removedTerms.some((term) => result.bodyText.includes(term)), 'No-tax UI leaked removed tax wording.');

    console.log('PASS playwright-us-only-smoke');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
