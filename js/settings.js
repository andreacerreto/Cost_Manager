'use strict';

/* ============================================================
 * SETTINGS.JS - Commercial settings, i18n, onboarding and backup UI.
 * ============================================================ */

const SETTINGS_STORAGE_KEY = 'project_cost_manager_settings_v1';
const SETTINGS_ALLOWED_LANGUAGES = ['en'];
const SETTINGS_ALLOWED_CURRENCIES = ['USD'];
const SETTINGS_ALLOWED_LOCALES = ['en-US'];
const SETTINGS_ALLOWED_COUNTRY_PROFILES = ['US'];
const SETTINGS_ALLOWED_THEMES = ['light', 'dark'];
const SETTINGS_TEXT_MAX = 500;
const SETTINGS_TAX_RATE_PRESETS = {
  en: {
    locale: 'en-US',
    tax_label: 'Sales Tax',
    tax_id_label: 'EIN / Tax ID',
    rates: [0, 4, 5, 6, 7, 8.25, 10],
  },
};
const SETTINGS_COUNTRY_PROFILE_PRESETS = {
  US: {
    language: 'en',
    currency: 'USD',
    locale: 'en-US',
    tax_label: 'Sales Tax',
    tax_id_label: 'EIN / Tax ID',
    rates: SETTINGS_TAX_RATE_PRESETS.en.rates,
  },
};
const SETTINGS_US_TAX_DISCLAIMER = 'Project Cost Manager helps estimate and document Sales Tax using rates you enter manually. It is not legal, tax, or accounting advice; verify rates, taxability, exemptions, and nexus obligations with your accountant or tax advisor.';

const DEFAULT_SETTINGS = {
  country_profile: 'US',
  language: 'en',
  currency: 'USD',
  locale: SETTINGS_TAX_RATE_PRESETS.en.locale,
  tax_label: SETTINGS_TAX_RATE_PRESETS.en.tax_label,
  tax_id_label: SETTINGS_TAX_RATE_PRESETS.en.tax_id_label,
  tax_rates: SETTINGS_TAX_RATE_PRESETS.en.rates.slice(),
  tax_disclaimer: SETTINGS_US_TAX_DISCLAIMER,
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
    'settings.subtitle': 'Configure US currency, Sales Tax labels, rates, and company details used in quotes and exports.',
    'settings.countryProfile': 'Country / tax profile',
    'settings.language': 'Language',
    'settings.currency': 'Currency',
    'settings.locale': 'Number format',
    'settings.taxLabel': 'Tax label',
    'settings.taxIdLabel': 'Company tax ID label',
    'settings.taxRates': 'Sales Tax rates (%)',
    'settings.company': 'Company details',
    'settings.companyName': 'Company name',
    'settings.address': 'Address',
    'settings.postalCode': 'Postal / ZIP code',
    'settings.phone': 'Phone',
    'settings.email': 'Email',
    'settings.taxId': 'EIN / Tax ID',
    'settings.taxDisclaimer': 'Sales Tax is manual. Set your applicable rate and verify taxability, exemptions and nexus obligations with your accountant.',
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
};

const DOM_TRANSLATIONS_EN = {};
const DOM_REPLACEMENTS_EN = [];

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
    .filter(v => Number.isFinite(v) && v >= 0 && v <= 15);
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

function _settingsProfilePreset(countryProfile) {
  return SETTINGS_COUNTRY_PROFILE_PRESETS[countryProfile] || null;
}

function _settingsInferCountryProfile(input, language) {
  if (SETTINGS_ALLOWED_COUNTRY_PROFILES.includes(input.country_profile)) return input.country_profile;
  return 'US';
}

function _settingsRateId(prefix, rate) {
  return prefix + 'tax-rate-' + String(rate).replace(/[^0-9]/g, '-');
}

function _settingsFormatRate(rate, language) {
  return Number.isInteger(rate) ? String(rate) : String(rate);
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
  const countryProfile = _settingsInferCountryProfile(input, language);
  const profilePreset = _settingsProfilePreset(countryProfile);
  const taxPreset = profilePreset || _settingsTaxPreset(language);
  const currency = profilePreset
    ? profilePreset.currency
    : (SETTINGS_ALLOWED_CURRENCIES.includes(merged.currency) ? merged.currency : DEFAULT_SETTINGS.currency);
  const locale = profilePreset
    ? profilePreset.locale
    : (SETTINGS_ALLOWED_LOCALES.includes(merged.locale) ? merged.locale : taxPreset.locale);
  const taxRates = _settingsCleanRates(merged.tax_rates);

  merged.country_profile = countryProfile;
  merged.language = language;
  merged.currency = currency;
  merged.locale = locale;
  merged.tax_label = profilePreset ? profilePreset.tax_label : _settingsCleanLabel(merged.tax_label, taxPreset.tax_label);
  merged.tax_id_label = profilePreset ? profilePreset.tax_id_label : _settingsCleanLabel(merged.tax_id_label, taxPreset.tax_id_label);
  merged.tax_rates = taxRates.length ? taxRates : taxPreset.rates.slice();
  merged.tax_disclaimer = countryProfile === 'US'
    ? SETTINGS_US_TAX_DISCLAIMER
    : _settingsCleanText(merged.tax_disclaimer, '', SETTINGS_TEXT_MAX);
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

  countryProfile() {
    return AppSettings.get().country_profile || DEFAULT_SETTINGS.country_profile;
  },

  isUsProfile() {
    return AppSettings.countryProfile() === 'US';
  },

  taxDisclaimer() {
    return AppSettings.get().tax_disclaimer || '';
  },

  apply() {
    const settings = AppSettings.get();
    if (typeof C !== 'undefined') C.SALES_TAX_RATES = AppSettings.taxRates();
    document.documentElement.lang = 'en';
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
    const countryProfile = value('country-profile') || _settingsInferCountryProfile({}, language);
    const profilePreset = _settingsProfilePreset(countryProfile);
    const preset = profilePreset || _settingsTaxPreset(language);
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
      country_profile: countryProfile,
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
        '<label><b>' + _settingsT('settings.countryProfile', s.language) + '</b><select id="' + prefix + 'country-profile" onchange="AppSettings.changeFormCountryProfile(\'' + prefix + '\')" style="width:100%;margin-top:6px;">' +
          '<option value="US"' + (s.country_profile === 'US' ? ' selected' : '') + '>United States</option>' +
        '</select></label>' +
        '<label><b>' + _settingsT('settings.currency', s.language) + '</b><select id="' + prefix + 'currency" style="width:100%;margin-top:6px;">' +
          ['USD'].map(c => '<option value="' + c + '"' + (s.currency === c ? ' selected' : '') + '>' + c + '</option>').join('') +
        '</select></label>' +
        '<label><b>' + _settingsT('settings.locale', s.language) + '</b><select id="' + prefix + 'locale" style="width:100%;margin-top:6px;">' +
          ['en-US'].map(l => '<option value="' + l + '"' + (s.locale === l ? ' selected' : '') + '>' + l + '</option>').join('') +
        '</select></label>' +
        '<label><b>' + _settingsT('settings.taxLabel', s.language) + '</b><input id="' + prefix + 'tax-label" value="' + _settingsEsc(s.tax_label) + '" style="width:100%;margin-top:6px;"></label>' +
        '<label><b>' + _settingsT('settings.taxIdLabel', s.language) + '</b><input id="' + prefix + 'tax-id-label" value="' + _settingsEsc(s.tax_id_label) + '" style="width:100%;margin-top:6px;"></label>' +
        '<fieldset class="tax-rate-field">' +
          '<legend>' + _settingsT('settings.taxRates', s.language) + '</legend>' +
          '<div class="tax-rate-checklist">' + rateOptions + '</div>' +
        '</fieldset>' +
      '</div>' +
      (s.country_profile === 'US'
        ? '<p class="tax-guidance" style="max-width:860px;margin:12px 0 0;color:#64748B;font-size:12px;">' + _settingsEsc(_settingsT('settings.taxDisclaimer', s.language)) + '</p>'
        : '') +
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
    const language = DEFAULT_SETTINGS.language;
    const countryProfile = 'US';
    const preset = _settingsProfilePreset(countryProfile) || _settingsTaxPreset(language);
    const current = AppSettings.collectForm(prefix);
    const updated = _settingsMerge({
      ...current,
      country_profile: countryProfile,
      language,
      currency: preset.currency || current.currency,
      locale: preset.locale,
      tax_label: preset.tax_label,
      tax_id_label: preset.tax_id_label,
      tax_rates: preset.rates,
    });
    const wrapper = document.getElementById(prefix + 'settings-form');
    if (wrapper) wrapper.outerHTML = AppSettings.formHtml(updated, prefix);
    AppSettings.refreshFormLanguage(prefix, language);
  },

  changeFormCountryProfile(prefix) {
    const countryProfile = document.getElementById(prefix + 'country-profile')?.value || DEFAULT_SETTINGS.country_profile;
    const preset = _settingsProfilePreset(countryProfile);
    const current = AppSettings.collectForm(prefix);
    const updated = _settingsMerge({
      ...current,
      country_profile: countryProfile,
      ...(preset ? {
        language: preset.language,
        currency: preset.currency,
        locale: preset.locale,
        tax_label: preset.tax_label,
        tax_id_label: preset.tax_id_label,
        tax_rates: preset.rates,
      } : {}),
    });
    const wrapper = document.getElementById(prefix + 'settings-form');
    if (wrapper) wrapper.outerHTML = AppSettings.formHtml(updated, prefix);
    AppSettings.refreshFormLanguage(prefix, updated.language);
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
    const rates = AppSettings.taxRates();
    const tax = rates.includes(8.25) ? 8.25 : (rates[rates.length - 1] || 0);
    for (const table of Object.keys(TABLE_KEYS)) await DB.clear(table);
    await DB.insertBatch('anagrafica', [
      { codice: 'PRJ-001', nome: 'Website redesign', cliente: 'Acme Studio', data_inizio: '2026-05-01', data_fine_prev: '2026-06-30', stato: 'In progress', responsabile: 'Alex', tipologia: 'Design', note: 'Demo project' },
      { codice: 'PRJ-002', nome: 'Retail fit-out', cliente: 'North Retail', data_inizio: '2026-05-15', data_fine_prev: '2026-07-20', stato: 'Planned', responsabile: 'Jamie', tipologia: 'Setup', note: 'Demo project' },
    ]);
    await DB.insertBatch('budget_costi', [
      { codice: 'PRJ-001', categoria: 'Labor', descrizione: 'Project work', qta: 80, um: 'h', costo_unitario: 45, importo: 3600, tax_rate: tax, note: '' },
      { codice: 'PRJ-001', categoria: 'Materials', descrizione: 'Software and assets', qta: 1, um: 'lot', costo_unitario: 650, importo: 650, tax_rate: tax, note: '' },
      { codice: 'PRJ-002', categoria: 'Subcontractors', descrizione: 'External contractor', qta: 1, um: 'lot', costo_unitario: 4200, importo: 4200, tax_rate: tax, note: '' },
    ]);
    await DB.insertBatch('budget_ricavi', [
      { codice: 'PRJ-001', tipo_ricavo: 'Fixed fee', descrizione: 'Project fee', importo: 8200, tax_rate: tax, note: '' },
      { codice: 'PRJ-002', tipo_ricavo: 'Quote', descrizione: 'Project fee', importo: 9800, tax_rate: tax, note: '' },
    ]);
    await DB.insertBatch('consuntivo_costi', [
      { codice: 'PRJ-001', categoria: 'Labor', descrizione: 'Actual work', qta: 42, um: 'h', costo_unitario: 45, importo: 1890, tax_rate: tax, note: '' },
    ]);
    await DB.insertBatch('consuntivo_ricavi', [
      { codice: 'PRJ-001', tipo_ricavo: 'Deposit', descrizione: 'First invoice', importo: 4100, tax_rate: tax, note: '' },
    ]);
    await DB.insertBatch('cg_budget', [
      { voce: 'Software subscriptions', tax_rate: tax, gen: 120, feb: 120, mar: 120, apr: 120, mag: 120, giu: 120, lug: 120, ago: 120, set: 120, ott: 120, nov: 120, dic: 120 },
      { voce: 'Accounting', tax_rate: tax, gen: 180, feb: 180, mar: 180, apr: 180, mag: 180, giu: 180, lug: 180, ago: 180, set: 180, ott: 180, nov: 180, dic: 180 },
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
