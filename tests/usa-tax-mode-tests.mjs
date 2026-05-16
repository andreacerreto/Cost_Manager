import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');

function createContext() {
  const storage = new Map();
  const context = {
    console,
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
    },
    NodeFilter: {
      SHOW_TEXT: 4,
      FILTER_ACCEPT: 1,
      FILTER_REJECT: 2,
    },
    window: {},
  };
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

async function testUsProfileIsExplicitAndNormalizesDefaults() {
  const context = createContext();
  load(context, ['js/config.js', 'js/settings.js']);

  const settings = get(context, `AppSettings.save({
    country_profile: 'US',
    language: 'en',
    currency: 'CAD',
    locale: 'invalid-locale',
    tax_label: 'VAT',
    tax_id_label: 'VAT ID',
    tax_rates: [8.25]
  })`);

  assert.equal(settings.country_profile, 'US');
  assert.equal(settings.currency, 'USD');
  assert.equal(settings.locale, 'en-US');
  assert.equal(settings.tax_label, 'Sales Tax');
  assert.equal(settings.tax_id_label, 'EIN / Tax ID');
  assert.equal(get(context, 'AppSettings.countryProfile()'), 'US');
}

async function testManualSalesTaxSummaryRoundsAndSupportsExemption() {
  const context = createContext();
  load(context, ['js/config.js', 'js/settings.js', 'js/helpers.js']);

  const taxable = get(context, 'F.salesTaxSummary(1299.995, 8.25, false)');
  assert.deepEqual(plain(taxable), {
    taxableBase: 1300,
    taxRate: 8.25,
    taxAmount: 107.25,
    total: 1407.25,
    taxExempt: false,
  });

  const exempt = get(context, 'F.salesTaxSummary(1299.995, 8.25, true)');
  assert.deepEqual(plain(exempt), {
    taxableBase: 1300,
    taxRate: 0,
    taxAmount: 0,
    total: 1300,
    taxExempt: true,
  });
}

async function testQuoteTemplateIncludesUsComplianceCopy() {
  const context = createContext();
  load(context, ['js/config.js', 'js/settings.js', 'js/helpers.js', 'js/preventivi.js']);

  get(context, `AppSettings.save({
    country_profile: 'US',
    language: 'en',
    currency: 'USD',
    locale: 'en-US',
    tax_label: 'Sales Tax',
    tax_id_label: 'EIN / Tax ID',
    tax_rates: [0, 8.25],
    first_run_done: true
  })`);

  const html = get(context, `Pages._prevTemplatePDF({
    numero: 'Q-001',
    data: '2026-05-15',
    nomeCliente: 'Acme LLC',
    noteCliente: 'Consulting package',
    righeHTML: '',
    totImp: 1000,
    totTax: 82.5,
    totFinale: 1082.5,
    taxExempt: false,
    taxJurisdiction: 'CA / Los Angeles County',
    taxNote: 'Manual rate verified by user.',
    azienda: { nome: 'Demo Co', indirizzo: '', cap: '', tel: '', email: '', taxId: '12-3456789' }
  })`);

  assert.match(html, /Sales Tax handling/i);
  assert.match(html, /manually entered/i);
  assert.match(html, /verify with your accountant/i);
  assert.match(html, /CA \/ Los Angeles County/i);
}

async function testExcelSettingsExportIncludesUsTaxMetadata() {
  const context = createContext();
  load(context, ['js/config.js', 'js/database.js', 'js/settings.js', 'js/helpers.js', 'js/excel.js']);

  get(context, `AppSettings.save({
    country_profile: 'US',
    language: 'en',
    currency: 'USD',
    locale: 'en-US',
    tax_label: 'Sales Tax',
    tax_id_label: 'EIN / Tax ID',
    tax_rates: [0, 8.25]
  })`);

  const rows = plain(get(context, '_settingsRows()'));
  assert(rows.some(row => row.Key === 'country_profile' && row.Value === 'US'));
  assert(rows.some(row => row.Key === 'tax_disclaimer' && String(row.Value).includes('not legal, tax, or accounting advice')));
}

const tests = [
  testUsProfileIsExplicitAndNormalizesDefaults,
  testManualSalesTaxSummaryRoundsAndSupportsExemption,
  testQuoteTemplateIncludesUsComplianceCopy,
  testExcelSettingsExportIncludesUsTaxMetadata,
];

for (const test of tests) {
  await test();
  console.log('PASS', test.name);
}
