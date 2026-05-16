'use strict';

/* ============================================================
 * EXCEL.JS - Excel sharing + JSON backup.
 *
 * Excel (.xlsx) is for advisors/consultants and operational exchange.
 * JSON is for complete local backup and restore, including settings.
 * ============================================================ */

const EXCEL_OPERATIONAL_SHEETS = {
  'Projects': 'anagrafica',
  'Budget Costs': 'budget_costi',
  'Budget Revenue': 'budget_ricavi',
  'Actual Costs': 'consuntivo_costi',
  'Actual Revenue': 'consuntivo_ricavi',
  'Overheads Budget': 'cg_budget',
  'Overheads Actual': 'cg_consuntivo',
  'Quotes': 'preventivi',
  'Quote Lines': 'preventivi_righe',

};

const EXCEL_EXPORT_TABLES = [
  ['anagrafica', 'Projects'],
  ['budget_costi', 'Budget Costs'],
  ['budget_ricavi', 'Budget Revenue'],
  ['consuntivo_costi', 'Actual Costs'],
  ['consuntivo_ricavi', 'Actual Revenue'],
  ['cg_budget', 'Overheads Budget'],
  ['cg_consuntivo', 'Overheads Actual'],
  ['preventivi', 'Quotes'],
  ['preventivi_righe', 'Quote Lines'],
];

const BACKUP_TABLES = [
  'anagrafica',
  'budget_costi',
  'budget_ricavi',
  'consuntivo_costi',
  'consuntivo_ricavi',
  'cg_budget',
  'cg_consuntivo',
  'politica_prezzi',
  'preventivi',
  'preventivi_righe',
];

const CALCULATED_SHEETS = new Set([
  'Dashboard Summary',
  'Variance Analysis',
  'Quote Tax Summary',
  'Settings',
]);

function _downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function _requireXlsx() {
  if (typeof XLSX === 'undefined') {
    alert('Libreria Excel mancante nel pacchetto. Verifica che vendor/sheetjs/xlsx.full.min.js sia presente.');
    return false;
  }
  return true;
}

function _flattenOverheads(rows) {
  return rows.map(function (row) {
    const flat = { ...row };
    const dati = row.dati || {};
    delete flat.dati;
    C.MESIK.forEach(m => { flat[m] = +(dati[m] || row[m] || 0); });
    return flat;
  });
}

function _unflattenOverheads(rows) {
  return rows.map(function (row) {
    const copy = { ...row };
    C.MESIK.forEach(function (m) {
      copy[m] = +(row[m] || 0);
    });
    return copy;
  });
}

function _overheadTotal(row) {
  const source = row.dati || row;
  return C.MESIK.reduce((sum, m) => sum + (+source[m] || 0), 0);
}

async function _dashboardSummaryRows() {
  const ana = await DB.all('anagrafica');
  const bulk = await DB.allBulk(['budget_costi', 'budget_ricavi', 'consuntivo_costi', 'consuntivo_ricavi']);
  const cgB = (await DB.all('cg_budget')).reduce((a, r) => a + _overheadTotal(r), 0);
  const cgC = (await DB.all('cg_consuntivo')).reduce((a, r) => a + _overheadTotal(r), 0);
  let budgetCosts = 0, actualCosts = 0, budgetRevenue = 0, actualRevenue = 0, budgetTax = 0, actualTax = 0;

  for (const p of ana) {
    const b = await totali('budget', p.codice, bulk);
    const e = await totali('consuntivo', p.codice, bulk);
    budgetCosts += b.costi;
    actualCosts += e.costi;
    budgetRevenue += b.ricavi;
    actualRevenue += e.ricavi;
    budgetTax += b.taxNet;
    actualTax += e.taxNet;
  }

  return [
    { Metric: 'Projects', Value: ana.length },
    { Metric: 'Budget Revenue', Value: budgetRevenue },
    { Metric: 'Actual Revenue', Value: actualRevenue },
    { Metric: 'Budget Costs', Value: budgetCosts },
    { Metric: 'Actual Costs', Value: actualCosts },
    { Metric: 'Budget Margin', Value: budgetRevenue - budgetCosts },
    { Metric: 'Actual Margin', Value: actualRevenue - actualCosts },
    { Metric: 'Budget Tax Net', Value: budgetTax },
    { Metric: 'Actual Tax Net', Value: actualTax },
    { Metric: 'Overheads Budget', Value: cgB },
    { Metric: 'Overheads Actual', Value: cgC },
    { Metric: 'Currency', Value: AppSettings.get().currency },
    { Metric: 'Tax Label', Value: AppSettings.taxLabel() },
  ];
}

async function _varianceRows() {
  const ana = await DB.all('anagrafica');
  return Promise.all(ana.map(async function (p) {
    const b = await totali('budget', p.codice);
    const e = await totali('consuntivo', p.codice);
    return {
      Code: p.codice,
      Project: p.nome,
      Client: p.cliente,
      'Budget Costs': b.costi,
      'Actual Costs': e.costi,
      'Cost Variance': e.costi - b.costi,
      'Budget Revenue': b.ricavi,
      'Actual Revenue': e.ricavi,
      'Revenue Variance': e.ricavi - b.ricavi,
      'Budget Margin': b.margine,
      'Actual Margin': e.margine,
      'Margin Variance': e.margine - b.margine,
      'Budget Tax Net': b.taxNet,
      'Actual Tax Net': e.taxNet,
    };
  }));
}

async function _quoteTaxSummaryRows() {
  const quotes = await DB.all('preventivi');
  const lines = await DB.all('preventivi_righe');
  const projects = await DB.all('anagrafica');
  const projectByCode = projects.reduce(function (acc, project) {
    acc[project.codice] = project;
    return acc;
  }, {});
  const taxLabel = AppSettings.taxLabel();
  const disclaimer = AppSettings.taxDisclaimer ? AppSettings.taxDisclaimer() : '';

  return quotes.map(function (quote) {
    const quoteLines = lines.filter(line => String(line.preventivo_id) === String(quote.id));
    let subtotal = 0;
    let taxAmount = 0;
    const taxExempt = Boolean(quote.tax_exempt);
    quoteLines.forEach(function (line) {
      const amount = +line.importo || 0;
      subtotal += amount;
      taxAmount += F.salesTaxSummary(amount, line.tax_rate ?? F.defaultTaxRate(), taxExempt).taxAmount;
    });
    const firstRate = quoteLines.find(line => line.tax_rate !== undefined && line.tax_rate !== null)?.tax_rate ?? '';
    const project = projectByCode[quote.codice] || {};
    return {
      'Quote No.': quote.numero,
      'Project Code': quote.codice,
      Project: project.nome || '',
      Client: project.cliente || '',
      Date: quote.data,
      Status: quote.stato,
      'Tax Mode': quote.tax_mode || (AppSettings.isUsProfile && AppSettings.isUsProfile() ? 'manual-us-sales-tax' : 'manual-tax'),
      'Tax Exempt': taxExempt ? 'Yes' : 'No',
      'Customer State / County': quote.tax_jurisdiction || '',
      [taxLabel + ' Rate %']: taxExempt ? 0 : firstRate,
      Subtotal: F.roundMoney(subtotal),
      [taxLabel]: F.roundMoney(taxAmount),
      ['Total incl. ' + taxLabel]: F.roundMoney(subtotal + taxAmount),
      'Tax Note': quote.tax_note || '',
      'Compliance Note': disclaimer,
    };
  });
}

function _settingsRows() {
  const settings = AppSettings.get();
  return [
    { Key: 'country_profile', Value: settings.country_profile },
    { Key: 'language', Value: settings.language },
    { Key: 'currency', Value: settings.currency },
    { Key: 'locale', Value: settings.locale },
    { Key: 'tax_label', Value: settings.tax_label },
    { Key: 'tax_id_label', Value: settings.tax_id_label },
    { Key: 'tax_rates', Value: settings.tax_rates.join(', ') },
    { Key: 'tax_mode', Value: settings.country_profile === 'US' ? 'manual-us-sales-tax' : 'manual-tax' },
    { Key: 'tax_disclaimer', Value: settings.tax_disclaimer || '' },
    { Key: 'company_name', Value: settings.company.name },
    { Key: 'company_address', Value: settings.company.address },
    { Key: 'company_postal_code', Value: settings.company.postal_code },
    { Key: 'company_phone', Value: settings.company.phone },
    { Key: 'company_email', Value: settings.company.email },
    { Key: 'company_tax_id', Value: settings.company.tax_id },
  ];
}

function _appendSheet(wb, rows, name) {
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ImportSafety.safeExcelRows(rows)), name);
}

async function exportExcel() {
  if (!_requireXlsx()) return;

  const date = new Date().toISOString().slice(0, 10);
  const wb = XLSX.utils.book_new();

  _appendSheet(wb, await _dashboardSummaryRows(), 'Dashboard Summary');

  for (const entry of EXCEL_EXPORT_TABLES) {
    const table = entry[0], sheet = entry[1];
    const rows = await DB.all(table);
    _appendSheet(wb, table.startsWith('cg_') ? _flattenOverheads(rows) : rows, sheet);
  }

  _appendSheet(wb, await _varianceRows(), 'Variance Analysis');
  _appendSheet(wb, await _quoteTaxSummaryRows(), 'Quote Tax Summary');
  _appendSheet(wb, _settingsRows(), 'Settings');

  XLSX.writeFile(wb, 'project-cost-manager-' + date + '.xlsx');
}

function importExcelTrigger() {
  document.getElementById('import-excel-input').click();
}

function importShowOverlay(msg) {
  const div = document.createElement('div');
  div.id = 'import-loading-overlay';
  div.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);' +
    'z-index:99999;display:flex;align-items:center;justify-content:center;';
  div.innerHTML =
    '<div style="background:#fff;border-radius:14px;padding:36px 48px;' +
    'text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.30);min-width:260px;">' +
      '<div style="font-size:15px;font-weight:700;color:#1B4332;">' + F.esc(msg) + '</div>' +
      '<div style="font-size:12px;color:#999;margin-top:6px;">Please wait...</div>' +
    '</div>';
  document.body.appendChild(div);
  return div;
}

function importShowResult(imported, skipped) {
  const rows = Object.entries(imported).map(function(entry) {
    return '<tr><td style="padding:6px 14px;color:#333;font-size:13px;">' +
      F.esc(entry[0]) + '</td><td style="padding:6px 14px;text-align:right;font-weight:700;color:#1B4332;font-size:13px;">' +
      entry[1] + '</td></tr>';
  }).join('');
  const skipNote = skipped.length
    ? '<p style="font-size:11px;color:#64748B;margin-top:10px;">Ignored calculated sheets: ' +
      skipped.map(s => '<i>' + F.esc(s) + '</i>').join(', ') + '</p>'
    : '';

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);' +
    'z-index:99999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML =
    '<div style="background:#fff;border-radius:14px;padding:30px 38px;' +
    'min-width:360px;max-width:520px;box-shadow:0 10px 40px rgba(0,0,0,.30);">' +
      '<div style="font-size:20px;font-weight:700;color:#1B4332;margin-bottom:6px;">Import completed</div>' +
      '<p style="font-size:13px;color:#666;margin-bottom:16px;">Operational data was loaded.</p>' +
      '<table style="width:100%;font-size:13px;border-collapse:collapse;border-top:1px solid #eee;border-bottom:1px solid #eee;">' + rows + '</table>' +
      skipNote +
      '<div style="text-align:right;margin-top:20px;">' +
        '<button onclick="this.closest(\'[style*=fixed]\').remove()" class="btn">Close</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

async function _replaceRows(table, rows) {
  await DB.clear(table);
  const safeRows = ImportSafety.normalizeRows(table, rows);
  const normalized = table.startsWith('cg_') ? _unflattenOverheads(safeRows) : safeRows;
  if (normalized.length) await DB.insertBatch(table, normalized);
  return normalized.length;
}

async function importExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = '';

  if (!_requireXlsx()) return;
  try {
    ImportSafety.assertFileSize(file, 'Excel import file');
  } catch (err) {
    alert(err.message);
    return;
  }
  if (!confirm('Import Excel file "' + file.name + '"?\n\nOperational sheets will replace current local data.')) return;

  const loadingEl = importShowOverlay('Importing Excel...');

  try {
    const imported = {};
    const skipped = [];
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    if (wb.SheetNames.length > ImportSafety.limits.maxSheets) {
      throw new Error('Workbook contains too many sheets for offline import.');
    }

    for (const sheetName of wb.SheetNames) {
      const table = EXCEL_OPERATIONAL_SHEETS[sheetName];
      if (!table) {
        skipped.push(sheetName);
        continue;
      }
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
      imported[sheetName] = await _replaceRows(table, rows);
    }

    DB.invalidateCache();
    App.go(App.page);
    importShowResult(imported, skipped.filter(name => CALCULATED_SHEETS.has(name) || !EXCEL_OPERATIONAL_SHEETS[name]));
  } catch (err) {
    console.error('Excel import error:', err);
    alert('Excel import error: ' + err.message);
  } finally {
    loadingEl.remove();
  }
}

async function _collectBackupPayload() {
  const payload = {
    version: 2,
    exported_at: new Date().toISOString(),
    settings: AppSettings.get(),
    tables: {},
  };
  for (const table of BACKUP_TABLES) {
    payload.tables[table] = await DB.all(table);
  }
  return payload;
}

function _validateBackupPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Invalid backup format.');
  }
  const tables = payload.tables || payload;
  if (!tables || typeof tables !== 'object' || Array.isArray(tables)) {
    throw new Error('Invalid backup tables.');
  }
  Object.keys(tables).forEach(function (table) {
    if (BACKUP_TABLES.includes(table) && !Array.isArray(tables[table])) {
      throw new Error('Invalid backup table: ' + table);
    }
  });
  return {
    settings: payload.settings || null,
    tables,
  };
}

async function exportBackupJson() {
  const date = new Date().toISOString().slice(0, 10);
  const payload = await _collectBackupPayload();
  const settings = AppSettings.update({ last_backup_at: payload.exported_at });
  payload.settings = settings;
  _downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    'project-cost-manager-backup-' + date + '.json'
  );
  if (App.page === 'backup') App.go('backup');
}

function restoreBackupTrigger() {
  document.getElementById('restore-backup-input').click();
}

async function restoreBackupJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = '';

  try {
    ImportSafety.assertFileSize(file, 'JSON backup file');
  } catch (err) {
    alert(err.message);
    return;
  }
  if (!confirm('Restore JSON backup "' + file.name + '"?\n\nAll current local data will be replaced.')) return;

  const loadingEl = importShowOverlay('Restoring backup...');
  try {
    const backup = _validateBackupPayload(JSON.parse(await file.text()));
    const tables = backup.tables;

    for (const table of BACKUP_TABLES) {
      await DB.clear(table);
      const rows = Array.isArray(tables[table]) ? ImportSafety.normalizeRows(table, tables[table]) : [];
      if (rows.length) await DB.insertBatch(table, rows);
    }

    AppSettings.save(backup.settings || {
      ...DEFAULT_SETTINGS,
      first_run_done: true,
    });

    DB.invalidateCache();
    App.go('dashboard');
    alert('Backup restored.');
  } catch (err) {
    console.error('Backup restore error:', err);
    alert('Backup restore error: ' + err.message);
  } finally {
    loadingEl.remove();
  }
}
