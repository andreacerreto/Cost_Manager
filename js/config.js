'use strict';

/* ============================================================
 * CONFIG.JS - Costanti globali, chiavi tabelle e liste dati.
 * ============================================================ */

/* Chiave primaria per ogni tabella (usata da DB.put e DB.del) */
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

/* Costanti applicative */
const C = {
  IVA: [0, 4, 10, 22],

  CATC: ['Manodopera', 'Materiali', 'Mezzi', 'Subappalti', 'Trasporti', 'Altro'],

  STATI: ['Pianificato', 'In corso', 'Completato', 'Sospeso'],

  STATI_PREV: ['Bozza', 'Inviato', 'Accettato', 'Rifiutato'],

  STATO_PREV_COLOR: {
    'Bozza':     '#64748B',
    'Inviato':   '#1565C0',
    'Accettato': '#2E7D32',
    'Rifiutato': '#C62828',
  },

  TIPOLOGIE: [
    'Progettazione',
    'Manutenzione ordinaria',
    'Manutenzione straordinaria',
    'Ristrutturazione area',
    'Intervento tecnico',
    'Impianto',
    'Allestimento',
    'Pulizia area',
    'Altro',
  ],

  MESIK: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],

  MESIL: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],

  VOCICG: [
    'Stipendi fissi',
    'Contributi previdenziali',
    'Affitto sede / magazzino',
    'Utenze',
    'Carburante mezzi aziendali',
    'Manutenzione attrezzature',
    'Assicurazioni',
    'Software e abbonamenti',
    'Consulenze amministrative / legali',
    'Materiale consumabile generico',
    'Spese di rappresentanza',
    'Formazione e aggiornamento',
    'Altre spese generali',
  ],

  STATO_COLOR: {
    'Completato': '#2E7D32',
    'In corso':   '#1565C0',
    'Sospeso':    '#C62828',
  },

  MARKUP_DEFAULT: {
    overhead_pct: 18,
    profit_pct: 12,
    manodopera: 40,
    materiali: 30,
    mezzi: 25,
    subappalti: 15,
    trasporti: 20,
    altro: 25,
  },
};
