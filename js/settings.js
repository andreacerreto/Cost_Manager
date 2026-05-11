'use strict';

/* ============================================================
 * SETTINGS.JS - Commercial settings, i18n, onboarding and backup UI.
 * ============================================================ */

const SETTINGS_STORAGE_KEY = 'project_cost_manager_settings_v1';
const SETTINGS_ALLOWED_LANGUAGES = ['en', 'it'];
const SETTINGS_ALLOWED_CURRENCIES = ['EUR', 'USD', 'GBP'];
const SETTINGS_ALLOWED_LOCALES = ['en-US', 'en-GB', 'it-IT'];
const SETTINGS_TEXT_MAX = 500;

const DEFAULT_SETTINGS = {
  language: 'en',
  currency: 'EUR',
  locale: 'en-US',
  tax_label: 'VAT',
  tax_id_label: 'VAT ID',
  tax_rates: [0, 4, 10, 22],
  first_run_done: false,
  last_backup_at: '',
  company: {
    name: '',
    address: '',
    postal_code: '',
    phone: '',
    email: '',
    tax_id: '',
  },
};

const I18N = {
  en: {
    'app.subtitle': 'Offline project control',
    'nav.dashboard': 'Dashboard',
    'nav.projects': 'Projects',
    'nav.budget': 'Budget',
    'nav.actuals': 'Actuals',
    'nav.variance': 'Variance',
    'nav.overheads': 'Overheads',
    'nav.analytics': 'Analytics',
    'nav.quotes': 'Quotes',
    'nav.pricing': 'Pricing Settings',
    'nav.exportExcel': 'Export Excel',
    'nav.importExcel': 'Import Excel',
    'nav.backup': 'Backup JSON',
    'nav.settings': 'Settings',
    'session.label': 'Mode',
    'offline.user': 'Offline local',
    'settings.title': 'Settings',
    'settings.subtitle': 'Configure language, currency, tax labels and company details used in quotes and exports.',
    'settings.language': 'Language',
    'settings.currency': 'Currency',
    'settings.locale': 'Number format',
    'settings.taxLabel': 'Tax label',
    'settings.taxIdLabel': 'Company tax ID label',
    'settings.taxRates': 'Tax rates (%)',
    'settings.company': 'Company details',
    'settings.companyName': 'Company name',
    'settings.address': 'Address',
    'settings.postalCode': 'Postal / ZIP code',
    'settings.phone': 'Phone',
    'settings.email': 'Email',
    'settings.taxId': 'Tax ID',
    'settings.save': 'Save settings',
    'settings.saved': 'Settings saved',
    'settings.demo': 'Load demo data',
    'settings.demoHint': 'Replace current data with a small project-based business sample.',
    'backup.title': 'Backup & Restore',
    'backup.subtitle': 'Use Excel for advisors. Use JSON for complete app backup and restore.',
    'backup.excelTitle': 'Excel sharing',
    'backup.excelText': 'Create an .xlsx workbook with operational sheets, variance analysis and settings.',
    'backup.jsonTitle': 'Complete JSON backup',
    'backup.jsonText': 'Save and restore all local data, including settings.',
    'backup.last': 'Last backup',
    'backup.never': 'Never',
    'backup.exportJson': 'Backup JSON',
    'backup.restoreJson': 'Restore Backup',
    'backup.exportExcel': 'Export Excel',
    'backup.importExcel': 'Import Excel',
    'onboarding.title': 'Set up Project Cost Manager',
    'onboarding.subtitle': 'Choose the defaults for your offline workspace.',
    'onboarding.start': 'Start using the app',
    'onboarding.demo': 'Load demo data',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
  },
  it: {
    'app.subtitle': 'Controllo commesse offline',
    'nav.dashboard': 'Dashboard',
    'nav.projects': 'Progetti',
    'nav.budget': 'Budget',
    'nav.actuals': 'Consuntivo',
    'nav.variance': 'Varianze',
    'nav.overheads': 'Costi generali',
    'nav.analytics': 'Analytics',
    'nav.quotes': 'Preventivi',
    'nav.pricing': 'Impostazioni preventivi',
    'nav.exportExcel': 'Esporta Excel',
    'nav.importExcel': 'Importa Excel',
    'nav.backup': 'Backup JSON',
    'nav.settings': 'Impostazioni',
    'session.label': 'Modalita',
    'offline.user': 'Offline locale',
    'settings.title': 'Impostazioni',
    'settings.subtitle': 'Configura lingua, valuta, fiscalita e dati aziendali usati in preventivi ed export.',
    'settings.language': 'Lingua',
    'settings.currency': 'Valuta',
    'settings.locale': 'Formato numeri',
    'settings.taxLabel': 'Etichetta imposta',
    'settings.taxIdLabel': 'Etichetta codice fiscale azienda',
    'settings.taxRates': 'Aliquote imposta (%)',
    'settings.company': 'Dati aziendali',
    'settings.companyName': 'Nome azienda',
    'settings.address': 'Indirizzo',
    'settings.postalCode': 'CAP',
    'settings.phone': 'Telefono',
    'settings.email': 'Email',
    'settings.taxId': 'Partita IVA / Tax ID',
    'settings.save': 'Salva impostazioni',
    'settings.saved': 'Impostazioni salvate',
    'settings.demo': 'Carica dati demo',
    'settings.demoHint': 'Sostituisce i dati attuali con un esempio per imprese a progetto.',
    'backup.title': 'Backup e ripristino',
    'backup.subtitle': 'Usa Excel per i consulenti. Usa JSON per backup e ripristino completo.',
    'backup.excelTitle': 'Condivisione Excel',
    'backup.excelText': 'Crea un file .xlsx con fogli operativi, analisi varianze e impostazioni.',
    'backup.jsonTitle': 'Backup completo JSON',
    'backup.jsonText': 'Salva e ripristina tutti i dati locali, incluse le impostazioni.',
    'backup.last': 'Ultimo backup',
    'backup.never': 'Mai',
    'backup.exportJson': 'Backup JSON',
    'backup.restoreJson': 'Ripristina backup',
    'backup.exportExcel': 'Esporta Excel',
    'backup.importExcel': 'Importa Excel',
    'onboarding.title': 'Configura Project Cost Manager',
    'onboarding.subtitle': 'Scegli le impostazioni iniziali del workspace offline.',
    'onboarding.start': 'Inizia a usare l app',
    'onboarding.demo': 'Carica dati demo',
    'common.cancel': 'Annulla',
    'common.save': 'Salva',
  },
};

const DOM_TRANSLATIONS_EN = {
  'Anagrafica Progetti': 'Projects',
  'Budget Preventivo': 'Budget',
  'Consuntivo': 'Actuals',
  'Consuntivo Effettivo': 'Actuals',
  'Analisi Varianze': 'Variance Analysis',
  'Costi Generali Aziendali': 'Company Overheads',
  'Costi Generali': 'Overheads',
  'Preventivi Cliente': 'Client Quotes',
  'Preventivi Esistenti': 'Existing Quotes',
  'Impostazioni Preventivi': 'Pricing Settings',
  'Dati Aziendali': 'Company Details',
  'Obiettivi Aziendali': 'Company Targets',
  'Nome Azienda': 'Company Name',
  'Partita IVA': 'Tax ID',
  'Progetto': 'Project',
  'Cliente': 'Client',
  'Cod. Progetto': 'Project Code',
  'Nome Progetto': 'Project Name',
  'Data Inizio': 'Start Date',
  'Data Fine Prev.': 'Planned End',
  'Responsabile': 'Owner',
  'Tipologia': 'Type',
  'Stato': 'Status',
  'Note': 'Notes',
  'Ricavi Totali': 'Total Revenue',
  'Costi Totali': 'Total Costs',
  'Margine Lordo': 'Gross Margin',
  'Costi Fissi Totali': 'Total Fixed Costs',
  'Ricavi reali': 'Actual Revenue',
  'Costi Variabili': 'Variable Costs',
  'Totale Costi': 'Total Costs',
  'Totale Ricavi': 'Total Revenue',
  'Costo Interno': 'Internal Cost',
  'Totale Imponibile': 'Subtotal',
  'Totale complessivo': 'Total',
  'Budget': 'Budget',
  'Varianza': 'Variance',
  'COSTI': 'COSTS',
  'RICAVI': 'REVENUE',
  'Riepilogo Progetto': 'Project Summary',
  'Categoria': 'Category',
  'Descrizione': 'Description',
  'Costo Tot.': 'Total Cost',
  'Tipo Ricavo': 'Revenue Type',
  'Voce di Costo': 'Cost Item',
  'TOT ANNO': 'YEAR TOTAL',
  'TOTALI': 'TOTALS',
  'Nuova voce': 'New item',
  'Nuovo Progetto': 'New Project',
  'Aggiungi riga costo': 'Add cost row',
  'Aggiungi riga ricavo': 'Add revenue row',
  'Genera Nuovo Preventivo': 'Create New Quote',
  'N. Preventivo': 'Quote No.',
  'Data': 'Date',
  'Azioni': 'Actions',
  'Apri': 'Open',
  'PDF': 'PDF',
  'Elimina': 'Delete',
  'Salva Preventivo': 'Save Quote',
  'Anteprima PDF': 'PDF Preview',
  'Stampa / Salva PDF': 'Print / Save PDF',
  'Chiudi': 'Close',
  'Tutti': 'All',
  'Pianificato': 'Planned',
  'In corso': 'In progress',
  'Completato': 'Completed',
  'Sospeso': 'Paused',
  'Bozza': 'Draft',
  'Inviato': 'Sent',
  'Accettato': 'Accepted',
  'Rifiutato': 'Rejected',
};

function _settingsClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function _settingsCleanText(value, fallback, maxLength) {
  if (value === undefined || value === null) return fallback || '';
  if (!['string', 'number', 'boolean'].includes(typeof value)) return fallback || '';
  const cleaned = String(value)
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength || SETTINGS_TEXT_MAX);
  return cleaned || fallback || '';
}

function _settingsCleanLabel(value, fallback) {
  const cleaned = _settingsCleanText(value, fallback, 30);
  return /^[A-Za-z0-9 ._/%-]{1,30}$/.test(cleaned) ? cleaned : fallback;
}

function _settingsCleanRates(value) {
  const source = Array.isArray(value)
    ? value
    : String(value ?? '').split(',');
  const rates = source
    .map(v => Number(String(v).trim().replace(',', '.')))
    .filter(v => Number.isFinite(v) && v >= 0 && v <= 100);
  return [...new Set(rates)].slice(0, 12);
}

function _settingsEsc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function _settingsMerge(settings) {
  const input = settings || {};
  const merged = {
    ..._settingsClone(DEFAULT_SETTINGS),
    ...input,
    company: {
      ..._settingsClone(DEFAULT_SETTINGS.company),
      ...(input.company || {}),
    },
  };
  const language = SETTINGS_ALLOWED_LANGUAGES.includes(merged.language) ? merged.language : DEFAULT_SETTINGS.language;
  const currency = SETTINGS_ALLOWED_CURRENCIES.includes(merged.currency) ? merged.currency : DEFAULT_SETTINGS.currency;
  const locale = SETTINGS_ALLOWED_LOCALES.includes(merged.locale)
    ? merged.locale
    : (language === 'it' ? 'it-IT' : DEFAULT_SETTINGS.locale);
  const taxRates = _settingsCleanRates(merged.tax_rates);

  merged.language = language;
  merged.currency = currency;
  merged.locale = locale;
  merged.tax_label = _settingsCleanLabel(merged.tax_label, language === 'it' ? 'IVA' : 'VAT');
  merged.tax_id_label = _settingsCleanLabel(merged.tax_id_label, language === 'it' ? 'P.IVA' : 'Tax ID');
  merged.tax_rates = taxRates.length ? taxRates : DEFAULT_SETTINGS.tax_rates.slice();
  merged.first_run_done = Boolean(merged.first_run_done);
  merged.last_backup_at = _settingsCleanText(merged.last_backup_at, '', 80);
  merged.company = {
    name: _settingsCleanText(merged.company.name, '', SETTINGS_TEXT_MAX),
    address: _settingsCleanText(merged.company.address, '', SETTINGS_TEXT_MAX),
    postal_code: _settingsCleanText(merged.company.postal_code, '', 40),
    phone: _settingsCleanText(merged.company.phone, '', 80),
    email: _settingsCleanText(merged.company.email, '', 120),
    tax_id: _settingsCleanText(merged.company.tax_id, '', 80),
  };
  return merged;
}

const AppSettings = {
  get() {
    try {
      return _settingsMerge(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}'));
    } catch (err) {
      console.error('Settings read error:', err);
      return _settingsMerge();
    }
  },

  save(settings) {
    const merged = _settingsMerge(settings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    AppSettings.apply();
    return merged;
  },

  update(patch) {
    return AppSettings.save({
      ...AppSettings.get(),
      ...(patch || {}),
      company: {
        ...AppSettings.get().company,
        ...((patch || {}).company || {}),
      },
    });
  },

  t(key) {
    const language = AppSettings.get().language;
    return (I18N[language] && I18N[language][key]) || I18N.en[key] || key;
  },

  money(value) {
    if (isNaN(value)) return '\u2014';
    const settings = AppSettings.get();
    try {
      return new Intl.NumberFormat(settings.locale || 'en-US', {
        style: 'currency',
        currency: settings.currency || 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value));
    } catch (err) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value));
    }
  },

  taxLabel() {
    return AppSettings.get().tax_label || 'Tax';
  },

  taxIdLabel() {
    return AppSettings.get().tax_id_label || 'Tax ID';
  },

  taxRates() {
    return AppSettings.get().tax_rates || DEFAULT_SETTINGS.tax_rates;
  },

  apply() {
    const settings = AppSettings.get();
    if (window.C) C.IVA = AppSettings.taxRates();
    document.documentElement.lang = settings.language === 'it' ? 'it' : 'en';
    document.title = 'Project Cost Manager';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = AppSettings.t(el.dataset.i18n);
    });
    const user = document.getElementById('user-email-lbl');
    if (user) user.textContent = AppSettings.t('offline.user');
    AppSettings.translateDom(document.body);
  },

  translateDom(root) {
    if (AppSettings.get().language !== 'en' || !root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      const original = node.nodeValue;
      const trimmed = original.trim();
      const translated = DOM_TRANSLATIONS_EN[trimmed];
      if (translated) node.nodeValue = original.replace(trimmed, translated);
    });

    root.querySelectorAll?.('input[placeholder], textarea[placeholder]').forEach(function (el) {
      const translated = DOM_TRANSLATIONS_EN[el.getAttribute('placeholder')];
      if (translated) el.setAttribute('placeholder', translated);
    });
  },

  collectForm(prefix) {
    const value = id => document.getElementById(prefix + id)?.value?.trim?.() || '';
    const rates = value('tax-rates')
      .split(',')
      .map(v => Number(String(v).trim().replace(',', '.')))
      .filter(v => Number.isFinite(v));
    const language = value('language') || 'en';
    const currency = value('currency') || 'EUR';
    return {
      ...AppSettings.get(),
      language,
      currency,
      locale: value('locale') || (language === 'it' ? 'it-IT' : 'en-US'),
      tax_label: value('tax-label') || (language === 'it' ? 'IVA' : 'VAT'),
      tax_id_label: value('tax-id-label') || (language === 'it' ? 'P.IVA' : 'VAT ID'),
      tax_rates: rates.length ? rates : DEFAULT_SETTINGS.tax_rates,
      company: {
        name: value('company-name'),
        address: value('company-address'),
        postal_code: value('company-postal'),
        phone: value('company-phone'),
        email: value('company-email'),
        tax_id: value('company-tax-id'),
      },
    };
  },

  formHtml(settings, prefix) {
    const s = _settingsMerge(settings);
    const company = s.company || {};
    return (
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;max-width:860px;">' +
        '<label><b>' + AppSettings.t('settings.language') + '</b><select id="' + prefix + 'language" style="width:100%;margin-top:6px;">' +
          '<option value="en"' + (s.language === 'en' ? ' selected' : '') + '>English</option>' +
          '<option value="it"' + (s.language === 'it' ? ' selected' : '') + '>Italiano</option>' +
        '</select></label>' +
        '<label><b>' + AppSettings.t('settings.currency') + '</b><select id="' + prefix + 'currency" style="width:100%;margin-top:6px;">' +
          ['EUR', 'USD', 'GBP'].map(c => '<option value="' + c + '"' + (s.currency === c ? ' selected' : '') + '>' + c + '</option>').join('') +
        '</select></label>' +
        '<label><b>' + AppSettings.t('settings.locale') + '</b><select id="' + prefix + 'locale" style="width:100%;margin-top:6px;">' +
          ['en-US', 'en-GB', 'it-IT'].map(l => '<option value="' + l + '"' + (s.locale === l ? ' selected' : '') + '>' + l + '</option>').join('') +
        '</select></label>' +
        '<label><b>' + AppSettings.t('settings.taxLabel') + '</b><input id="' + prefix + 'tax-label" value="' + _settingsEsc(s.tax_label) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + AppSettings.t('settings.taxIdLabel') + '</b><input id="' + prefix + 'tax-id-label" value="' + _settingsEsc(s.tax_id_label) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + AppSettings.t('settings.taxRates') + '</b><input id="' + prefix + 'tax-rates" value="' + _settingsEsc(s.tax_rates.join(', ')) + '" style="width:100%;margin-top:6px;"></label>' +
      '</div>' +
      '<div class="sec" style="margin-top:24px;">' + AppSettings.t('settings.company') + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;max-width:860px;">' +
        '<label><b>' + AppSettings.t('settings.companyName') + '</b><input id="' + prefix + 'company-name" value="' + _settingsEsc(company.name) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + AppSettings.t('settings.address') + '</b><input id="' + prefix + 'company-address" value="' + _settingsEsc(company.address) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + AppSettings.t('settings.postalCode') + '</b><input id="' + prefix + 'company-postal" value="' + _settingsEsc(company.postal_code) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + AppSettings.t('settings.phone') + '</b><input id="' + prefix + 'company-phone" value="' + _settingsEsc(company.phone) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + AppSettings.t('settings.email') + '</b><input id="' + prefix + 'company-email" value="' + _settingsEsc(company.email) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + AppSettings.t('settings.taxId') + '</b><input id="' + prefix + 'company-tax-id" value="' + _settingsEsc(company.tax_id) + '" style="width:100%;margin-top:6px;"></label>' +
      '</div>'
    );
  },

  async loadDemoData() {
    if (!confirm('Replace current app data with demo data?')) return;
    const tax = AppSettings.taxRates().includes(22)
      ? 22
      : (AppSettings.taxRates()[AppSettings.taxRates().length - 1] || 0);
    for (const table of Object.keys(TABLE_KEYS)) await DB.clear(table);
    await DB.insertBatch('anagrafica', [
      { codice: 'PRJ-001', nome: 'Website redesign', cliente: 'Acme Studio', data_inizio: '01/05/2026', data_fine_prev: '30/06/2026', stato: 'In corso', responsabile: 'Alex', tipologia: 'Progettazione', note: 'Demo project' },
      { codice: 'PRJ-002', nome: 'Retail fit-out', cliente: 'North Retail', data_inizio: '15/05/2026', data_fine_prev: '20/07/2026', stato: 'Pianificato', responsabile: 'Jamie', tipologia: 'Allestimento', note: 'Demo project' },
    ]);
    await DB.insertBatch('budget_costi', [
      { codice: 'PRJ-001', categoria: 'Manodopera', descrizione: 'Project work', qta: 80, um: 'h', costo_unitario: 45, importo: 3600, aliq_iva: tax, note: '' },
      { codice: 'PRJ-001', categoria: 'Materiali', descrizione: 'Software and assets', qta: 1, um: 'lot', costo_unitario: 650, importo: 650, aliq_iva: tax, note: '' },
      { codice: 'PRJ-002', categoria: 'Subappalti', descrizione: 'External contractor', qta: 1, um: 'lot', costo_unitario: 4200, importo: 4200, aliq_iva: tax, note: '' },
    ]);
    await DB.insertBatch('budget_ricavi', [
      { codice: 'PRJ-001', tipo_ricavo: 'Fixed fee', descrizione: 'Project fee', importo: 8200, aliq_iva: tax, note: '' },
      { codice: 'PRJ-002', tipo_ricavo: 'Quote', descrizione: 'Project fee', importo: 9800, aliq_iva: tax, note: '' },
    ]);
    await DB.insertBatch('consuntivo_costi', [
      { codice: 'PRJ-001', categoria: 'Manodopera', descrizione: 'Actual work', qta: 42, um: 'h', costo_unitario: 45, importo: 1890, aliq_iva: tax, note: '' },
    ]);
    await DB.insertBatch('consuntivo_ricavi', [
      { codice: 'PRJ-001', tipo_ricavo: 'Deposit', descrizione: 'First invoice', importo: 4100, aliq_iva: tax, note: '' },
    ]);
    await DB.insertBatch('cg_budget', [
      { voce: 'Software subscriptions', aliq_iva: tax, gen: 120, feb: 120, mar: 120, apr: 120, mag: 120, giu: 120, lug: 120, ago: 120, set: 120, ott: 120, nov: 120, dic: 120 },
      { voce: 'Accounting', aliq_iva: tax, gen: 180, feb: 180, mar: 180, apr: 180, mag: 180, giu: 180, lug: 180, ago: 180, set: 180, ott: 180, nov: 180, dic: 180 },
    ]);
    DB.invalidateCache();
    App.go('dashboard');
  },

  showOnboardingIfNeeded() {
    const settings = AppSettings.get();
    if (settings.first_run_done || document.getElementById('onboarding-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:linear-gradient(135deg,#1B4332,#2D6A4F);display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:14px;box-shadow:0 24px 64px rgba(0,0,0,.30);padding:30px;max-width:920px;width:100%;max-height:92vh;overflow:auto;">' +
        '<h1 style="margin-top:0;color:#1B4332;">' + AppSettings.t('onboarding.title') + '</h1>' +
        '<p style="color:#64748B;margin-bottom:24px;">' + AppSettings.t('onboarding.subtitle') + '</p>' +
        AppSettings.formHtml(settings, 'ob-') +
        '<label style="display:flex;align-items:center;gap:8px;margin-top:20px;color:#334155;">' +
          '<input type="checkbox" id="ob-demo" checked> ' + AppSettings.t('onboarding.demo') +
        '</label>' +
        '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:26px;">' +
          '<button class="btn" onclick="AppSettings.finishOnboarding()">' + AppSettings.t('onboarding.start') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
  },

  async finishOnboarding() {
    const settings = AppSettings.collectForm('ob-');
    settings.first_run_done = true;
    AppSettings.save(settings);
    const loadDemo = document.getElementById('ob-demo')?.checked;
    document.getElementById('onboarding-overlay')?.remove();
    if (loadDemo) {
      for (const table of Object.keys(TABLE_KEYS)) await DB.clear(table);
      await DB.insertBatch('anagrafica', [
        { codice: 'PRJ-001', nome: 'Website redesign', cliente: 'Acme Studio', data_inizio: '01/05/2026', data_fine_prev: '30/06/2026', stato: 'In corso', responsabile: 'Alex', tipologia: 'Progettazione', note: 'Demo' },
      ]);
      await DB.insertBatch('budget_costi', [
        { codice: 'PRJ-001', categoria: 'Manodopera', descrizione: 'Project work', qta: 80, um: 'h', costo_unitario: 45, importo: 3600, aliq_iva: settings.tax_rates[settings.tax_rates.length - 1] || 22, note: '' },
      ]);
      await DB.insertBatch('budget_ricavi', [
        { codice: 'PRJ-001', tipo_ricavo: 'Fixed fee', descrizione: 'Project fee', importo: 8200, aliq_iva: settings.tax_rates[settings.tax_rates.length - 1] || 22, note: '' },
      ]);
    }
    DB.invalidateCache();
    App.go('dashboard');
  },
};

function t(key) {
  return AppSettings.t(key);
}

window.AppSettings = AppSettings;
window.I18N = I18N;
window.t = t;
var Pages = window.Pages || {};
window.Pages = Pages;

Pages.settings = function () {
  const el = document.getElementById('page-settings');
  const settings = AppSettings.get();
  el.innerHTML =
    '<h1>' + AppSettings.t('settings.title') + '</h1>' +
    '<p class="subtitle">' + AppSettings.t('settings.subtitle') + '</p>' +
    AppSettings.formHtml(settings, 'set-') +
    '<div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap;">' +
      '<button class="btn" onclick="Pages.saveSettings()">' + AppSettings.t('settings.save') + '</button>' +
      '<button class="btn btn-grey" onclick="AppSettings.loadDemoData()">' + AppSettings.t('settings.demo') + '</button>' +
    '</div>' +
    '<p style="color:#64748B;font-size:12px;margin-top:8px;">' + AppSettings.t('settings.demoHint') + '</p>' +
    '<div id="settings-save-msg" style="display:none;color:#2E7D32;font-weight:700;margin-top:12px;"></div>';
};

Pages.saveSettings = function () {
  const settings = AppSettings.collectForm('set-');
  settings.first_run_done = true;
  AppSettings.save(settings);
  const msg = document.getElementById('settings-save-msg');
  if (msg) {
    msg.textContent = AppSettings.t('settings.saved');
    msg.style.display = 'block';
  }
  App.go('settings');
};

Pages.backup = function () {
  const settings = AppSettings.get();
  const last = settings.last_backup_at
    ? new Date(settings.last_backup_at).toLocaleString(settings.locale || 'en-US')
    : AppSettings.t('backup.never');
  const el = document.getElementById('page-backup');
  el.innerHTML =
    '<h1>' + AppSettings.t('backup.title') + '</h1>' +
    '<p class="subtitle">' + AppSettings.t('backup.subtitle') + '</p>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;max-width:920px;">' +
      '<div class="card"><div class="label">' + AppSettings.t('backup.excelTitle') + '</div>' +
        '<p style="color:#64748B;font-size:13px;">' + AppSettings.t('backup.excelText') + '</p>' +
        '<button class="btn" onclick="exportExcel()">' + AppSettings.t('backup.exportExcel') + '</button> ' +
        '<button class="btn btn-grey" onclick="importExcelTrigger()">' + AppSettings.t('backup.importExcel') + '</button>' +
      '</div>' +
      '<div class="card"><div class="label">' + AppSettings.t('backup.jsonTitle') + '</div>' +
        '<p style="color:#64748B;font-size:13px;">' + AppSettings.t('backup.jsonText') + '</p>' +
        '<p style="font-size:12px;color:#64748B;"><b>' + AppSettings.t('backup.last') + ':</b> ' + _settingsEsc(last) + '</p>' +
        '<button class="btn" onclick="exportBackupJson()">' + AppSettings.t('backup.exportJson') + '</button> ' +
        '<button class="btn btn-grey" onclick="restoreBackupTrigger()">' + AppSettings.t('backup.restoreJson') + '</button>' +
      '</div>' +
    '</div>';
};

document.addEventListener('DOMContentLoaded', AppSettings.apply);
