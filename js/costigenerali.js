'use strict';

/* ============================================================
 * COSTIGENERALI.JS — Renderer e logica della pagina
 * Company overheads. Three tabs: Budget, Actuals,
 * Varianza. Autosave su ogni modifica.
 * NOTA: nomi tabella con underscore — cg_budget, cg_consuntivo
 * ============================================================ */

Pages.costigenerali = async function() {
  const el = document.getElementById('page-costigenerali');

  el.innerHTML =
    '<h1>Company Overheads</h1>' +
    '<p class="subtitle">Fixed costs outside individual projects: structure, staff, and utilities.</p>' +
    '<div class="tabs">' +
      '<div class="tab' + (App.cgTab === 'budget'     ? ' active' : '') + '" onclick="Pages.cgTab(this, \'budget\')">Budget</div>' +
      '<div class="tab' + (App.cgTab === 'consuntivo' ? ' active' : '') + '" onclick="Pages.cgTab(this, \'consuntivo\')">Actuals</div>' +
      '<div class="tab' + (App.cgTab === 'varianza'   ? ' active' : '') + '" onclick="Pages.cgTab(this, \'varianza\')">Variance</div>' +
    '</div>' +
    '<div id="cg-content"></div>';

  await Pages.cgRender(App.cgTab);
};

const CG_ITEM_TRANSLATIONS_EN = {
  'Stipendi fissi': 'Fixed salaries',
  'Contributi previdenziali': 'Payroll taxes and benefits',
  'Affitto sede / magazzino': 'Office / warehouse rent',
  'Utenze': 'Utilities',
  'Carburante mezzi aziendali': 'Company vehicle fuel',
  'Manutenzione attrezzature': 'Equipment maintenance',
  'Assicurazioni': 'Insurance',
  'Software e abbonamenti': 'Software and subscriptions',
  'Consulenze amministrative / legali': 'Administrative / legal consulting',
  'Materiale consumabile generico': 'General consumables',
  'Spese di rappresentanza': 'Representation expenses',
  'Formazione e aggiornamento': 'Training and development',
  'Altre spese generali': 'Other overhead expenses',
};

function cgDisplayItemName(value) {
  return CG_ITEM_TRANSLATIONS_EN[value] || value || '';
}

/* Cambia tab attivo */
Pages.cgTab = async function(tabEl, tab) {
  document.querySelectorAll('#page-costigenerali .tab').forEach(function(el) {
    el.classList.remove('active');
  });
  tabEl.classList.add('active');
  App.cgTab = tab;
  await Pages.cgRender(tab);
};

/* Renderer del contenuto in base al tab selezionato */
Pages.cgRender = async function(tab) {
  const el = document.getElementById('cg-content');
  if (!el) return;

  if (tab === 'varianza') {
    await Pages.cgVarianza();
    return;
  }

  /* Carica dati dal DB — usa underscore: cg_budget o cg_consuntivo */
  let data = await DB.all('cg_' + tab);
  if (!data.length) {
    data = C.VOCICG.map(function(v) {
      const obj = { voce: v, tax_rate: F.defaultTaxRate() };
      C.MESIK.forEach(function(m) { obj[m] = 0; });
      return obj;
    });
  }

  /* Garantisce almeno tante righe quante le voci predefinite */
  while (data.length < C.VOCICG.length) {
    const obj = { voce: '', tax_rate: F.defaultTaxRate() };
    C.MESIK.forEach(function(m) { obj[m] = 0; });
    data.push(obj);
  }

  /* Genera una riga della tabella */
  function row(r) {
    const tot = C.MESIK.reduce(function(a, m) { return a + (+r[m] || 0); }, 0);
    return '<tr>' +
      '<td><input data-role="voce" value="' + F.esc(cgDisplayItemName(r.voce)) + '" class="w-lg"></td>' +
      C.MESIK.map(function(m) {
        return '<td><input data-role="' + m + '" type="number" value="' + (r[m] || '') + '" step="0.01" min="0" class="w-mes"></td>';
      }).join('') +
      '<td><select data-role="tax">' + F.sel(C.SALES_TAX_RATES, r.tax_rate ?? F.defaultTaxRate()) + '</select></td>' +
      '<td data-role="tot-row" class="r" style="font-weight:600;">' + F.money(tot) + '</td>' +
      '<td data-role="tax-row" class="r tax">' + F.money(tot * F.taxMultiplier(r.tax_rate ?? F.defaultTaxRate())) + '</td>' +
    '</tr>';
  }

  el.innerHTML =
    '<div class="tbl-wrap" style="overflow-x:auto;"><table>' +
      '<thead><tr>' +
        '<th>Cost Item</th>' +
        C.MESIL.map(function(m) { return '<th>' + m + '</th>'; }).join('') +
        '<th class="tax">' + F.esc(F.taxLabel()) + ' %</th><th>Year Total</th><th class="tax">Annual ' + F.esc(F.taxLabel()) + '</th>' +
      '</tr></thead>' +
      '<tbody id="cg-body">' + data.map(row).join('') + '</tbody>' +
      '<tfoot><tr>' +
        '<td><b>TOTALS</b></td>' +
        C.MESIK.map(function(m) { return '<td id="cg-col-' + m + '" class="r"></td>'; }).join('') +
        '<td></td>' +
        '<td id="cg-grand-tot" class="r" style="font-weight:600;"></td>' +
        '<td id="cg-grand-tax" class="r tax" style="font-weight:600;"></td>' +
      '</tr></tfoot>' +
    '</table></div>' +
    '<button class="btn-add" onclick="Pages.cgAddRow(\'' + tab + '\')">New item</button>';

  Pages.cgRecalc();

  /* Listener autosave */
  const tbody = document.getElementById('cg-body');
  tbody.addEventListener('input',  function() {
    Pages.cgRecalc();
    AutoSave.schedule('cg_' + tab, function() { return Pages.cgSave(tab); });
  });
  tbody.addEventListener('change', function() {
    Pages.cgRecalc();
    AutoSave.schedule('cg_' + tab, function() { return Pages.cgSave(tab); });
  });
};

/* Recalculates column totals, grand total, and sales tax. */
Pages.cgRecalc = function() {
  const colTots = {};
  C.MESIK.forEach(function(m) { colTots[m] = 0; });
  let gt = 0, gi = 0;

  document.querySelectorAll('#cg-body tr').forEach(function(row) {
    const taxMultiplier = F.taxMultiplier(row.querySelector('[data-role="tax"]')?.value ?? F.defaultTaxRate());
    const tot = C.MESIK.reduce(function(a, m) {
      const v = +(row.querySelector('[data-role="' + m + '"]')?.value) || 0;
      colTots[m] += v;
      return a + v;
    }, 0);

    const totEl = row.querySelector('[data-role="tot-row"]');
    if (totEl) totEl.textContent = F.money(tot);
    const taxEl = row.querySelector('[data-role="tax-row"]');
    if (taxEl) taxEl.textContent = F.money(tot * taxMultiplier);

    gt += tot;
    gi += tot * taxMultiplier;
  });

  /* Aggiorna celle tfoot */
  C.MESIK.forEach(function(m) {
    const el = document.getElementById('cg-col-' + m);
    if (el) el.textContent = F.money(colTots[m]);
  });
  const gtEl = document.getElementById('cg-grand-tot');
  if (gtEl) gtEl.textContent = F.money(gt);
  const giEl = document.getElementById('cg-grand-tax');
  if (giEl) giEl.textContent = F.money(gi);
};

/* Aggiunge una riga vuota */
Pages.cgAddRow = function(tab) {
  const obj = { voce: '', tax_rate: F.defaultTaxRate() };
  C.MESIK.forEach(function(m) { obj[m] = 0; });

  document.getElementById('cg-body').insertAdjacentHTML('beforeend',
    '<tr>' +
      '<td><input data-role="voce" class="w-lg"></td>' +
      C.MESIK.map(function(m) {
        return '<td><input data-role="' + m + '" type="number" step="0.01" min="0" class="w-mes"></td>';
      }).join('') +
      '<td><select data-role="tax">' + F.sel(C.SALES_TAX_RATES, F.defaultTaxRate()) + '</select></td>' +
      '<td data-role="tot-row" class="r" style="font-weight:600;">' + F.money(0) + '</td>' +
      '<td data-role="tax-row" class="r tax">' + F.money(0) + '</td>' +
    '</tr>'
  );
};

/* Salva tutte le righe del tab corrente — usa underscore: cg_budget / cg_consuntivo */
Pages.cgSave = async function(tab) {
  const batch = [];
  for (const row of document.querySelectorAll('#cg-body tr')) {
    const voce = row.querySelector('[data-role="voce"]')?.value?.trim() ?? '';
    const taxRate = row.querySelector('[data-role="tax"]')?.value ?? String(F.defaultTaxRate());
    const obj  = { voce, tax_rate: taxRate };
    C.MESIK.forEach(function(m) {
      obj[m] = +(row.querySelector('[data-role="' + m + '"]')?.value) || 0;
    });
    /* Salta righe completamente vuote */
    if (!voce && C.MESIK.every(function(m) { return !obj[m]; })) continue;
    batch.push(obj);
  }
  await DB.clear('cg_' + tab);
  await DB.insertBatch('cg_' + tab, batch);
};

/* Tab varianza — confronto Budget vs Consuntivo */
Pages.cgVarianza = async function() {
  const [db, dc] = await Promise.all([DB.all('cg_budget'), DB.all('cg_consuntivo')]);
  const n = Math.max(db.length, dc.length, C.VOCICG.length);
  let totB = 0, totC = 0;

  const rows = Array.from({ length: n }, function(_, i) {
    const b = db[i] ?? { voce: C.VOCICG[i] ?? '', ...Object.fromEntries(C.MESIK.map(m => [m, 0])) };
    const c = dc[i] ?? { ...Object.fromEntries(C.MESIK.map(m => [m, 0])) };
    const tb = C.MESIK.reduce(function(a, m) { return a + (+b[m] || 0); }, 0);
    const tc = C.MESIK.reduce(function(a, m) { return a + (+c[m] || 0); }, 0);
    totB += tb; totC += tc;

    return '<tr>' +
      '<td>' + F.esc(cgDisplayItemName(b.voce || c.voce || '')) + '</td>' +
      C.MESIK.map(function(m) {
        const v = (+c[m] || 0) - (+b[m] || 0);
        return '<td class="r ' + F.cls(v, true) + '">' + (v ? F.money(v) : '\u2014') + '</td>';
      }).join('') +
      '<td class="r ' + F.cls(tc - tb, true) + '" style="font-weight:600;">' + F.money(tc - tb) + '</td>' +
    '</tr>';
  });

  const colDelta = C.MESIK.map(function(m) {
    const v = (dc.reduce(function(a, r) { return a + (+r[m] || 0); }, 0)) -
              (db.reduce(function(a, r) { return a + (+r[m] || 0); }, 0));
    return '<td class="r ' + F.cls(v, true) + '">' + F.money(v) + '</td>';
  }).join('');

  document.getElementById('cg-content').innerHTML =
    '<div class="tbl-wrap" style="overflow-x:auto;"><table>' +
      '<thead><tr>' +
        '<th>Cost Item</th>' +
        C.MESIL.map(function(m) { return '<th>' + m + '</th>'; }).join('') +
        '<th>Year Total</th>' +
      '</tr></thead>' +
      '<tbody>' + rows.join('') + '</tbody>' +
      '<tfoot><tr>' +
        '<td><b>TOTAL</b></td>' +
        colDelta +
        '<td class="r ' + F.cls(totC - totB, true) + '" style="font-weight:600;">' + F.money(totC - totB) + '</td>' +
      '</tr></tfoot>' +
    '</table></div>';
};
