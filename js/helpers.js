'use strict';

/* ============================================================
 * HELPERS.JS — Funzioni di utilità pure (nessuna dipendenza
 * da DOM o storage locale). Usate ovunque nell'app.
 * F.money, F.pct, F.esc, F.iva, F.sel, F.kpi, F.cls
 * ============================================================ */

const F = {

  /* Formatta un numero come valuta in base alle impostazioni utente */
  money(v) {
    if (window.AppSettings) return AppSettings.money(v);
    return isNaN(v) ? '\u2014' : Number(v).toFixed(2);
  },

  /* Formatta un numero come percentuale con 1 decimale */
  pct(v) {
    return (isNaN(v) || !isFinite(v)) ? '\u2014' : Number(v).toFixed(1) + '%';
  },

  /* Escape HTML per prevenire XSS nei valori inseriti dall'utente */
  esc(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  /* Converte un valore aliquota IVA in moltiplicatore decimale
     Es: "22" → 0.22 | "10" → 0.10 */
  iva(s) {
    try { return parseFloat(String(s).replace(',', '.')) / 100; }
    catch { return 0; }
  },

  /* Genera le <option> di un <select> con selezione corrente evidenziata */
  sel(opts, cur) {
    return opts.map(o =>
      `<option value="${F.esc(o)}"${o == cur ? ' selected' : ''}>${F.esc(o)}</option>`
    ).join('');
  },

  taxLabel() {
    return window.AppSettings ? AppSettings.taxLabel() : 'Tax';
  },

  taxIdLabel() {
    return window.AppSettings ? AppSettings.taxIdLabel() : 'Tax ID';
  },

  defaultTaxRate() {
    const rates = window.AppSettings ? AppSettings.taxRates() : C.IVA;
    return rates.includes(22) ? 22 : (rates[rates.length - 1] ?? 0);
  },

  /* Genera l'HTML di una KPI card semplice (senza icon-box) */
  kpi(label, value, delta, cls) {
    return '<div class="card ' + (cls || '') + '">' +
      '<div class="label">' + label + '</div>' +
      '<div class="value">' + value + '</div>' +
      (delta ? '<div class="delta">' + delta + '</div>' : '') +
      '</div>';
  },

  /* Restituisce la classe CSS pos/neg in base al segno del valore.
     inv: true inverte la logica (negativo = buono, es. varianza costi) */
  cls(v, inv) {
    const s = inv ? -v : v;
    return s < -0.01 ? 'neg' : s > 0.01 ? 'pos' : '';
  },
};

const ImportSafety = {
  limits: {
    maxFileBytes: 10 * 1024 * 1024,
    maxRowsPerSheet: 5000,
    maxStringLength: 500,
    maxKeyLength: 80,
    maxSheets: 32,
  },

  assertFileSize(file, label) {
    if (file && file.size > ImportSafety.limits.maxFileBytes) {
      throw new Error((label || 'Import file') + ' exceeds the 10 MB offline safety limit.');
    }
  },

  normalizeRows(table, rows) {
    if (!Array.isArray(rows)) {
      throw new Error('Invalid import rows for table: ' + table);
    }
    return rows
      .slice(0, ImportSafety.limits.maxRowsPerSheet)
      .map(row => ImportSafety.normalizeRow(row))
      .filter(row => Object.keys(row).length > 0);
  },

  normalizeRow(row) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return {};
    const out = {};
    Object.entries(row).forEach(function (entry) {
      const key = ImportSafety.cleanKey(entry[0]);
      if (!key) return;
      out[key] = ImportSafety.cleanCell(entry[1]);
    });
    return out;
  },

  cleanKey(key) {
    return String(key ?? '')
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .trim()
      .slice(0, ImportSafety.limits.maxKeyLength);
  },

  cleanCell(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'boolean') return value;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value !== 'string') return '';
    return value
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .slice(0, ImportSafety.limits.maxStringLength);
  },

  safeExcelValue(value) {
    if (typeof value !== 'string') return value;
    return /^[=+\-@]/.test(value.trim()) ? "'" + value : value;
  },

  safeExcelRows(rows) {
    return (rows || []).map(function (row) {
      const out = {};
      Object.entries(row || {}).forEach(function (entry) {
        out[entry[0]] = ImportSafety.safeExcelValue(entry[1]);
      });
      return out;
    });
  },
};

window.ImportSafety = ImportSafety;

/* ============================================================
 * TOTALI — Calcola ricavi, costi, margine e IVA di un progetto.
 *
 * VERSIONE OTTIMIZZATA v2 (dev_ottimizzazione):
 *   Accetta un parametro opzionale `bulk` con i dati già caricati
 *   in memoria (da DB.allBulk). Se presente, filtra in JS senza
 *   alcuna chiamata HTTP — O(n) invece di 4 round-trip storage locale.
 *
 *   Se `bulk` è omesso, cade back al comportamento originale
 *   (DB.byProject per singolo progetto) per compatibilità con
 *   le pagine Budget/Consuntivo che lavorano su un progetto solo.
 *
 * @param {string} prefix   - 'budget' | 'consuntivo'
 * @param {string} codice   - codice progetto
 * @param {object} [bulk]   - oggetto { tabella: [...righe] } pre-caricato
 *                            da DB.allBulk nella pagina chiamante.
 *                            Opzionale — se assente fa query diretta.
 * ============================================================ */
async function totali(prefix, codice, bulk) {
  let costi, ricavi;

  if (bulk) {
    /* --------------------------------------------------------
     * FAST PATH — dati già in memoria, semplice filtro JS.
     * Usato dalla Dashboard che carica tutto in un colpo solo.
     * Nessuna chiamata HTTP aggiuntiva.
     * -------------------------------------------------------- */
    costi  = (bulk[prefix + '_costi']  || []).filter(x => x.codice === codice);
    ricavi = (bulk[prefix + '_ricavi'] || []).filter(x => x.codice === codice);
  } else {
    /* --------------------------------------------------------
     * SLOW PATH (fallback) — query per singolo progetto.
     * Usa DB.byProject() che filtra WHERE codice = X su storage locale,
     * molto più efficiente di DB.all() + filter in JS.
     * Usato da Budget.js, Consuntivo.js, Varianze.js ecc.
     * -------------------------------------------------------- */
    [costi, ricavi] = await Promise.all([
      DB.byProject(prefix + '_costi',  codice),
      DB.byProject(prefix + '_ricavi', codice),
    ]);
  }

  const sum = (arr, key) => arr.reduce((a, r) => a + (+r[key] || 0), 0);

  const tc = sum(costi,  'importo');
  const tr = sum(ricavi, 'importo');
  const ic = costi.reduce( (a, r) => a + (+r.importo || 0) * F.iva(r.aliq_iva ?? F.defaultTaxRate()), 0);
  const ir = ricavi.reduce((a, r) => a + (+r.importo || 0) * F.iva(r.aliq_iva ?? F.defaultTaxRate()), 0);

  return {
    costi:     tc,
    ricavi:    tr,
    margine:   tr - tc,
    ivacosti:  ic,
    ivaricavi: ir,
    ivanetta:  ir - ic,
  };
}
