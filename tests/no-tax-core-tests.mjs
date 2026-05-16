import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const PRE_TAX_NOTE = 'Amounts shown are pre-tax. Taxes, if applicable, are excluded unless expressly stated.';

function createContext() {
  const storage = new Map();
  const context = {
    console,
    Blob,
    URL: {
      createObjectURL() { return 'blob:test'; },
      revokeObjectURL() {},
    },
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); },
      removeItem(key) { storage.delete(key); },
      clear() { storage.clear(); },
    },
    document: {
      documentElement: { lang: '', dataset: {} },
      title: '',
      body: null,
      addEventListener() {},
      querySelectorAll() { return []; },
      createTreeWalker() {
        return { nextNode() { return false; } };
      },
      getElementById() { return null; },
      createElement() {
        return { click() {}, remove() {}, style: {} };
      },
    },
    NodeFilter: {
      SHOW_TEXT: 4,
      FILTER_ACCEPT: 1,
      FILTER_REJECT: 2,
    },
    window: {},
    alert(message) { throw new Error('Unexpected alert: ' + message); },
    confirm() { return true; },
  };
  context.document.body = context.document.createElement('body');
  context.window = context;
  return vm.createContext(context);
}

function load(context, files) {
  files.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  });
}

function get(context, expression) {
  return vm.runInContext(expression, context);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

async function testSettingsIgnoreLegacyTaxFields() {
  const context = createContext();
  load(context, ['js/config.js', 'js/settings.js']);

  const settings = plain(get(context, `AppSettings.save({
    country_profile: 'US',
    language: 'en',
    currency: 'BAD',
    locale: 'invalid',
    tax_label: 'Sales Tax',
    tax_id_label: 'VAT ID',
    tax_rates: [0, 8.25],
    tax_disclaimer: 'legacy tax copy',
    company: { tax_id: '12-3456789' }
  })`));

  assert.equal(settings.country_profile, 'US');
  assert.equal(settings.currency, 'USD');
  assert.equal(settings.locale, 'en-US');
  assert.equal(settings.company.tax_id, '12-3456789');
  assert.equal(Object.hasOwn(settings, 'tax_label'), false);
  assert.equal(Object.hasOwn(settings, 'tax_rates'), false);
  assert.equal(Object.hasOwn(settings, 'tax_disclaimer'), false);
}

async function testTotalsIgnoreLegacyTaxRates() {
  const context = createContext();
  load(context, ['js/config.js', 'js/database.js', 'js/settings.js', 'js/helpers.js']);

  const result = plain(await get(context, `totali('budget', 'PRJ-1', {
    budget_costi: [{ codice: 'PRJ-1', importo: 100, tax_rate: 99 }],
    budget_ricavi: [{ codice: 'PRJ-1', importo: 250, tax_rate: 99 }]
  })`));

  assert.deepEqual(result, {
    costi: 100,
    ricavi: 250,
    margine: 150,
  });
}

async function testQuoteTemplateIsPreTaxOnly() {
  const context = createContext();
  load(context, ['js/config.js', 'js/settings.js', 'js/helpers.js', 'js/preventivi.js']);

  const html = get(context, `Pages._prevTemplatePDF({
    numero: 'Q-001',
    data: '2026-05-15',
    nomeCliente: 'Acme LLC',
    noteCliente: 'Consulting package',
    righeHTML: '',
    totImp: 1000,
    azienda: { nome: 'Demo Co', indirizzo: '', cap: '', tel: '', email: '', taxId: '12-3456789' }
  })`);

  assert.match(html, new RegExp(PRE_TAX_NOTE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, /Total pre-tax/i);
  assert.doesNotMatch(html, /Sales Tax handling/i);
  assert.doesNotMatch(html, /Tax exempt/i);
  assert.doesNotMatch(html, /Total incl\./i);
  assert.doesNotMatch(html, /Tax %/i);
}

async function testExcelHasNoActiveTaxSheetsOrMetrics() {
  const context = createContext();
  load(context, ['js/config.js', 'js/database.js', 'js/settings.js', 'js/helpers.js', 'js/excel.js']);

  const settingsRows = plain(get(context, '_settingsRows()'));
  const calculatedSheets = get(context, 'Array.from(CALCULATED_SHEETS)');
  const dashboardRows = plain(await get(context, '_dashboardSummaryRows()'));
  const varianceRows = plain(await get(context, '_varianceRows()'));
  const forbiddenSettingsKeys = new Set(['tax_label', 'tax_rates', 'tax_mode', 'tax_disclaimer']);

  assert.equal(calculatedSheets.includes('Quote Tax Summary'), false);
  assert(settingsRows.every(row => !forbiddenSettingsKeys.has(String(row.Key))));
  assert(dashboardRows.every(row => !String(row.Metric).toLowerCase().includes('tax')));
  assert(varianceRows.every(row => !Object.keys(row).some(key => key.toLowerCase().includes('tax'))));
}

const tests = [
  testSettingsIgnoreLegacyTaxFields,
  testTotalsIgnoreLegacyTaxRates,
  testQuoteTemplateIsPreTaxOnly,
  testExcelHasNoActiveTaxSheetsOrMetrics,
];

for (const test of tests) {
  await test();
  console.log('PASS', test.name);
}
