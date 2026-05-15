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
  const httpRequests = [];

  page.on('console', msg => {
    const type = msg.type();
    if (['error', 'warning'].includes(type)) {
      consoleMessages.push({ type, text: msg.text() });
    }
  });
  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('request', req => {
    const url = req.url();
    if (/^https?:\/\//i.test(url)) httpRequests.push(url);
  });

  await page.goto(pathToFileURL(appPath).href, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  const result = await page.evaluate(() => ({
    title: document.title,
    xlsxLoaded: typeof XLSX !== 'undefined',
    activeDashboard: Boolean(document.querySelector('#page-dashboard.active')),
    loginRemoved: !document.getElementById('login-overlay') && !document.getElementById('reset-overlay'),
    onboardingRemoved: !document.getElementById('onboarding-overlay'),
    httpScripts: Array.from(document.scripts)
      .map(script => script.src)
      .filter(src => /^https?:\/\//i.test(src)),
    cspPresent: Boolean(document.querySelector('meta[http-equiv="Content-Security-Policy"]')),
  }));

  const workflow = await page.evaluate(async () => {
    window.confirm = () => true;
    window.alert = message => { throw new Error('Unexpected alert: ' + message); };
    AppSettings.save({ ...AppSettings.get(), first_run_done: true });
    document.getElementById('onboarding-overlay')?.remove();

    for (const table of Object.keys(TABLE_KEYS)) await DB.clear(table);
    await DB.insertBatch('anagrafica', [
      { codice: 'PRJ-X', nome: '=Formula Project', cliente: 'Client A', stato: 'In corso' },
    ]);
    await DB.insertBatch('budget_ricavi', [
      { codice: 'PRJ-X', tipo_ricavo: 'Fee', descrizione: 'Project fee', importo: 1000, aliq_iva: 22 },
    ]);

    let capturedExport = null;
    const originalWriteFile = XLSX.writeFile;
    XLSX.writeFile = (wb, filename) => {
      capturedExport = {
        filename,
        sheets: wb.SheetNames,
        projectNameCell: wb.Sheets.Projects.B2.v,
      };
    };
    await exportExcel();
    XLSX.writeFile = originalWriteFile;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { codice: 'PRJ-IMPORT', nome: 'Imported Project', cliente: 'Client B', stato: 'Pianificato' },
    ]), 'Projects');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Metric: 'Ignored', Value: 1 },
    ]), 'Dashboard Summary');
    const xlsxArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const file = new File([xlsxArray], 'import-test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await importExcel({ target: { files: [file], value: '' } });
    const importedProjects = await DB.all('anagrafica');
    const backup = await _collectBackupPayload();

    return {
      exportSheets: capturedExport.sheets,
      exportFilename: capturedExport.filename,
      formulaEscaped: capturedExport.projectNameCell === "'=Formula Project",
      importedProjectCodes: importedProjects.map(row => row.codice),
      backupHasSettings: Boolean(backup.settings && backup.settings.currency),
      backupHasTables: Boolean(backup.tables && Array.isArray(backup.tables.anagrafica)),
    };
  });

  await browser.close();

  if (!result.xlsxLoaded) throw new Error('XLSX global is missing.');
  if (!result.activeDashboard) throw new Error('Dashboard is not active after offline startup.');
  if (!result.loginRemoved) throw new Error('Login/reset overlays are still present.');
  if (!result.onboardingRemoved) throw new Error('Onboarding overlay is still present.');
  if (result.httpScripts.length) throw new Error('HTTP/HTTPS scripts found: ' + result.httpScripts.join(', '));
  if (httpRequests.length) throw new Error('HTTP/HTTPS runtime requests found: ' + httpRequests.join(', '));
  if (pageErrors.length) throw new Error('Page errors: ' + pageErrors.join(' | '));
  if (consoleMessages.length) throw new Error('Console issues: ' + JSON.stringify(consoleMessages));
  if (!result.cspPresent) throw new Error('CSP meta tag is missing.');
  if (!workflow.exportSheets.includes('Dashboard Summary')) throw new Error('Excel summary sheet missing.');
  if (!workflow.exportSheets.includes('Projects')) throw new Error('Excel projects sheet missing.');
  if (!workflow.formulaEscaped) throw new Error('Formula-like Excel string was not escaped.');
  if (!workflow.importedProjectCodes.includes('PRJ-IMPORT')) throw new Error('Excel import did not load operational sheet.');
  if (!workflow.backupHasSettings || !workflow.backupHasTables) throw new Error('JSON backup payload incomplete.');

  console.log(JSON.stringify({ result, workflow }, null, 2));
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
