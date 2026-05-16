'use strict';

/* ============================================================
 * CONFIG.JS - Global constants, table keys, and data lists.
 * ============================================================ */

/* Primary key for each table, used by DB.put and DB.del. */
const TABLE_KEYS = {
  anagrafica:           'codice',
  'budget_costi':       'id',
  'budget_ricavi':      'id',
  'consuntivo_costi':   'id',
  'consuntivo_ricavi':  'id',
  'cg_budget':          'id',
  'cg_consuntivo':      'id',
  'politica_prezzi':    'id',
  'preventivi':         'id',
  'preventivi_righe':   'id',
};

/* Application constants */
const C = {
  SALES_TAX_RATES: [0, 4, 5, 6, 7, 8.25, 10],

  CATC: ['Labor', 'Materials', 'Equipment', 'Subcontractors', 'Transportation', 'Other'],

  STATI: ['Planned', 'In progress', 'Completed', 'On hold'],

  STATI_PREV: ['Draft', 'Sent', 'Accepted', 'Declined'],

  STATO_PREV_COLOR: {
    'Draft':     '#64748B',
    'Sent':      '#1565C0',
    'Accepted':  '#2E7D32',
    'Declined':  '#C62828',
  },

  TIPOLOGIE: [
    'Design',
    'Routine maintenance',
    'Major maintenance',
    'Area renovation',
    'Technical service',
    'Installation',
    'Setup',
    'Site cleanup',
    'Other',
  ],

  MESIK: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],

  MESIL: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

  VOCICG: [
    'Fixed salaries',
    'Payroll taxes and benefits',
    'Office / warehouse rent',
    'Utilities',
    'Company vehicle fuel',
    'Equipment maintenance',
    'Insurance',
    'Software and subscriptions',
    'Administrative / legal consulting',
    'General consumables',
    'Representation expenses',
    'Training and development',
    'Other overhead expenses',
  ],

  STATO_COLOR: {
    'Completed':   '#2E7D32',
    'In progress': '#1565C0',
    'On hold':     '#C62828',
  },

  MARKUP_DEFAULT: {
    overhead_pct: 18,
    profit_pct: 12,
    labor: 40,
    materials: 30,
    equipment: 25,
    subcontractors: 15,
    transportation: 20,
    other: 25,
  },
};
