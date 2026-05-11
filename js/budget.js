'use strict';

/* ============================================================
 * BUDGET.JS — Renderer condiviso per Budget Preventivo
 * e Consuntivo. Il parametro 'type' vale 'budget' o
 * 'consuntivo' e determina quale tabella DB leggere/scrivere.
 * NOTA: i nomi tabella usano underscore (budget_costi, non budget-costi)
 * ============================================================ */

/* Entry point per la pagina Budget Preventivo */
Pages.budget = async function() {
  await Pages.budgetCons('budget');
};

/* Entry point per la pagina Consuntivo */
Pages.consuntivo = async function() {
  await Pages.budgetCons('consuntivo');
};

/* Renderer condiviso Budget/Consuntivo */
Pages.budgetCons = async function(type) {
  const el    = document.getElementById('page-' + type);
  const projs = await DB.all('anagrafica');

  /* Nessun progetto disponibile */
  if (!projs.length) {
    el.innerHTML =
      '<h1>' + (type === 'budget' ? 'Budget Preventivo' : 'Consuntivo') + '</h1>' +
      '<div class="alert warn">Nessun progetto. Aggiungine uno in <b>Anagrafica Progetti</b>.</div>';
    return;
  }

  /* Seleziona il progetto corrente (memorizzato in App.proj) */
  if (!App.proj || !projs.find(p => p.codice === App.proj)) {
    App.proj = projs[0].codice;
  }
  const info = projs.find(p => p.codice === App.proj) ?? projs[0];

  /* Etichette colonne in base al tipo */
  const cLabel = type === 'budget' ? 'Costo Unit. Prev.' : 'Costo Unit. Eff.';
  const iLabel = type === 'budget' ? 'Importo Prev.'     : 'Importo Eff.';

  /* Carica righe dal DB filtrate per progetto corrente
     NOTA: underscore — budget_costi, consuntivo_ricavi ecc. */
  let costi  = (await DB.all(type + '_costi')).filter(r => r.codice === App.proj);
  let ricavi = (await DB.all(type + '_ricavi')).filter(r => r.codice === App.proj);

  /* Garantisce almeno 5 righe costo e 3 righe ricavo */
  while (costi.length  < 5) costi.push({});
  while (ricavi.length < 3) ricavi.push({});

  /* Genera una riga costo */
  function costoRow(r) {
    const tot = (+r.qta || 0) * (+r.costo_unitario || 0);
    return '<tr>' +
      '<td><select data-role="cat"><option value=""></option>' + F.sel(C.CATC, r.categoria) + '</select></td>' +
      '<td><input data-role="des" value="' + F.esc(r.descrizione) + '"></td>' +
      '<td><input data-role="qty" type="number" value="' + (r.qta || '') + '" step="0.01" min="0"></td>' +
      '<td><input data-role="um"  value="' + F.esc(r.um) + '" class="w-um"></td>' +
      '<td><input data-role="cu"  type="number" value="' + (r.costo_unitario || '') + '" step="0.01" min="0"></td>' +
      '<td data-role="ct"  class="r"><b>' + F.money(tot) + '</b></td>' +
      '<td><select data-role="iva">' + F.sel(C.IVA, r.aliq_iva ?? F.defaultTaxRate()) + '</select></td>' +
      '<td data-role="ivav" class="r">' + F.money(tot * F.iva(r.aliq_iva ?? F.defaultTaxRate())) + '</td>' +
      '<td><input data-role="note" value="' + F.esc(r.note) + '"></td>' +
    '</tr>';
  }

  /* Genera una riga ricavo */
  function ricavoRow(r) {
    return '<tr>' +
      '<td><input data-role="tipo" value="' + F.esc(r.tipo_ricavo) + '" placeholder="Acconto, SAL, Saldo"></td>' +
      '<td><input data-role="des"  value="' + F.esc(r.descrizione) + '"></td>' +
      '<td><input data-role="imp"  type="number" value="' + (r.importo || '') + '" step="0.01" min="0"></td>' +
      '<td><select data-role="iva">' + F.sel(C.IVA, r.aliq_iva ?? F.defaultTaxRate()) + '</select></td>' +
      '<td data-role="ivav" class="r">' + F.money((+r.importo || 0) * F.iva(r.aliq_iva ?? F.defaultTaxRate())) + '</td>' +
      '<td><input data-role="note" value="' + F.esc(r.note) + '"></td>' +
    '</tr>';
  }

  /* Options select progetto */
  const projOpts = projs.map(p =>
    '<option value="' + F.esc(p.codice) + '"' + (p.codice === App.proj ? ' selected' : '') + '>' +
    F.esc(p.codice) + ' \u2014 ' + F.esc(p.nome || '(senza nome)') + '</option>'
  ).join('');

  /* Costruzione HTML pagina */
  el.innerHTML =
    '<h1>' + (type === 'budget' ? 'Budget Preventivo' : 'Consuntivo') + '</h1>' +

    /* Barra selezione progetto */
    '<div class="proj-bar">' +
      '<label>Progetto</label>' +
      '<select onchange="App.proj=this.value; Pages.' + type + '();">' + projOpts + '</select>' +
      '<span class="proj-tag">' + F.esc(info.cliente) + ' \u2014 ' + F.esc(info.stato) + '</span>' +
    '</div>' +

    /* Tabella COSTI */
    '<div class="sec">COSTI</div>' +
    '<div class="tbl-wrap"><table>' +
      '<thead><tr>' +
        '<th>Categoria</th><th>Descrizione</th><th>Q.t\u00e0</th><th>U.M.</th>' +
        '<th>' + F.esc(cLabel) + '</th><th>Costo Tot.</th>' +
        '<th class="iva">' + F.esc(F.taxLabel()) + ' %</th><th class="iva">' + F.esc(F.taxLabel()) + '</th><th>Note</th>' +
      '</tr></thead>' +
      '<tbody id="' + type + '-costi">' + costi.map(costoRow).join('') + '</tbody>' +
      '<tfoot><tr>' +
        '<td colspan="5" class="r">TOTALE COSTI</td>' +
        '<td id="' + type + '-tc" class="r"></td>' +
        '<td class="iva-tot">TOT ' + F.esc(F.taxLabel()) + '</td>' +
        '<td id="' + type + '-ic" class="r iva-tot"></td>' +
        '<td></td>' +
      '</tr></tfoot>' +
    '</table></div>' +
    '<button class="btn-add" onclick="Pages.addCostoRow(\'' + type + '\')">+ Aggiungi riga costo</button>' +

    /* Tabella RICAVI */
    '<div class="sec blue">RICAVI</div>' +
    '<div class="tbl-wrap"><table>' +
      '<thead><tr>' +
        '<th class="blue">Tipo Ricavo</th><th class="blue">Descrizione</th>' +
        '<th class="blue">' + F.esc(iLabel) + '</th>' +
        '<th class="iva">' + F.esc(F.taxLabel()) + ' %</th><th class="iva">' + F.esc(F.taxLabel()) + '</th><th class="blue">Note</th>' +
      '</tr></thead>' +
      '<tbody id="' + type + '-ricavi">' + ricavi.map(ricavoRow).join('') + '</tbody>' +
      '<tfoot><tr>' +
        '<td colspan="2" class="r">TOTALE RICAVI</td>' +
        '<td id="' + type + '-tr" class="r"></td>' +
        '<td class="iva-tot">TOT ' + F.esc(F.taxLabel()) + '</td>' +
        '<td id="' + type + '-ir" class="r iva-tot"></td>' +
        '<td></td>' +
      '</tr></tfoot>' +
    '</table></div>' +
    '<button class="btn-add" onclick="Pages.addRicavoRow(\'' + type + '\')">+ Aggiungi riga ricavo</button>' +

    /* Riepilogo progetto */
    '<div class="sec grey" style="margin-top:18px;">Riepilogo Progetto</div>' +
    '<div class="recap" id="' + type + '-recap"></div>';

  /* Listener input/change per ricalcolo e autosave */
  el.addEventListener('input',  function() { Pages.bcUpdate(type); });
  el.addEventListener('change', function() { Pages.bcUpdate(type); });

  /* Ricalcolo iniziale */
  Pages.bcUpdate(type);
};

/* Ricalcola totali costi/ricavi e aggiorna il riepilogo */
Pages.bcUpdate = function(type) {
  let tc=0, ic=0, tr=0, ir=0;

  /* Somma righe costi */
  document.querySelectorAll('#' + type + '-costi tr').forEach(function(row) {
    const g = function(role) { return row.querySelector('[data-role="' + role + '"]')?.value ?? ''; };
    const qty = +g('qty') || 0;
    const cu  = +g('cu')  || 0;
    const iva = F.iva(g('iva') || F.defaultTaxRate());
    tc += qty * cu;
    ic += qty * cu * iva;
    const ctEl = row.querySelector('[data-role="ct"]');
    if (ctEl) ctEl.innerHTML = '<b>' + F.money(qty * cu) + '</b>';
    const ivEl = row.querySelector('[data-role="ivav"]');
    if (ivEl) ivEl.textContent = F.money(qty * cu * iva);
  });

  /* Somma righe ricavi */
  document.querySelectorAll('#' + type + '-ricavi tr').forEach(function(row) {
    const imp = +(row.querySelector('[data-role="imp"]')?.value) || 0;
    const iva = F.iva(row.querySelector('[data-role="iva"]')?.value || F.defaultTaxRate());
    tr += imp;
    ir += imp * iva;
    const ivEl = row.querySelector('[data-role="ivav"]');
    if (ivEl) ivEl.textContent = F.money(imp * iva);
  });

  /* Aggiorna celle tfoot */
  const set = function(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  set(type + '-tc', F.money(tc));
  set(type + '-ic', F.money(ic));
  set(type + '-tr', F.money(tr));
  set(type + '-ir', F.money(ir));

  /* Aggiorna riepilogo progetto */
  const recap = document.getElementById(type + '-recap');
  if (recap) {
    recap.innerHTML =
      F.kpi('Totale Costi',   F.money(tc), '', '') +
      F.kpi('Totale Ricavi',  F.money(tr), '', '') +
      F.kpi('Margine Lordo',  F.money(tr - tc), '', tr - tc < 0 ? 'c-red' : 'c-margin') +
      F.kpi(F.taxLabel() + ' Net', F.money(ir - ic), '', 'c-grey') +
      F.kpi('Margine %',      F.pct(tr ? (tr - tc) / tr * 100 : NaN), '', '');
  }

  /* Pianifica autosave */
  AutoSave.schedule(type + '-data', function() { return Pages.bcSave(type); });
};

/* Salva tutte le righe costi e ricavi del progetto corrente */
Pages.bcSave = async function(type) {
  const g = function(row, role) { return row.querySelector('[data-role="' + role + '"]')?.value ?? ''; };

  /* Cancella le righe esistenti per questo progetto — underscore! */
  await DB.delByProject(type + '_costi',  App.proj);
  await DB.delByProject(type + '_ricavi', App.proj);

  const costoRows  = [];
  const ricavoRows = [];

  for (const row of document.querySelectorAll('#' + type + '-costi tr')) {
    const des = g(row, 'des');
    const qty = +g(row, 'qty') || 0;
    const cu  = +g(row, 'cu')  || 0;
    if (!des && !qty && !cu) continue;
    costoRows.push({
      codice: App.proj, categoria: g(row, 'cat'),
      descrizione: des, qta: qty, um: g(row, 'um'),
      costo_unitario: cu, importo: qty * cu,
      aliq_iva: g(row, 'iva') || F.defaultTaxRate(), note: g(row, 'note'),
    });
  }

  for (const row of document.querySelectorAll('#' + type + '-ricavi tr')) {
    const tipo = g(row, 'tipo');
    const imp  = +g(row, 'imp') || 0;
    if (!tipo && !imp) continue;
    ricavoRows.push({
      codice: App.proj, tipo_ricavo: tipo,
      descrizione: g(row, 'des'), importo: imp,
      aliq_iva: g(row, 'iva') || F.defaultTaxRate(), note: g(row, 'note'),
    });
  }

  /* Inserisce i nuovi dati — underscore! */
  await DB.insertBatch(type + '_costi',  costoRows);
  await DB.insertBatch(type + '_ricavi', ricavoRows);
};

/* Aggiunge una riga costo vuota in fondo alla tabella */
Pages.addCostoRow = function(type) {
  document.getElementById(type + '-costi').insertAdjacentHTML('beforeend',
    '<tr>' +
      '<td><select data-role="cat"><option value=""></option>' + F.sel(C.CATC, '') + '</select></td>' +
      '<td><input data-role="des" value=""></td>' +
      '<td><input data-role="qty" type="number" step="0.01" min="0"></td>' +
      '<td><input data-role="um"  class="w-um"></td>' +
      '<td><input data-role="cu"  type="number" step="0.01" min="0"></td>' +
      '<td data-role="ct"  class="r"><b>' + F.money(0) + '</b></td>' +
      '<td><select data-role="iva">' + F.sel(C.IVA, F.defaultTaxRate()) + '</select></td>' +
      '<td data-role="ivav" class="r">' + F.money(0) + '</td>' +
      '<td><input data-role="note" value=""></td>' +
    '</tr>'
  );
};

/* Aggiunge una riga ricavo vuota in fondo alla tabella */
Pages.addRicavoRow = function(type) {
  document.getElementById(type + '-ricavi').insertAdjacentHTML('beforeend',
    '<tr>' +
      '<td><input data-role="tipo" placeholder="Acconto, SAL, Saldo"></td>' +
      '<td><input data-role="des"  value=""></td>' +
      '<td><input data-role="imp"  type="number" step="0.01" min="0"></td>' +
      '<td><select data-role="iva">' + F.sel(C.IVA, F.defaultTaxRate()) + '</select></td>' +
      '<td data-role="ivav" class="r">' + F.money(0) + '</td>' +
      '<td><input data-role="note" value=""></td>' +
    '</tr>'
  );
};
