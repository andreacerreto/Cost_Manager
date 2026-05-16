'use strict';

/* ============================================================
 * ANAGRAFICA.JS — Renderer e logica della pagina
 * Anagrafica Progetti. CRUD completo con autosave.
 *
 * Ottimizzazioni v2 (dev_ottimizzazione):
 *   - anaDelRow: le 4 delete di budget/consuntivo ora girano
 *     in parallelo con Promise.all invece che in serie (await).
 *   - anaSave: dopo aver salvato tutte le righe, chiama
 *     DB.invalidateCache() globale per garantire che la
 *     Dashboard ricarichi sempre dati freschi dal DB,
 *     anche se un codice progetto è stato rinominato.
 * ============================================================ */

Pages.anagrafica = async function () {
  const el   = document.getElementById('page-anagrafica');
  const data = await DB.all('anagrafica');

  /* Genera il markup HTML di una riga della tabella */
  function row(r) {
    return '<tr>' +
      '<td><input data-orig="' + F.esc(r.codice) + '" value="' + F.esc(r.codice) + '" placeholder="PRJ-001"></td>' +
      '<td><input value="' + F.esc(r.nome) + '"></td>' +
      '<td><input value="' + F.esc(r.cliente) + '"></td>' +
      '<td><input value="' + F.esc(r.data_inizio) + '" placeholder="YYYY-MM-DD"></td>' +
      '<td><input value="' + F.esc(r.data_fine_prev) + '" placeholder="YYYY-MM-DD"></td>' +
      '<td><select>' + F.sel(C.STATI, r.stato) + '</select></td>' +
      '<td><input value="' + F.esc(r.responsabile) + '"></td>' +
      '<td><select>' + F.sel(C.TIPOLOGIE, r.tipologia) + '</select></td>' +
      '<td><input value="' + F.esc(r.note) + '"></td>' +
      '<td><button class="btn-red" data-codice="' + F.esc(r.codice) + '" onclick="Pages.anaDelRow(this)">Delete</button></td>' +
    '</tr>';
  }

  el.innerHTML =
    '<h1>Projects</h1>' +
    '<p class="subtitle">The <b>Project Code</b> (for example PRJ-001) is the unique key used across the app.</p>' +
    '<div class="toolbar">' +
      '<button class="btn btn-grey" onclick="Pages.anaAddRow()">+ New Project</button>' +
    '</div>' +
    '<div class="tbl-wrap"><table>' +
      '<thead><tr>' +
        '<th>Project Code</th><th>Project Name</th><th>Customer</th>' +
        '<th>Start Date</th><th>Planned End Date</th><th>Status</th>' +
        '<th>Owner</th><th>Type</th><th>Notes</th><th></th>' +
      '</tr></thead>' +
      '<tbody id="ana-body">' + data.map(row).join('') + '</tbody>' +
    '</table></div>';

  /* Registra autosave su ogni modifica nella tabella */
  const tbody = el.querySelector('#ana-body');
  tbody.addEventListener('input',  function () { AutoSave.schedule('anagrafica', Pages.anaSave); });
  tbody.addEventListener('change', function () { AutoSave.schedule('anagrafica', Pages.anaSave); });
};

/* ------------------------------------------------------------
 * anaSave — salva tutte le righe della tabella.
 * Alla fine invalida l'intera cache così la Dashboard
 * ricaricherà dati freschi al prossimo accesso,
 * anche in caso di rinomina di un codice progetto.
 * ------------------------------------------------------------ */
Pages.anaSave = async function () {
  const seen = new Set();

  for (const tr of document.querySelectorAll('#ana-body tr')) {
    const inputs = [...tr.querySelectorAll('input, select')];
    const [cod, nome, cliente, di, df, stato, resp, tipo, note] =
      inputs.map(el => el.value?.trim?.() ?? el.value);
    const orig = inputs[0].dataset.orig;

    if (!cod || seen.has(cod)) continue;
    seen.add(cod);

    /* Se il codice è stato rinominato, elimina il vecchio record.
       DB.del invalida automaticamente la cache di 'anagrafica'. */
    if (orig && orig !== cod) await DB.del('anagrafica', orig);
    inputs[0].dataset.orig = cod;

    await DB.put('anagrafica', {
      codice: cod, nome, cliente,
      data_inizio: di, data_fine_prev: df,
      stato, responsabile: resp, tipologia: tipo, note,
    });
  }

  /* Invalida tutta la cache dopo il salvataggio.
   * Questo garantisce che la Dashboard (che usa allBulk)
   * ricarichi sempre i dati più aggiornati al prossimo accesso,
   * coprendo anche i casi di rinomina codice o cambio stato. */
  DB.invalidateCache();
};

/* ------------------------------------------------------------
 * anaAddRow — aggiunge una riga vuota e ricarica la pagina.
 * DB.put invalida già la cache di 'anagrafica'.
 * ------------------------------------------------------------ */
Pages.anaAddRow = async function () {
  const codice = 'PRJ-' + Date.now();
  await DB.put('anagrafica', {
    codice, nome: '', cliente: '',
    data_inizio: '', data_fine_prev: '',
    stato: 'Planned', responsabile: '', tipologia: '', note: '',
  });
  Pages.anagrafica();
};

/* ------------------------------------------------------------
 * anaDelRow — elimina un progetto e tutti i suoi dati.
 *
 * Le 4 delete di budget/consuntivo girano in PARALLELO
 * con Promise.all — prima erano 4 await in serie.
 * Risparmio stimato: ~3x sui tempi di eliminazione.
 * DB.delByProject invalida automaticamente la cache per
 * ognuna delle tabelle coinvolte.
 * ------------------------------------------------------------ */
Pages.anaDelRow = async function (btn, codice) {
  codice = codice || btn.dataset.codice || '';
  if (!confirm('Delete project "' + codice + '"?\nAll budget and actuals data will also be deleted.')) return;

  /* Elimina anagrafica e le 4 tabelle dettaglio in parallelo */
  await Promise.all([
    DB.del('anagrafica', codice),
    ...['budget_costi', 'budget_ricavi', 'consuntivo_costi', 'consuntivo_ricavi']
      .map(t => DB.delByProject(t, codice)),
  ]);

  /* Rimuove la riga dal DOM senza ricaricare la pagina */
  btn.closest('tr').remove();
};
