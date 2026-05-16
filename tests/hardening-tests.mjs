import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');

function createContext() {
  const storage = new Map();
  const elements = new Map();
  const documentStub = {
    documentElement: { lang: '' },
    title: '',
    body: null,
    addEventListener() {},
    querySelectorAll() { return []; },
    createTreeWalker() {
      return { nextNode() { return false; } };
    },
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, {
          id,
          value: '',
          textContent: '',
          style: {},
          dataset: {},
          remove() {},
          click() {},
          querySelectorAll() { return []; },
        });
      }
      return elements.get(id);
    },
    createElement() {
      return {
        style: {},
        dataset: {},
        click() {},
        remove() {},
        appendChild() {},
      };
    },
  };
  documentStub.body = documentStub.createElement('body');

  const context = {
    console,
    Blob,
    URL: {
      createObjectURL() { return 'blob:test'; },
      revokeObjectURL() {},
    },
    NodeFilter: {
      SHOW_TEXT: 4,
      FILTER_ACCEPT: 1,
      FILTER_REJECT: 2,
    },
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); },
      removeItem(key) { storage.delete(key); },
      clear() { storage.clear(); },
    },
    document: documentStub,
    window: {},
    alert(message) { throw new Error('Unexpected alert: ' + message); },
    confirm() { return true; },
  };
  context.window = context;
  return vm.createContext(context);
}

function loadApp(context) {
  [
    'js/config.js',
    'js/database.js',
    'js/settings.js',
    'js/helpers.js',
    'js/excel.js',
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  });
}

function get(context, expression) {
  return vm.runInContext(expression, context);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

async function testCorruptStorageDoesNotBreakDBReads() {
  const context = createContext();
  loadApp(context);
  context.localStorage.setItem('project_cost_manager_db_v1', JSON.stringify({
    anagrafica: { bad: 'shape' },
    budget_costi: 'not-an-array',
    unknown_table: [{ id: 1 }],
  }));

  const rows = await get(context, "DB.all('budget_costi')");

  assert.deepEqual(plain(rows), []);
}

async function testSettingsAreNormalizedBeforePersisting() {
  const context = createContext();
  loadApp(context);

  const saved = await get(context, `AppSettings.save({
    language: 'de',
    currency: 'BAD',
    locale: 'not-a-locale',
    tax_label: '<VAT>',
    tax_id_label: '<ID>',
    tax_rates: [-5, '8.25', 250, 'x'],
    company: { name: '${'A'.repeat(1200)}' }
  })`);

  assert.equal(saved.language, 'en');
  assert.equal(saved.currency, 'USD');
  assert.equal(saved.locale, 'en-US');
  assert.deepEqual(plain(saved.tax_rates), [8.25]);
  assert.equal(saved.tax_label, 'Sales Tax');
  assert.equal(saved.tax_id_label, 'EIN / Tax ID');
  assert.equal(saved.company.name.length, 500);
  assert.doesNotThrow(() => get(context, 'AppSettings.money(10)'));
}

async function testImportRowsAreBoundedAndPlain() {
  const context = createContext();
  loadApp(context);

  const rows = await get(context, `ImportSafety.normalizeRows('anagrafica', [{
    codice: 'PRJ-001',
    nome: '${'B'.repeat(1200)}',
    nested: { a: 1 },
    list: [1, 2],
    unsafe: '<script>alert(1)</script>'
  }])`);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].nome.length, 500);
  assert.equal(rows[0].nested, '');
  assert.equal(rows[0].list, '');
  assert.equal(rows[0].unsafe, '<script>alert(1)</script>');
}

async function testBackupPayloadValidationRejectsMalformedTables() {
  const context = createContext();
  loadApp(context);

  assert.throws(
    () => get(context, "_validateBackupPayload({ version: 2, settings: {}, tables: { anagrafica: 'bad' } })"),
    /Invalid backup table/
  );
}

const tests = [
  testCorruptStorageDoesNotBreakDBReads,
  testSettingsAreNormalizedBeforePersisting,
  testImportRowsAreBoundedAndPlain,
  testBackupPayloadValidationRejectsMalformedTables,
];

for (const test of tests) {
  await test();
  console.log('PASS', test.name);
}
