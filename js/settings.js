'use strict';

/* ============================================================
 * SETTINGS.JS - Commercial settings, i18n, onboarding and backup UI.
 * ============================================================ */

const SETTINGS_STORAGE_KEY = 'project_cost_manager_settings_v1';
const SETTINGS_ALLOWED_LANGUAGES = ['en', 'it'];
const SETTINGS_ALLOWED_CURRENCIES = ['EUR', 'USD', 'GBP'];
const SETTINGS_ALLOWED_LOCALES = ['en-US', 'en-GB', 'it-IT'];
const SETTINGS_ALLOWED_THEMES = ['light', 'dark'];
const SETTINGS_TEXT_MAX = 500;
const SETTINGS_TAX_RATE_PRESETS = {
  en: {
    locale: 'en-US',
    tax_label: 'Sales tax',
    tax_id_label: 'EIN / Tax ID',
    rates: [0, 4, 5, 6, 7, 8.25, 10],
  },
  it: {
    locale: 'it-IT',
    tax_label: 'IVA',
    tax_id_label: 'P.IVA',
    rates: [0, 4, 10, 22],
  },
};

const DEFAULT_SETTINGS = {
  language: 'en',
  currency: 'USD',
  locale: SETTINGS_TAX_RATE_PRESETS.en.locale,
  tax_label: SETTINGS_TAX_RATE_PRESETS.en.tax_label,
  tax_id_label: SETTINGS_TAX_RATE_PRESETS.en.tax_id_label,
  tax_rates: SETTINGS_TAX_RATE_PRESETS.en.rates.slice(),
  theme: 'light',
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
    'settings.taxRates': 'Sales tax rates (%)',
    'settings.company': 'Company details',
    'settings.companyName': 'Company name',
    'settings.address': 'Address',
    'settings.postalCode': 'Postal / ZIP code',
    'settings.phone': 'Phone',
    'settings.email': 'Email',
    'settings.taxId': 'EIN / Tax ID',
    'settings.save': 'Save settings',
    'settings.saved': 'Settings saved',
    'settings.demo': 'Load demo data',
    'settings.demoHint': 'Replace current data with a small project-based business sample.',
    'theme.label': 'Dark mode',
    'theme.light': 'Light mode',
    'theme.dark': 'Dark mode',
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
    'settings.taxRates': 'Aliquote IVA (%)',
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
    'theme.label': 'Modalita scura',
    'theme.light': 'Modalita chiara',
    'theme.dark': 'Modalita scura',
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
  'Codice Progetto': 'Project Code',
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
  'Aggiornamento in tempo reale': 'Live update',
  'KPI Economici': 'Financial KPIs',
  'Sales tax — Company Summary': 'Sales tax - Company Summary',
  'Stato Avanzamento Progetti': 'Project Progress Status',
  'Codice': 'Code',
  'MARGINE EFF.': 'ACTUAL MARGIN',
  'MARGINE EFF. %': 'ACTUAL MARGIN %',
  'Margine Eff.': 'Actual Margin',
  'Margine Eff. %': 'Actual Margin %',
  'Margine %': 'Margin %',
  'CG PREV. / EFF.': 'OVERHEADS PLAN / ACTUAL',
  'CG Prev. / Eff.': 'Overheads Plan / Actual',
  'Il': 'The',
  '(es. PRJ-001) è la chiave univoca di tutto il sistema.': '(for example PRJ-001) is the unique key across the app.',
  'Il Codice Progetto (es. PRJ-001) è la chiave univoca di tutto il sistema.': 'The Project Code (for example PRJ-001) is the unique key across the app.',
  '+ Nuovo Progetto': 'New Project',
  '+ Aggiungi riga costo': 'Add cost row',
  '+ Aggiungi riga ricavo': 'Add revenue row',
  '+ Nuova voce': 'New item',
  'Q.TÀ': 'QTY',
  'Q.tà': 'Qty',
  'U.M.': 'Unit',
  'COSTO UNIT. PREV.': 'PLANNED UNIT COST',
  'COSTO UNIT. EFF.': 'ACTUAL UNIT COST',
  'IMPORTO PREV.': 'PLANNED AMOUNT',
  'IMPORTO EFF.': 'ACTUAL AMOUNT',
  'Costo Unit. Prev.': 'Planned Unit Cost',
  'Costo Unit. Eff.': 'Actual Unit Cost',
  'Importo Prev.': 'Planned Amount',
  'Importo Eff.': 'Actual Amount',
  'TOTALE COSTI': 'TOTAL COSTS',
  'TOTALE RICAVI': 'TOTAL REVENUE',
  'TOT IVA': 'TOTAL VAT',
  'Margine Eff.': 'Actual Margin',
  'Costi fissi indipendenti dai progetti: struttura, personale, utenze.': 'Fixed overhead costs independent from projects: structure, staff, utilities.',
  'Budget Preventivo': 'Budget',
  'Gen': 'Jan',
  'Mag': 'May',
  'Giu': 'Jun',
  'Lug': 'Jul',
  'Ago': 'Aug',
  'Set': 'Sep',
  'Ott': 'Oct',
  'Dic': 'Dec',
  'GEN': 'JAN',
  'MAG': 'MAY',
  'GIU': 'JUN',
  'LUG': 'JUL',
  'AGO': 'AUG',
  'SET': 'SEP',
  'OTT': 'OCT',
  'DIC': 'DEC',
  'Manodopera': 'Labor',
  'Materiali': 'Materials',
  'Mezzi': 'Equipment',
  'Subappalti': 'Subcontracts',
  'Trasporti': 'Transport',
  'Altro': 'Other',
  'Progettazione': 'Design',
  'Manutenzione ordinaria': 'Routine maintenance',
  'Manutenzione straordinaria': 'Extraordinary maintenance',
  'Ristrutturazione area': 'Area renovation',
  'Intervento tecnico': 'Technical work',
  'Impianto': 'System',
  'Allestimento': 'Fit-out',
  'Pulizia area': 'Area cleaning',
  'Analisi avanzata: incidenza dei costi generali sui progetti.': 'Advanced analysis: overhead impact on projects.',
  '🥧 Incidenza Costi Generali': 'Overhead Impact',
  'Voce di costo generale:': 'Overhead cost item:',
  'TOTALE VOCE/ANNO': 'TOTAL ITEM/YEAR',
  '% SU CG AZIENDALI': '% OF COMPANY OVERHEADS',
  '% SU TUTTI I COSTI': '% OF ALL COSTS',
  'MEDIA MENSILE': 'MONTHLY AVERAGE',
  'Totale voce/anno': 'Total item/year',
  '% su CG aziendali': '% of company overheads',
  '% su tutti i costi': '% of all costs',
  'Media mensile': 'Monthly average',
  'Progetto per nuovo preventivo': 'Project for new quote',
  'Nessun preventivo ancora generato.': 'No quotes generated yet.',
  'Questi dati compaiono nell’intestazione di ogni preventivo stampato / PDF.': 'These details appear in the header of each printed quote / PDF.',
  'Indirizzo (via, città)': 'Address (street, city)',
  'CAP': 'Postal code',
  'Telefono': 'Phone',
  'Imposta la tua stima dei costi generali e del profitto desiderato. L’app calcola automaticamente il markup minimo consigliato che ogni preventivo dovrebbe rispettare per coprire le spese e guadagnare.': 'Set your estimated overheads and target profit. The app automatically calculates the recommended minimum markup each quote should meet to cover expenses and profit.',
  'Imposta la tua stima dei costi generali e del profitto desiderato. L’app calcola automaticamente il': 'Set your estimated overheads and target profit. The app automatically calculates the',
  'markup minimo consigliato': 'recommended minimum markup',
  'che ogni preventivo dovrebbe rispettare per coprire le spese e guadagnare.': 'that each quote should meet to cover expenses and profit.',
  'Costi generali stimati': 'Estimated overheads',
  '(% del fatturato annuo)': '(% of annual revenue)',
  'Profitto desiderato': 'Target profit',
  '(% sul fatturato)': '(% of revenue)',
  '⚠️ Markup minimo consigliato (copre costi generali + profitto):': 'Recommended minimum markup (covers overheads + profit):',
  'Markup per Categoria di Costo': 'Markup by Cost Category',
  'Imposta la percentuale da aggiungere ai costi diretti per ogni categoria. Puoi sempre modificarla riga per riga al momento di generare il preventivo.': 'Set the percentage to add to direct costs for each category. You can still adjust it line by line when generating a quote.',
  'MARGINE EQUIV.': 'EQUIV. MARGIN',
  'Margine equiv.': 'Equiv. margin',
  '✖ Sotto obiettivo': 'Below target',
  '↺ Applica markup consigliato a tutte le categorie': 'Apply recommended markup to all categories',
  '💾 Salva Impostazioni Preventivi': 'Save Pricing Settings',
};

const DOM_REPLACEMENTS_EN = [
  [/Aggiornamento in tempo reale/g, 'Live update'],
  [/(\d+)\s+progetto totali/g, '$1 total project'],
  [/(\d+)\s+progetti totali/g, '$1 total projects'],
  [/In corso/g, 'In progress'],
  [/Pianificato/g, 'Planned'],
  [/Completato/g, 'Completed'],
  [/Sospeso/g, 'Paused'],
  [/Bozza/g, 'Draft'],
  [/Inviato/g, 'Sent'],
  [/Accettato/g, 'Accepted'],
  [/Rifiutato/g, 'Rejected'],
  [/Distribuzione mensile/g, 'Monthly distribution'],
  [/\+ Genera Nuovo Preventivo per/g, 'Create New Quote for'],
  [/Imposta la tua stima dei costi generali e del profitto desiderato\. L.app calcola automaticamente il markup minimo consigliato che ogni preventivo dovrebbe rispettare per coprire le spese e guadagnare\./g, 'Set your estimated overheads and target profit. The app automatically calculates the recommended minimum markup each quote should meet to cover expenses and profit.'],
];

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

function _settingsT(key, language) {
  const lang = SETTINGS_ALLOWED_LANGUAGES.includes(language) ? language : DEFAULT_SETTINGS.language;
  return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
}

function _settingsTaxPreset(language) {
  return SETTINGS_TAX_RATE_PRESETS[language] || SETTINGS_TAX_RATE_PRESETS.en;
}

function _settingsRateId(prefix, rate) {
  return prefix + 'tax-rate-' + String(rate).replace(/[^0-9]/g, '-');
}

function _settingsFormatRate(rate, language) {
  const text = Number.isInteger(rate) ? String(rate) : String(rate);
  return language === 'it' ? text.replace('.', ',') : text;
}

function _settingsTranslateEnglish(value) {
  let translated = DOM_TRANSLATIONS_EN[value] || value;
  DOM_REPLACEMENTS_EN.forEach(function (entry) {
    translated = translated.replace(entry[0], entry[1]);
  });
  return translated;
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
  const taxPreset = _settingsTaxPreset(language);
  const currency = SETTINGS_ALLOWED_CURRENCIES.includes(merged.currency) ? merged.currency : DEFAULT_SETTINGS.currency;
  const locale = SETTINGS_ALLOWED_LOCALES.includes(merged.locale)
    ? merged.locale
    : taxPreset.locale;
  const taxRates = _settingsCleanRates(merged.tax_rates);

  merged.language = language;
  merged.currency = currency;
  merged.locale = locale;
  merged.tax_label = _settingsCleanLabel(merged.tax_label, taxPreset.tax_label);
  merged.tax_id_label = _settingsCleanLabel(merged.tax_id_label, taxPreset.tax_id_label);
  merged.tax_rates = taxRates.length ? taxRates : taxPreset.rates.slice();
  merged.theme = SETTINGS_ALLOWED_THEMES.includes(merged.theme) ? merged.theme : DEFAULT_SETTINGS.theme;
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
    return _settingsT(key, language);
  },

  money(value) {
    if (isNaN(value)) return '\u2014';
    const settings = AppSettings.get();
    try {
      return new Intl.NumberFormat(settings.locale || 'en-US', {
        style: 'currency',
        currency: settings.currency || DEFAULT_SETTINGS.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value));
    } catch (err) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: DEFAULT_SETTINGS.currency,
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
    if (typeof C !== 'undefined') C.IVA = AppSettings.taxRates();
    document.documentElement.lang = settings.language === 'it' ? 'it' : 'en';
    if (document.documentElement.dataset) {
      document.documentElement.dataset.theme = settings.theme;
    } else if (document.documentElement.setAttribute) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
    document.title = 'Project Cost Manager';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = AppSettings.t(el.dataset.i18n);
    });
    const user = document.getElementById('user-email-lbl');
    if (user) user.textContent = AppSettings.t('offline.user');
    AppSettings.syncThemeToggle();
    AppSettings.translateDom(document.body);
  },

  syncThemeToggle() {
    const settings = AppSettings.get();
    const toggle = document.getElementById('theme-toggle');
    const label = document.getElementById('theme-toggle-label');
    if (!toggle) return;
    const isDark = settings.theme === 'dark';
    if (toggle.setAttribute) {
      toggle.setAttribute('aria-checked', String(isDark));
      toggle.setAttribute('aria-label', AppSettings.t(isDark ? 'theme.dark' : 'theme.light'));
    }
    if (label) label.textContent = AppSettings.t('theme.label');
  },

  toggleTheme() {
    const current = AppSettings.get();
    AppSettings.save({
      ...current,
      theme: current.theme === 'dark' ? 'light' : 'dark',
    });
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
      const translated = _settingsTranslateEnglish(trimmed);
      if (translated !== trimmed) node.nodeValue = original.replace(trimmed, translated);
    });

    root.querySelectorAll?.('input[placeholder], textarea[placeholder]').forEach(function (el) {
      const original = el.getAttribute('placeholder');
      if (original === null) return;
      const translated = _settingsTranslateEnglish(original);
      if (translated !== original) el.setAttribute('placeholder', translated);
    });
  },

  collectForm(prefix) {
    const value = id => document.getElementById(prefix + id)?.value?.trim?.() || '';
    const language = value('language') || 'en';
    const preset = _settingsTaxPreset(language);
    const checkedRates = Array.from(document.querySelectorAll('input[name="' + prefix + 'tax-rates"]:checked'))
      .map(input => Number(String(input.value).trim().replace(',', '.')))
      .filter(v => Number.isFinite(v));
    const legacyRates = value('tax-rates')
      .split(',')
      .map(v => Number(String(v).trim().replace(',', '.')))
      .filter(v => Number.isFinite(v));
    const rates = checkedRates.length ? checkedRates : legacyRates;
    const currency = value('currency') || DEFAULT_SETTINGS.currency;
    return {
      ...AppSettings.get(),
      language,
      currency,
      locale: value('locale') || preset.locale,
      tax_label: value('tax-label') || preset.tax_label,
      tax_id_label: value('tax-id-label') || preset.tax_id_label,
      tax_rates: rates.length ? rates : preset.rates,
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
    const taxPreset = _settingsTaxPreset(s.language);
    const selectedRates = s.tax_rates.map(rate => Number(rate));
    const rateOptions = taxPreset.rates.map(function (rate) {
      const checked = selectedRates.some(selected => Math.abs(selected - rate) < 0.001);
      const id = _settingsRateId(prefix, rate);
      return '<label class="tax-rate-option" for="' + id + '">' +
        '<input id="' + id + '" type="checkbox" name="' + prefix + 'tax-rates" value="' + rate + '"' + (checked ? ' checked' : '') + '> ' +
        '<span>' + _settingsEsc(_settingsFormatRate(rate, s.language)) + '%</span>' +
      '</label>';
    }).join('');
    return (
      '<div id="' + prefix + 'settings-form">' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;max-width:860px;">' +
        '<label><b>' + _settingsT('settings.language', s.language) + '</b><select id="' + prefix + 'language" onchange="AppSettings.changeFormLanguage(\'' + prefix + '\')" style="width:100%;margin-top:6px;">' +
          '<option value="en"' + (s.language === 'en' ? ' selected' : '') + '>English</option>' +
          '<option value="it"' + (s.language === 'it' ? ' selected' : '') + '>Italiano</option>' +
        '</select></label>' +
        '<label><b>' + _settingsT('settings.currency', s.language) + '</b><select id="' + prefix + 'currency" style="width:100%;margin-top:6px;">' +
          ['EUR', 'USD', 'GBP'].map(c => '<option value="' + c + '"' + (s.currency === c ? ' selected' : '') + '>' + c + '</option>').join('') +
        '</select></label>' +
        '<label><b>' + _settingsT('settings.locale', s.language) + '</b><select id="' + prefix + 'locale" style="width:100%;margin-top:6px;">' +
          ['en-US', 'en-GB', 'it-IT'].map(l => '<option value="' + l + '"' + (s.locale === l ? ' selected' : '') + '>' + l + '</option>').join('') +
        '</select></label>' +
        '<label><b>' + _settingsT('settings.taxLabel', s.language) + '</b><input id="' + prefix + 'tax-label" value="' + _settingsEsc(s.tax_label) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + _settingsT('settings.taxIdLabel', s.language) + '</b><input id="' + prefix + 'tax-id-label" value="' + _settingsEsc(s.tax_id_label) + '" style="width:100%;margin-top:6px;"></label>' +
        '<fieldset class="tax-rate-field">' +
          '<legend>' + _settingsT('settings.taxRates', s.language) + '</legend>' +
          '<div class="tax-rate-checklist">' + rateOptions + '</div>' +
        '</fieldset>' +
      '</div>' +
      '<div class="sec" style="margin-top:24px;">' + _settingsT('settings.company', s.language) + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;max-width:860px;">' +
        '<label><b>' + _settingsT('settings.companyName', s.language) + '</b><input id="' + prefix + 'company-name" value="' + _settingsEsc(company.name) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + _settingsT('settings.address', s.language) + '</b><input id="' + prefix + 'company-address" value="' + _settingsEsc(company.address) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + _settingsT('settings.postalCode', s.language) + '</b><input id="' + prefix + 'company-postal" value="' + _settingsEsc(company.postal_code) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + _settingsT('settings.phone', s.language) + '</b><input id="' + prefix + 'company-phone" value="' + _settingsEsc(company.phone) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + _settingsT('settings.email', s.language) + '</b><input id="' + prefix + 'company-email" value="' + _settingsEsc(company.email) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + _settingsT('settings.taxId', s.language) + '</b><input id="' + prefix + 'company-tax-id" value="' + _settingsEsc(company.tax_id) + '" style="width:100%;margin-top:6px;"></label>' +
      '</div>' +
      '</div>'
    );
  },

  changeFormLanguage(prefix) {
    const language = document.getElementById(prefix + 'language')?.value || DEFAULT_SETTINGS.language;
    const preset = _settingsTaxPreset(language);
    const current = AppSettings.collectForm(prefix);
    const updated = _settingsMerge({
      ...current,
      language,
      locale: preset.locale,
      tax_label: preset.tax_label,
      tax_id_label: preset.tax_id_label,
      tax_rates: preset.rates,
    });
    const wrapper = document.getElementById(prefix + 'settings-form');
    if (wrapper) wrapper.outerHTML = AppSettings.formHtml(updated, prefix);
    AppSettings.refreshFormLanguage(prefix, language);
  },

  refreshFormLanguage(prefix, language) {
    const setText = function (id, key) {
      const el = document.getElementById(id);
      if (el) el.textContent = _settingsT(key, language);
    };

    if (prefix === 'set-') {
      setText('settings-title', 'settings.title');
      setText('settings-subtitle', 'settings.subtitle');
      setText('settings-save-btn', 'settings.save');
      setText('settings-demo-btn', 'settings.demo');
      setText('settings-demo-hint', 'settings.demoHint');
    }
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
    '<h1 id="settings-title">' + AppSettings.t('settings.title') + '</h1>' +
    '<p id="settings-subtitle" class="subtitle">' + AppSettings.t('settings.subtitle') + '</p>' +
    AppSettings.formHtml(settings, 'set-') +
    '<div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap;">' +
      '<button id="settings-save-btn" class="btn" onclick="Pages.saveSettings()">' + AppSettings.t('settings.save') + '</button>' +
      '<button id="settings-demo-btn" class="btn btn-grey" onclick="AppSettings.loadDemoData()">' + AppSettings.t('settings.demo') + '</button>' +
    '</div>' +
    '<p id="settings-demo-hint" style="color:#64748B;font-size:12px;margin-top:8px;">' + AppSettings.t('settings.demoHint') + '</p>' +
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
    '<div class="backup-grid">' +
      '<div class="card backup-card"><div class="label">' + AppSettings.t('backup.excelTitle') + '</div>' +
        '<p class="backup-text">' + AppSettings.t('backup.excelText') + '</p>' +
        '<div class="backup-actions">' +
          '<button class="btn" onclick="exportExcel()">' + AppSettings.t('backup.exportExcel') + '</button>' +
          '<button class="btn btn-grey" onclick="importExcelTrigger()">' + AppSettings.t('backup.importExcel') + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="card backup-card"><div class="label">' + AppSettings.t('backup.jsonTitle') + '</div>' +
        '<p class="backup-text">' + AppSettings.t('backup.jsonText') + '</p>' +
        '<p class="backup-last"><b>' + AppSettings.t('backup.last') + ':</b> ' + _settingsEsc(last) + '</p>' +
        '<div class="backup-actions">' +
          '<button class="btn" onclick="exportBackupJson()">' + AppSettings.t('backup.exportJson') + '</button>' +
          '<button class="btn btn-grey" onclick="restoreBackupTrigger()">' + AppSettings.t('backup.restoreJson') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
};

document.addEventListener('DOMContentLoaded', AppSettings.apply);
