'use strict';

const path = require('node:path');
const { pathToFileURL } = require('node:url');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (err) {
    const modulesDir = process.env.WORKSPACE_NODE_MODULES;
    if (!modulesDir) throw err;
    return require(path.join(modulesDir, 'playwright'));
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const { chromium } = loadPlaywright();
  const appPath = path.resolve(__dirname, '..', 'index.html');
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find(candidate => {
    try {
      return require('node:fs').existsSync(candidate);
    } catch (err) {
      return false;
    }
  });
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
  const page = await browser.newPage();
  const consoleMessages = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', err => pageErrors.push(err.message));

  await page.goto(pathToFileURL(appPath).href, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const englishOnboarding = await page.evaluate(() => ({
    text: document.getElementById('onboarding-overlay')?.innerText || '',
    freeTextTaxRates: Boolean(document.getElementById('ob-tax-rates')),
    taxRateValues: Array.from(document.querySelectorAll('input[name="ob-tax-rates"]')).map(input => input.value),
    checkedTaxRateValues: Array.from(document.querySelectorAll('input[name="ob-tax-rates"]:checked')).map(input => input.value),
    taxLabel: document.getElementById('ob-tax-label')?.value,
    taxIdLabel: document.getElementById('ob-tax-id-label')?.value,
  }));

  assert(englishOnboarding.text.includes('Set up Project Cost Manager'), 'English onboarding title missing.');
  assert(englishOnboarding.text.includes('Sales tax rates (%)'), 'English onboarding should use sales tax copy.');
  assert(!englishOnboarding.freeTextTaxRates, 'Tax rates should be rendered as a checklist, not a text input.');
  assert(englishOnboarding.taxRateValues.includes('8.25'), 'English onboarding should expose US sales tax rates.');
  assert(!englishOnboarding.taxRateValues.includes('22'), 'English onboarding should not show Italian VAT rates.');
  assert(englishOnboarding.taxLabel === 'Sales tax', 'English tax label should default to Sales tax.');
  assert(englishOnboarding.taxIdLabel === 'EIN / Tax ID', 'English tax ID label should default to EIN / Tax ID.');

  await page.selectOption('#ob-language', 'it');
  await page.waitForTimeout(200);

  const italianOnboarding = await page.evaluate(() => ({
    text: document.getElementById('onboarding-overlay')?.innerText || '',
    taxRateValues: Array.from(document.querySelectorAll('input[name="ob-tax-rates"]')).map(input => input.value),
    checkedTaxRateValues: Array.from(document.querySelectorAll('input[name="ob-tax-rates"]:checked')).map(input => input.value),
    taxLabel: document.getElementById('ob-tax-label')?.value,
    taxIdLabel: document.getElementById('ob-tax-id-label')?.value,
  }));

  assert(italianOnboarding.text.includes('Configura Project Cost Manager'), 'Italian onboarding title missing.');
  assert(italianOnboarding.text.includes('Aliquote IVA (%)'), 'Italian onboarding should use VAT copy.');
  assert(italianOnboarding.taxRateValues.includes('22'), 'Italian onboarding should expose Italian VAT rates.');
  assert(!italianOnboarding.taxRateValues.includes('8.25'), 'Italian onboarding should not show US sales tax rates.');
  assert(italianOnboarding.taxLabel === 'IVA', 'Italian tax label should default to IVA.');
  assert(italianOnboarding.taxIdLabel === 'P.IVA', 'Italian tax ID label should default to P.IVA.');
  ['Set up', 'Company details', 'Sales tax rates', 'Load demo data', 'Start using the app']
    .forEach(term => assert(!italianOnboarding.text.includes(term), 'Italian onboarding still contains English text: ' + term));

  await page.selectOption('#ob-language', 'en');
  await page.waitForTimeout(200);

  const englishAgain = await page.evaluate(() => ({
    text: document.getElementById('onboarding-overlay')?.innerText || '',
    taxRateValues: Array.from(document.querySelectorAll('input[name="ob-tax-rates"]')).map(input => input.value),
    taxLabel: document.getElementById('ob-tax-label')?.value,
    taxIdLabel: document.getElementById('ob-tax-id-label')?.value,
  }));

  assert(englishAgain.text.includes('Set up Project Cost Manager'), 'English onboarding title missing after switching back.');
  assert(englishAgain.text.includes('Sales tax rates (%)'), 'English onboarding should return to sales tax copy.');
  assert(englishAgain.taxRateValues.includes('8.25'), 'English onboarding should restore US rates after switching back.');
  assert(!englishAgain.taxRateValues.includes('22'), 'English onboarding should remove Italian VAT rates after switching back.');
  assert(englishAgain.taxLabel === 'Sales tax', 'English tax label should restore after switching back.');
  assert(englishAgain.taxIdLabel === 'EIN / Tax ID', 'English tax ID label should restore after switching back.');
  ['Lingua', 'Aliquote', 'Dati aziendali', 'Carica dati demo', 'Inizia a usare']
    .forEach(term => assert(!englishAgain.text.includes(term), 'English onboarding still contains Italian text: ' + term));

  await page.evaluate(async () => {
    AppSettings.save({
      ...AppSettings.get(),
      language: 'en',
      locale: 'en-US',
      tax_label: 'Sales tax',
      tax_id_label: 'EIN / Tax ID',
      tax_rates: [0, 4, 5, 6, 7, 8.25, 10],
      first_run_done: true,
    });
    document.getElementById('onboarding-overlay')?.remove();
    for (const table of Object.keys(TABLE_KEYS)) await DB.clear(table);
    await DB.insertBatch('anagrafica', [
      { codice: 'PRJ-I18N', nome: 'Language QA', cliente: 'Client A', stato: 'In corso', responsabile: 'Alex', tipologia: 'Progettazione', note: '' },
    ]);
    await DB.insertBatch('budget_costi', [
      { codice: 'PRJ-I18N', categoria: 'Manodopera', descrizione: 'Work', qta: 10, um: 'h', costo_unitario: 50, importo: 500, aliq_iva: 8.25, note: '' },
    ]);
    await DB.insertBatch('budget_ricavi', [
      { codice: 'PRJ-I18N', tipo_ricavo: 'Fee', descrizione: 'Revenue', importo: 1200, aliq_iva: 8.25, note: '' },
    ]);
    await DB.insertBatch('cg_budget', [
      { voce: 'Software', aliq_iva: 8.25, gen: 100, feb: 100, mar: 100, apr: 100, mag: 100, giu: 100, lug: 100, ago: 100, set: 100, ott: 100, nov: 100, dic: 100 },
    ]);
    DB.invalidateCache();
  });

  const pagesToCheck = [
    'dashboard',
    'anagrafica',
    'budget',
    'consuntivo',
    'varianze',
    'costigenerali',
    'analytics',
    'preventivi',
    'politicaprezzi',
    'backup',
    'settings',
  ];
  const italianLeakTerms = [
    'Anagrafica',
    'Consuntivo',
    'Varianze',
    'Costi Generali',
    'Costi generali',
    'Preventivi',
    'Impostazioni',
    'Nuovo',
    'Aggiungi',
    'Elimina',
    'Chiudi',
    'Apri',
    'Ricavi',
    'Costi',
    'Varianza',
    'Aliquote',
    'Dati aziendali',
    'Partita IVA',
    'Salvato',
    'Salvataggio',
    'Progetto',
    'Cliente',
    'Responsabile',
    'Tipologia',
    'Stato',
    'Descrizione',
    'Categoria',
    'Riepilogo',
    'Nessun',
    'Caricamento dati',
    'Voce di costo',
    'Margine Lordo',
    'Totale',
    'TOTALE',
    'MARGINE',
    'COSTO UNIT',
    'IMPORTO',
    '% SU',
    'MEDIA MENSILE',
    'chiave univoca',
    'Imposta la tua',
    'fatturato',
  ];
  const leaks = [];
  for (const pageName of pagesToCheck) {
    await page.evaluate(name => App.go(name), pageName);
    await page.waitForTimeout(200);
    const text = await page.locator('#main').innerText();
    italianLeakTerms.forEach(term => {
      if (text.includes(term)) leaks.push(pageName + ': ' + term);
    });
  }
  assert(leaks.length === 0, 'English pages still contain Italian text: ' + leaks.slice(0, 30).join(', '));

  await browser.close();

  if (pageErrors.length) throw new Error('Page errors: ' + pageErrors.join(' | '));
  if (consoleMessages.length) throw new Error('Console issues: ' + JSON.stringify(consoleMessages));

  console.log('PASS i18n onboarding language and tax-rate checklist');
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
