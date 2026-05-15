'use strict';

/* ============================================================
 * PREVENTIVI.JS — Modulo "Preventivi Cliente"
 *
 * v16 — rimozione bottone Scarica e funzione _prevScaricaPDF:
 *   - Il download del PDF avviene direttamente dal visualizzatore
 *     di stampa del browser (popup), senza necessità di html2pdf.
 *   - Rimosso bottone "⬇ Scarica" dalla lista preventivi.
 *   - Rimossa funzione _prevScaricaPDF (e relativo iframe trick).
 *
 * v15 — fix taglio sinistro nel PDF scaricato.
 * v14 — fix bottone Scarica PDF (pagina bianca).
 * v13 — bottone Scarica PDF (download reale).
 * v12 — bottone Scarica PDF + refactoring DRY _prevBuildHTML.
 * v11 — logo PDF SVG.
 * v10 — PDF raffinato.
 * v9  — template PDF moderno e minimale.
 * v8  — filtro pill per stato.
 * v7  — fix sovrascrittura preventivo.
 * ============================================================ */


/* ------------------------------------------------------------
 * SVG logo neutro — identico a login e sidebar.
 * Usato come costante per evitare duplicazioni.
 * ------------------------------------------------------------ */
const _APP_LOGO_SVG = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 21C7 21 3.5 17 3.5 12.5 3.5 8 6.5 4 12 2c5.5 2 8.5 6 8.5 10.5C20.5 17 17 21 12 21z" fill="#52B788"/>
  <path d="M12 20V7" stroke="#F9A825" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M12 10 C10 9.5 8 10 7 11.5" stroke="#F9A825" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>
  <path d="M12 13.5 C10 13 8 13.5 7 15" stroke="#F9A825" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>
  <path d="M12 10 C14 9.5 16 10 17 11.5" stroke="#F9A825" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>
  <path d="M12 13.5 C14 13 16 13.5 17 15" stroke="#F9A825" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>
</svg>`;


/* ------------------------------------------------------------
 * Stato interno del filtro pill attivo sulla lista preventivi.
 * '' = tutti i preventivi (nessun filtro)
 * ------------------------------------------------------------ */
Pages._prevFiltroStato = '';


/* ------------------------------------------------------------
 * Entry point — chiamato da App.go('preventivi')
 * ------------------------------------------------------------ */
Pages.preventivi = async function () {
  const el    = document.getElementById('page-preventivi');
  const projs = await DB.all('anagrafica');

  if (!projs.length) {
    el.innerHTML =
      '<h1>Preventivi Cliente</h1>' +
      '<div class="alert warn">No projects yet. Add one in <b>Projects</b>.</div>';
    return;
  }

  if (!App.proj || !projs.find(p => p.codice === App.proj)) {
    App.proj = projs[0].codice;
  }
  const info = projs.find(p => p.codice === App.proj) ?? projs[0];

  /* Carica politica prezzi (forza dati freschi) e mette in cache locale */
  DB.invalidateCache('politica_prezzi');
  const polRows = await DB.all('politica_prezzi');
  Pages._polCache = polRows;
  const pol = polRows[0] ?? {};
  const getMarkup = (cat) => {
    const key = 'markup_' + cat.toLowerCase();
    return pol[key] ?? C.MARKUP_DEFAULT[cat.toLowerCase()] ?? 25;
  };

  /* Carica TUTTI i preventivi (storico globale, forza dati freschi) */
  DB.invalidateCache('preventivi');
  const tuttiPrev = await DB.all('preventivi');

  /* Calcola il prossimo numero preventivo (es. PREV-2026-003) */
  const nextNum = Pages._prevCalcolaNumero(tuttiPrev);

  /* Mappa codice → nome progetto per la colonna "Progetto" della lista */
  const projMap = {};
  projs.forEach(function (p) { projMap[p.codice] = p.nome || p.codice; });

  /* Options select progetto per il selettore in cima */
  const projOpts = projs.map(p =>
    '<option value="' + F.esc(p.codice) + '"' + (p.codice === App.proj ? ' selected' : '') + '>' +
    F.esc(p.codice) + ' \u2014 ' + F.esc(p.nome || '(senza nome)') + '</option>'
  ).join('');

  /* ---- Render HTML principale ---- */
  el.innerHTML =
    '<h1>Preventivi Cliente</h1>' +

    /* Selettore progetto */
    '<div class="proj-bar">' +
      '<label>Progetto per nuovo preventivo</label>' +
      '<select onchange="App.proj=this.value; Pages.preventivi();">' + projOpts + '</select>' +
      '<span class="proj-tag">' + F.esc(info.cliente || '') + ' \u2014 ' + F.esc(info.stato || '') + '</span>' +
    '</div>' +

    /* Storico globale con pill filtro per stato */
    '<div class="sec">Preventivi Esistenti</div>' +
    Pages._prevListHTML(tuttiPrev, projMap) +

    '<div style="margin:18px 0 4px;">' +
      '<button onclick="Pages._prevNuovo()" style="' +
        'padding:11px 28px;background:#1B4332;color:#fff;border:none;' +
        'border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;' +
        'font-family:var(--font);transition:background .2s;"' +
        'onmouseover="this.style.background=\'#2D6A4F\'"' +
        'onmouseout="this.style.background=\'#1B4332\'">' +
        '+ Genera Nuovo Preventivo per ' + F.esc(info.codice) +
      '</button>' +
    '</div>' +

    /* Editor preventivo (nascosto, si mostra al click) */
    '<div id="prev-editor" style="display:none;margin-top:24px;">' +
      Pages._prevEditorHTML(info, getMarkup, nextNum) +
    '</div>';

  /* Ripristina il filtro attivo dopo il render */
  prevFiltroApplica(Pages._prevFiltroStato);
};


/* ------------------------------------------------------------
 * HTML: lista storico preventivi con pill filtro per stato.
 * ------------------------------------------------------------ */
Pages._prevListHTML = function (prevs, projMap) {
  const sorted = prevs.slice().sort((a, b) => b.id - a.id);

  if (!sorted.length) {
    return '<p style="color:#64748B;font-size:13px;padding:10px 0;">' +
           'Nessun preventivo ancora generato.</p>';
  }

  const contatori = { '': sorted.length };
  sorted.forEach(function (p) {
    const s = p.stato || '(nessuno)';
    contatori[s] = (contatori[s] || 0) + 1;
  });

  const STATI_NOTI = ['Bozza', 'Inviato', 'Accettato', 'Rifiutato', 'Scaduto'];
  const statiPresenti = Object.keys(contatori).filter(s => s !== '');
  const statiOrdinati = [
    ...STATI_NOTI.filter(s => statiPresenti.includes(s)),
    ...statiPresenti.filter(s => !STATI_NOTI.includes(s)),
  ];

  let filtriHTML = '';
  if (statiOrdinati.length > 1) {
    filtriHTML += '<div class="dash-filtri" id="prev-filtri-bar">';
    filtriHTML += _prevPill('', 'Tutti', contatori[''], Pages._prevFiltroStato);
    statiOrdinati.forEach(function (s) {
      filtriHTML += _prevPill(s, s, contatori[s], Pages._prevFiltroStato);
    });
    filtriHTML += '</div>';
  }

  const righe = sorted.map(function (p) {
    const col   = C.STATO_PREV_COLOR[p.stato] || '#64748B';
    const prevId = Number(p.id) || 0;
    const badge =
      '<span style="display:inline-block;padding:2px 10px;border-radius:20px;' +
      'background:' + col + '20;color:' + col + ';font-size:11px;font-weight:700;">' +
      F.esc(p.stato) + '</span>';

    const nomeProj = projMap ? (projMap[p.codice] || p.codice) : p.codice;

    return '<tr data-stato="' + F.esc(p.stato || '') + '">' +
      '<td style="font-size:12px;color:#475569;">' +
        '<span style="font-weight:700;color:#1B4332;">' + F.esc(p.codice) + '</span>' +
        '<br><span style="font-size:11px;">' + F.esc(nomeProj) + '</span>' +
      '</td>' +
      '<td style="font-weight:600;">' + F.esc(p.numero) + '</td>' +
      '<td>' + F.esc(p.data) + '</td>' +
      '<td>' + badge + '</td>' +
      '<td>' + F.esc(p.note_cliente || '\u2014') + '</td>' +
      '<td style="white-space:nowrap;">' +

        /* Apri: apre l'editor precompilato */
        '<button class="btn-add" style="padding:4px 12px;font-size:12px;margin-right:4px;"' +
        '  onclick="Pages._prevApri(' + prevId + ')">Apri</button>' +

        /* PDF: apre popup con anteprima e bottone Stampa */
        '<button class="btn-add" style="padding:4px 12px;font-size:12px;margin-right:8px;"' +
        '  onclick="Pages._prevGeneraPDF(' + prevId + ')">&#128438; PDF</button>' +

        /* Elimina */
        '<button data-id="' + F.esc(prevId) + '" data-numero="' + F.esc(p.numero) + '" onclick="Pages._prevEliminaBtn(this)"' +
          ' style="background:none;border:none;color:#C62828;cursor:pointer;' +
          'font-size:18px;font-weight:700;padding:2px 6px;line-height:1;' +
          'border-radius:4px;transition:background .15s;"' +
          ' onmouseover="this.style.background=\'#FFEBEE\'"' +
          ' onmouseout="this.style.background=\'none\'"' +
          ' title="Elimina preventivo">' +
          '\u00d7' +
        '</button>' +
      '</td>' +
    '</tr>';
  }).join('');

  return (
    filtriHTML +
    '<div class="tbl-wrap"><table id="prev-tabella-lista">' +
      '<thead><tr>' +
        '<th>Progetto</th><th>N. Preventivo</th><th>Data</th>' +
        '<th>Stato</th><th>Note</th><th>Azioni</th>' +
      '</tr></thead>' +
      '<tbody>' + righe + '</tbody>' +
    '</table></div>' +
    '<div id="prev-count-label" class="dash-count-lbl"></div>'
  );
};


/* ------------------------------------------------------------
 * _prevPill — pill filtro preventivi.
 * ------------------------------------------------------------ */
function _prevPill(stato, etichetta, contatore, attivo) {
  const isAttivo = stato === attivo;
  return '<button ' +
    'class="dash-fil-pill' + (isAttivo ? ' dash-fil-active' : '') + '" ' +
    'onclick="prevFiltroApplica(\'' + stato.replace(/'/g, "\\'") + '\')">' +
    F.esc(etichetta) +
    '<span class="dash-fil-count">' + contatore + '</span>' +
    '</button>';
}


/* ------------------------------------------------------------
 * prevFiltroApplica — filtra le righe per stato.
 * ------------------------------------------------------------ */
function prevFiltroApplica(stato) {
  Pages._prevFiltroStato = stato;

  const tabella = document.getElementById('prev-tabella-lista');
  if (!tabella) return;

  const righe = tabella.querySelectorAll('tbody tr');
  let visibili = 0;

  righe.forEach(function (riga) {
    const statoRiga = riga.getAttribute('data-stato') || '';
    const mostra    = stato === '' || statoRiga === stato;
    riga.style.display = mostra ? '' : 'none';
    if (mostra) visibili++;
  });

  const barFiltri = document.getElementById('prev-filtri-bar');
  if (barFiltri) {
    barFiltri.querySelectorAll('.dash-fil-pill').forEach(function (pill) {
      pill.classList.remove('dash-fil-active');
      const onc   = pill.getAttribute('onclick') || '';
      const match = onc.match(/prevFiltroApplica\('(.*)'\)/);
      if (match && match[1] === stato) pill.classList.add('dash-fil-active');
    });
  }

  const lbl = document.getElementById('prev-count-label');
  if (lbl) {
    lbl.textContent = stato === ''
      ? visibili + ' preventiv' + (visibili === 1 ? 'o' : 'i') + ' totali'
      : visibili + ' preventiv' + (visibili === 1 ? 'o' : 'i') + ' con stato "' + stato + '"';
  }
}


/* ------------------------------------------------------------
 * Elimina un preventivo con cancellazione a cascata delle righe.
 * ------------------------------------------------------------ */
Pages._prevElimina = async function (prevId, numero) {
  const confermato = confirm(
    'Vuoi eliminare definitivamente il preventivo ' + numero + '?\n\n' +
    'L\'operazione non pu\u00f2 essere annullata.'
  );
  if (!confermato) return;

  DB.invalidateCache('preventivi_righe');
  const tutteRighe = await DB.all('preventivi_righe');
  const daCanc     = tutteRighe
    .filter(r => r.preventivo_id === prevId)
    .map(r => r.id);

  for (const rid of daCanc) {
    await DB.del('preventivi_righe', rid);
  }

  await DB.del('preventivi', prevId);
  DB.invalidateCache('preventivi');
  DB.invalidateCache('preventivi_righe');

  await Pages.preventivi();
};

Pages._prevEliminaBtn = function (btn) {
  const prevId = Number(btn.dataset.id);
  if (!Number.isFinite(prevId)) return;
  Pages._prevElimina(prevId, btn.dataset.numero || '');
};


/* ------------------------------------------------------------
 * HTML: editor preventivo
 * ------------------------------------------------------------ */
Pages._prevEditorHTML = function (info, getMarkup, nextNum) {
  return (
    '<div class="sec">Nuovo Preventivo \u2014 ' + F.esc(info.codice) + ' ' + F.esc(info.nome || '') + '</div>' +

    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;' +
         'background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;' +
         'padding:18px 22px;max-width:780px;margin-bottom:20px;">' +

      '<div>' +
        '<label style="font-size:12px;font-weight:700;color:#374151;display:block;margin-bottom:5px;">N. Preventivo</label>' +
        '<input id="prev-numero" style="width:100%;" value="' + F.esc(nextNum) + '" placeholder="PREV-2026-001">' +
      '</div>' +

      '<div>' +
        '<label style="font-size:12px;font-weight:700;color:#374151;display:block;margin-bottom:5px;">Data emissione</label>' +
        '<input id="prev-data" type="date" style="width:100%;" value="' + new Date().toISOString().slice(0, 10) + '">' +
      '</div>' +

      '<div>' +
        '<label style="font-size:12px;font-weight:700;color:#374151;display:block;margin-bottom:5px;">Stato</label>' +
        '<select id="prev-stato" style="width:100%;">' +
          C.STATI_PREV.map(s => '<option>' + s + '</option>').join('') +
        '</select>' +
      '</div>' +

      '<div style="grid-column:1/-1;">' +
        '<label style="font-size:12px;font-weight:700;color:#374151;display:block;margin-bottom:5px;">Note per il cliente</label>' +
        '<input id="prev-note" style="width:100%;" placeholder="Eventuali condizioni, validit\u00e0 offerta\u2026">' +
      '</div>' +

    '</div>' +

    '<div style="background:#FFF8E1;border:1px solid #F9A825;border-radius:8px;' +
         'padding:10px 16px;font-size:12px;color:#7B5200;margin-bottom:14px;max-width:780px;">' +
      '\uD83D\uDD12 La colonna <b>Costo Interno</b> \u00e8 visibile solo a te e non appare nella stampa per il cliente.' +
    '</div>' +

    '<div class="tbl-wrap"><table id="prev-table">' +
      '<thead><tr>' +
        '<th>Categoria</th><th>Descrizione</th><th>Q.t\u00e0</th><th>U.M.</th>' +
        '<th style="color:#F9A825;">Costo Int. \uD83D\uDD12</th>' +
        '<th>Markup %</th><th>Prezzo Unit.</th><th>Importo</th>' +
        '<th>' + F.esc(F.taxLabel()) + ' %</th><th>' + F.esc(F.taxLabel()) + '</th><th>Note</th><th></th>' +
      '</tr></thead>' +
      '<tbody id="prev-tbody"></tbody>' +
      '<tfoot><tr>' +
        '<td colspan="7" class="r" style="font-weight:700;">TOTALE IMPONIBILE</td>' +
        '<td id="prev-tot-imp" class="r" style="font-weight:700;"></td>' +
        '<td style="font-weight:700;">TOT ' + F.esc(F.taxLabel()) + '</td>' +
        '<td id="prev-tot-iva" class="r" style="font-weight:700;"></td>' +
        '<td colspan="2"></td>' +
      '</tr></tfoot>' +
    '</table></div>' +

    '<button class="btn-add" onclick="Pages._prevAddRow(null, null)">+ Aggiungi riga manuale</button>' +

    '<div class="sec grey" style="margin-top:22px;">Riepilogo Interno (non stampato)</div>' +
    '<div id="prev-recap" class="recap"></div>' +

    '<div style="display:flex;gap:12px;margin-top:24px;align-items:center;">' +
      '<button onclick="Pages._prevSalva()" style="' +
        'padding:12px 32px;background:#1B4332;color:#fff;border:none;' +
        'border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;' +
        'font-family:var(--font);transition:background .2s;"' +
        'onmouseover="this.style.background=\'#2D6A4F\'"' +
        'onmouseout="this.style.background=\'#1B4332\'">' +
        '\uD83D\uDCBE Salva Preventivo' +
      '</button>' +
      '<button onclick="Pages._prevGeneraPDFEditor()" style="' +
        'padding:12px 28px;background:#1565C0;color:#fff;border:none;' +
        'border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;' +
        'font-family:var(--font);transition:background .2s;"' +
        'onmouseover="this.style.background=\'#1976D2\'"' +
        'onmouseout="this.style.background=\'#1565C0\'">' +
        '\uD83D\uDDB8 Anteprima / Stampa PDF' +
      '</button>' +
      '<span id="prev-save-msg" style="font-size:13px;color:#2E7D32;display:none;font-weight:600;"></span>' +
    '</div>'
  );
};


/* ------------------------------------------------------------
 * Mostra editor e pre-compila dal budget_costi del progetto.
 * ------------------------------------------------------------ */
Pages._prevNuovo = async function () {
  DB.invalidateCache('politica_prezzi');
  const polRows   = await DB.all('politica_prezzi');
  Pages._polCache = polRows;
  const pol = polRows[0] ?? {};
  const getMarkup = (cat) => {
    const key = 'markup_' + cat.toLowerCase();
    return pol[key] ?? C.MARKUP_DEFAULT[cat.toLowerCase()] ?? 25;
  };

  const editorEl = document.getElementById('prev-editor');
  editorEl.style.display = 'block';
  editorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.getElementById('prev-tbody').innerHTML = '';

  const budgetRighe = await DB.byProject('budget_costi', App.proj);

  if (budgetRighe.length) {
    budgetRighe.forEach(r => Pages._prevAddRow(r, getMarkup));
  } else {
    Pages._prevAddRow(null, getMarkup);
    Pages._prevAddRow(null, getMarkup);
    Pages._prevAddRow(null, getMarkup);
  }

  Pages._prevUpdate();
};


/* ------------------------------------------------------------
 * Aggiunge una riga all'editor.
 * ------------------------------------------------------------ */
Pages._prevAddRow = function (budgetRow, getMarkup) {
  const r      = budgetRow ?? {};
  const cat    = r.categoria || '';
  const markup = getMarkup ? getMarkup(cat || 'Altro') : 25;
  const cu     = +r.costo_unitario || 0;
  const qty    = +r.qta || 0;
  const pu     = cu * (1 + markup / 100);
  const imp    = pu * qty;

  const html =
    '<tr>' +
      '<td><select data-role="cat" onchange="Pages._prevUpdate()">' +
        '<option value=""></option>' + F.sel(C.CATC, cat) +
      '</select></td>' +
      '<td><input data-role="des" value="' + F.esc(r.descrizione || '') + '" oninput="Pages._prevUpdate()"></td>' +
      '<td><input data-role="qty" type="number" step="0.01" min="0" value="' + (qty || '') + '" style="width:70px;" oninput="Pages._prevUpdate()"></td>' +
      '<td><input data-role="um" value="' + F.esc(r.um || '') + '" class="w-um"></td>' +
      '<td style="background:#FFFDE7;">' +
        '<input data-role="cu" type="number" step="0.01" min="0" value="' + (cu || '') + '" style="width:90px;background:transparent;" oninput="Pages._prevUpdate()">' +
      '</td>' +
      '<td><input data-role="mkup" type="number" step="0.5" min="0" value="' + markup + '" style="width:70px;" oninput="Pages._prevUpdate()"></td>' +
      '<td data-role="pu" class="r"><b>' + F.money(pu) + '</b></td>' +
      '<td data-role="imp" class="r"><b>' + F.money(imp) + '</b></td>' +
      '<td><select data-role="iva" onchange="Pages._prevUpdate()">' + F.sel(C.IVA, r.aliq_iva ?? F.defaultTaxRate()) + '</select></td>' +
      '<td data-role="ivav" class="r">' + F.money(imp * F.iva(r.aliq_iva ?? F.defaultTaxRate())) + '</td>' +
      '<td><input data-role="note" value="' + F.esc(r.note || '') + '"></td>' +
      '<td><button onclick="this.closest(\'tr\').remove(); Pages._prevUpdate();"' +
          ' style="background:none;border:none;color:#C62828;cursor:pointer;font-size:16px;padding:2px 6px;" title="Rimuovi riga">\u00d7</button></td>' +
    '</tr>';

  document.getElementById('prev-tbody').insertAdjacentHTML('beforeend', html);
};


/* ------------------------------------------------------------
 * Ricalcola totali e riepilogo margine live.
 * ------------------------------------------------------------ */
Pages._prevUpdate = function () {
  let totImp = 0, totIva = 0, totCosto = 0;

  document.querySelectorAll('#prev-tbody tr').forEach(function (row) {
    const g = (role) => row.querySelector('[data-role="' + role + '"]')?.value ?? '';
    const cu   = +g('cu')   || 0;
    const qty  = +g('qty')  || 0;
    const mkup = +g('mkup') || 0;
    const iva  = F.iva(g('iva') || F.defaultTaxRate());
    const pu   = cu * (1 + mkup / 100);
    const imp  = pu * qty;

    const puEl  = row.querySelector('[data-role="pu"]');
    const impEl = row.querySelector('[data-role="imp"]');
    const ivaEl = row.querySelector('[data-role="ivav"]');
    if (puEl)  puEl.innerHTML  = '<b>' + F.money(pu)  + '</b>';
    if (impEl) impEl.innerHTML = '<b>' + F.money(imp) + '</b>';
    if (ivaEl) ivaEl.textContent = F.money(imp * iva);

    totImp   += imp;
    totIva   += imp * iva;
    totCosto += cu * qty;
  });

  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('prev-tot-imp', F.money(totImp));
  set('prev-tot-iva', F.money(totIva));

  const margineEuro = totImp - totCosto;
  const marginePct  = totImp > 0 ? (margineEuro / totImp) * 100 : 0;

  const recap = document.getElementById('prev-recap');
  if (recap) {
    recap.innerHTML =
      F.kpi('Totale Imponibile',  F.money(totImp),          '', '') +
      F.kpi(F.taxLabel() + ' Total', F.money(totIva),          '', 'c-grey') +
      F.kpi('Total incl. ' + F.taxLabel(), F.money(totImp + totIva), '', '') +
      F.kpi('Costo Interno',      F.money(totCosto),        '', 'c-grey') +
      F.kpi('Margine Lordo',      F.money(margineEuro),     '', margineEuro < 0 ? 'c-red' : 'c-margin') +
      F.kpi('Margine %',          F.pct(marginePct),        '', '');
  }
};


/* ------------------------------------------------------------
 * Salva il preventivo su storage locale.
 * ------------------------------------------------------------ */
Pages._prevSalva = async function () {
  const g = (id) => document.getElementById(id)?.value ?? '';

  const numero = g('prev-numero').trim();
  const codice = App.proj;

  if (!numero) { alert('Inserire il numero preventivo.'); return; }

  const righe = [];
  document.querySelectorAll('#prev-tbody tr').forEach(function (row) {
    const gv   = (role) => row.querySelector('[data-role="' + role + '"]')?.value ?? '';
    const des  = gv('des');
    const qty  = +gv('qty') || 0;
    const cu   = +gv('cu')  || 0;
    const mkup = +gv('mkup') || 0;
    if (!des && !qty && !cu) return;
    const pu  = cu * (1 + mkup / 100);
    const imp = pu * qty;
    righe.push({
      categoria: gv('cat'), descrizione: des, qta: qty, um: gv('um'),
      costo_unitario: cu, markup_pct: mkup,
      prezzo_unitario: pu, importo: imp,
      aliq_iva: gv('iva') || String(F.defaultTaxRate()), note: gv('note'),
    });
  });

  const testata = {
    codice, numero,
    data:         g('prev-data'),
    stato:        g('prev-stato'),
    note_cliente: g('prev-note'),
    creato_da:    App.userEmail ?? '',
  };

  DB.invalidateCache('preventivi');
  const tuttiPrev = await DB.all('preventivi');
  const esistente = tuttiPrev.find(p => p.numero === numero && p.codice === codice);

  if (esistente) {
    const confermato = confirm(
      'Il preventivo \u00ab' + numero + '\u00bb esiste gi\u00e0 per il progetto ' + codice + '.\n\n' +
      'Vuoi sovrascriverlo con i dati attuali?\n\n' +
      '\u2022 Premi OK per sovrascrivere.\n\u2022 Premi Annulla per tornare all\'editor.'
    );
    if (!confermato) return;

    await DB.update('preventivi', esistente.id, testata);

    DB.invalidateCache('preventivi_righe');
    const righeDaCancellare = (await DB.all('preventivi_righe'))
      .filter(r => r.preventivo_id === esistente.id).map(r => r.id);
    for (const rid of righeDaCancellare) await DB.del('preventivi_righe', rid);

    if (righe.length) {
      await DB.insertBatch('preventivi_righe', righe.map(r => ({ ...r, preventivo_id: esistente.id })));
    }

    DB.invalidateCache('preventivi');
    DB.invalidateCache('preventivi_righe');
    Pages._prevShowSaveMsg('\u2713 Preventivo ' + numero + ' aggiornato!');

  } else {
    await DB.insertBatch('preventivi', [testata]);

    DB.invalidateCache('preventivi');
    const salvato = (await DB.all('preventivi'))
      .filter(p => p.codice === codice && p.numero === numero)
      .sort((a, b) => b.id - a.id)[0];

    if (!salvato) { alert('Errore: impossibile recuperare l\'id del preventivo salvato.'); return; }

    if (righe.length) {
      await DB.insertBatch('preventivi_righe', righe.map(r => ({ ...r, preventivo_id: salvato.id })));
    }

    DB.invalidateCache('preventivi');
    Pages._prevShowSaveMsg('\u2713 Preventivo ' + numero + ' salvato!');
  }

  setTimeout(async function () { await Pages.preventivi(); }, 1400);
};


/* ------------------------------------------------------------
 * Mostra messaggio di conferma salvataggio.
 * ------------------------------------------------------------ */
Pages._prevShowSaveMsg = function (testo) {
  const msg = document.getElementById('prev-save-msg');
  if (!msg) return;
  msg.textContent   = testo;
  msg.style.display = 'inline';
  msg.style.color   = '#2E7D32';
  setTimeout(function () { msg.style.display = 'none'; }, 3000);
};


/* ------------------------------------------------------------
 * Apre un preventivo esistente nell'editor.
 * ------------------------------------------------------------ */
Pages._prevApri = async function (prevId) {
  DB.invalidateCache('preventivi');
  DB.invalidateCache('preventivi_righe');

  const prev = (await DB.all('preventivi')).find(p => p.id === prevId);
  if (!prev) return;

  App.proj = prev.codice;

  const righe = (await DB.all('preventivi_righe')).filter(r => r.preventivo_id === prevId);

  const editorEl = document.getElementById('prev-editor');
  editorEl.style.display = 'block';
  editorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.getElementById('prev-numero').value = prev.numero;
  document.getElementById('prev-data').value   = prev.data;
  document.getElementById('prev-stato').value  = prev.stato;
  document.getElementById('prev-note').value   = prev.note_cliente;

  document.getElementById('prev-tbody').innerHTML = '';
  righe.forEach(function (r) {
    Pages._prevAddRow(
      { categoria: r.categoria, descrizione: r.descrizione, qta: r.qta, um: r.um,
        costo_unitario: r.costo_unitario, markup_pct: r.markup_pct,
        aliq_iva: r.aliq_iva, note: r.note },
      function () { return r.markup_pct || 25; }
    );
  });

  Pages._prevUpdate();
};


/* ============================================================
 * _prevTemplatePDF — genera l'HTML completo del documento PDF.
 *
 * Funzione helper condivisa tra _prevGeneraPDF e
 * _prevGeneraPDFEditor per evitare duplicazione del template.
 *
 * @param {object} opts
 *   .numero       {string}  — numero preventivo
 *   .data         {string}  — data ISO (YYYY-MM-DD)
 *   .nomeCliente  {string}  — nome cliente da anagrafica
 *   .noteCliente  {string}  — note/oggetto del preventivo
 *   .righeHTML    {string}  — righe <tr> già costruite
 *   .totImp       {number}  — totale imponibile
 *   .totIva       {number}  — totale IVA
 *   .totFinale    {number}  — totale complessivo
 * ============================================================ */
Pages._prevTemplatePDF = function (opts) {
  /* Formatta data ISO → GG/MM/AAAA */
  const fmtData = function (iso) {
    if (!iso) return '\u2014';
    const p = iso.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  };

  /* CSS comune al documento PDF */
  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, Arial, sans-serif; background: #fff; color: #1A1A2E; font-size: 13px; line-height: 1.5; }
    .pagina { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 18mm 20mm 22mm; display: flex; flex-direction: column; }
    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid #1B4332; margin-bottom: 22px; }
    .logo-area { display: flex; align-items: center; gap: 10px; }
    .logo-box { width: 40px; height: 40px; background: #D8F3DC; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-area .brand h1 { font-size: 20px; font-weight: 800; color: #1B4332; letter-spacing: -0.5px; margin-bottom: 1px; }
    .logo-area .brand .tagline { font-size: 11px; color: #52B788; font-weight: 600; letter-spacing: .8px; text-transform: uppercase; }
    .azienda-info { text-align: right; font-size: 11.5px; color: #475569; line-height: 1.7; }
    .azienda-info strong { color: #1A1A2E; font-size: 12px; }
    /* Titolo */
    .doc-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .doc-title { font-size: 28px; font-weight: 800; color: #1B4332; letter-spacing: -0.5px; }
    .doc-meta { text-align: right; font-size: 12px; color: #475569; line-height: 1.9; }
    .doc-meta .numero { font-size: 15px; font-weight: 700; color: #1A1A2E; }
    /* Destinatario */
    .destinatario-box { background: #F8FAF8; border: 1px solid #E2E8E2; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; }
    .dest-label { font-size: 10px; font-weight: 700; color: #52B788; text-transform: uppercase; letter-spacing: .7px; margin-bottom: 4px; }
    .dest-value { font-size: 15px; color: #1A1A2E; font-weight: 700; }
    /* Oggetto */
    .oggetto { margin-bottom: 20px; padding: 10px 14px; border-left: 3px solid #F9A825; background: #FFFDF5; }
    .oggetto .lbl { font-size: 10px; font-weight: 700; color: #B45309; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 3px; }
    .oggetto .testo { font-size: 13px; color: #1A1A2E; }
    /* Tabella lavorazioni */
    .tbl-titolo { font-size: 10px; font-weight: 700; color: #52B788; text-transform: uppercase; letter-spacing: .7px; margin-bottom: 6px; }
    table.lavorazioni { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    table.lavorazioni thead th { background: #1B4332; color: #fff; padding: 9px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
    table.lavorazioni thead th:first-child { border-radius: 4px 0 0 0; text-align: left; }
    table.lavorazioni thead th:last-child  { border-radius: 0 4px 0 0; text-align: center; }
    table.lavorazioni thead th.r { text-align: right; }
    table.lavorazioni thead th.c { text-align: center; }
    /* Riepilogo */
    .riepilogo { display: flex; justify-content: flex-end; margin-top: 14px; margin-bottom: 24px; }
    .riepilogo-box { width: 260px; border: 1px solid #E2E8E2; border-radius: 8px; overflow: hidden; }
    .riepilogo-riga { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; font-size: 12.5px; border-bottom: 1px solid #F0F2F0; }
    .riepilogo-riga:last-child { border-bottom: none; }
    .riepilogo-riga .lbl { color: #475569; }
    .riepilogo-riga .val { font-weight: 600; color: #1A1A2E; }
    .riepilogo-riga.totale { background: #1B4332; padding: 11px 14px; }
    .riepilogo-riga.totale .lbl { color: #95D5B2; font-weight: 700; font-size: 13px; }
    .riepilogo-riga.totale .val { color: #fff; font-weight: 800; font-size: 15px; }
    /* Note */
    .note-box { border: 1px solid #E2E8E2; border-radius: 8px; padding: 14px 18px; margin-bottom: 28px; background: #FAFCFA; }
    .note-box .lbl { font-size: 10px; font-weight: 700; color: #52B788; text-transform: uppercase; letter-spacing: .7px; margin-bottom: 6px; }
    .note-box p { font-size: 12px; color: #475569; line-height: 1.6; }
    /* Firma */
    .firma-row { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: auto; padding-top: 20px; border-top: 1px solid #E2E8E2; }
    .firma-col .lbl { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 28px; }
    .firma-col .linea-firma { border-bottom: 1.5px solid #B0BEC5; margin-bottom: 5px; }
    .firma-col .sub-firma { font-size: 10px; color: #94A3B8; text-align: center; }
    /* Footer */
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #E2E8E2; display: flex; justify-content: space-between; font-size: 10px; color: #94A3B8; }
    /* Barra azioni (solo schermo) */
    .barra-azioni { position: fixed; bottom: 24px; right: 24px; display: flex; gap: 10px; z-index: 9999; }
    .btn-pdf { padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all .18s; box-shadow: 0 4px 14px rgba(0,0,0,.15); }
    .btn-pdf-stampa { background: #1B4332; color: #fff; }
    .btn-pdf-stampa:hover { background: #2D6A4F; }
    .btn-pdf-chiudi { background: #fff; color: #475569; border: 1.5px solid #E2E8E2; }
    .btn-pdf-chiudi:hover { background: #F8FAF8; }
    /* Stampa */
    @media print {
      body { background: #fff; }
      .pagina { padding: 12mm 15mm 16mm; width: 100%; margin: 0; }
      .no-print { display: none !important; }
      .destinatario-box, .riepilogo, .firma-row, .note-box { page-break-inside: avoid; }
      tr { page-break-inside: avoid; }
    }
  `;

  /* Righe tabella o placeholder vuoto */
  const corpoTabella = opts.righeHTML ||
    '<tr><td colspan="6" style="padding:14px;text-align:center;color:#94A3B8;font-style:italic;">Nessuna lavorazione inserita.</td></tr>';

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Quote ${F.esc(opts.numero)} - Project Cost Manager</title>
  <style>${css}</style>
</head>
<body>

  <!-- Barra azioni (solo schermo, non stampata) -->
  <div class="barra-azioni no-print">
    <button class="btn-pdf btn-pdf-chiudi" onclick="window.close()">&#x2715; Chiudi</button>
    <button class="btn-pdf btn-pdf-stampa" onclick="window.print()">&#128438; Stampa / Salva PDF</button>
  </div>

  <div class="pagina">

    <!-- 1. HEADER: logo SVG + dati azienda -->
    <header class="header">
      <div class="logo-area">
        <div class="logo-box">${_APP_LOGO_SVG}</div>
        <div class="brand">
          <h1>Project Cost Manager</h1>
          <div class="tagline">Offline project quotes</div>
        </div>
      </div>
      <div class="azienda-info">
        <strong>${F.esc(opts.azienda.nome || 'Company')}</strong><br>
        ${F.esc(opts.azienda.indirizzo || '')}${opts.azienda.cap ? ' &mdash; ' + F.esc(opts.azienda.cap) : ''}<br>
        ${opts.azienda.tel ? 'Tel. ' + F.esc(opts.azienda.tel) + ' &nbsp;&bull;&nbsp; ' : ''}${F.esc(opts.azienda.email || '')}<br>
        ${F.esc(F.taxIdLabel())} ${F.esc(opts.azienda.piva || '—')}
      </div>
    </header>

    <!-- 2. TITOLO + META (stato rimosso: info interna) -->
    <div class="doc-title-row">
      <div class="doc-title">Preventivo</div>
      <div class="doc-meta">
        <div class="numero">${F.esc(opts.numero)}</div>
        <div>Data emissione: <strong>${fmtData(opts.data)}</strong></div>
      </div>
    </div>

    <!-- 3. DESTINATARIO — solo nome cliente -->
    <div class="destinatario-box">
      <div class="dest-label">Destinatario</div>
      <div class="dest-value">${F.esc(opts.nomeCliente || '\u2014')}</div>
    </div>

    <!-- 4. OGGETTO (note cliente) -->
    ${opts.noteCliente ? `<div class="oggetto"><div class="lbl">Oggetto</div><div class="testo">${F.esc(opts.noteCliente)}</div></div>` : ''}

    <!-- 5. TABELLA LAVORAZIONI -->
    <div class="tbl-titolo">Dettaglio Lavorazioni</div>
    <table class="lavorazioni">
      <thead><tr>
        <th style="width:42%;">Descrizione</th>
        <th class="c" style="width:9%;">Q.t&agrave;</th>
        <th class="c" style="width:9%;">U.M.</th>
        <th class="r" style="width:15%;">Prezzo Unit.</th>
        <th class="r" style="width:15%;">Importo</th>
        <th class="c" style="width:10%;">${F.esc(F.taxLabel())} %</th>
      </tr></thead>
      <tbody>${corpoTabella}</tbody>
    </table>

    <!-- 6. RIEPILOGO ECONOMICO -->
    <div class="riepilogo">
      <div class="riepilogo-box">
        <div class="riepilogo-riga"><span class="lbl">Totale imponibile</span><span class="val">${F.money(opts.totImp)}</span></div>
        <div class="riepilogo-riga"><span class="lbl">${F.esc(F.taxLabel())}</span><span class="val">${F.money(opts.totIva)}</span></div>
        <div class="riepilogo-riga totale"><span class="lbl">Total incl. ${F.esc(F.taxLabel())}</span><span class="val">${F.money(opts.totFinale)}</span></div>
      </div>
    </div>

    <!-- 7. NOTE E CONDIZIONI -->
    <div class="note-box">
      <div class="lbl">Note e Condizioni</div>
      <p>
        Il presente preventivo &egrave; valido per 30 giorni dalla data di emissione.<br>
        I prezzi indicati sono comprensivi di manodopera e materiali salvo diversa indicazione.<br>
        Modalit&agrave; di pagamento: da concordare. I lavori avranno inizio previa accettazione scritta.
      </p>
    </div>

    <!-- 8. BLOCCO FIRMA -->
    <div class="firma-row">
      <div class="firma-col">
        <div class="lbl">Per accettazione &mdash; Il Cliente</div>
        <div class="linea-firma"></div>
        <div class="sub-firma">Data e Firma</div>
      </div>
      <div class="firma-col">
        <div class="lbl">For ${F.esc(opts.azienda.nome || 'Company')}</div>
        <div class="linea-firma"></div>
        <div class="sub-firma">Il Titolare / Responsabile</div>
      </div>
    </div>

    <!-- 9. FOOTER -->
    <footer class="footer">
      <span>${F.esc(opts.azienda.nome || 'Company')} &mdash; Quote ${F.esc(opts.numero)}</span>
      <span>Emesso il ${fmtData(opts.data)}</span>
    </footer>

  </div><!-- /pagina -->

</body>
</html>`;
};


/* ============================================================
 * _prevBuildHTML — helper condiviso (DRY).
 *
 * Carica dati freschi da DB e restituisce la stringa HTML
 * del documento PDF per il preventivo con id = prevId.
 * Usato da _prevGeneraPDF.
 *
 * @param  {number} prevId
 * @returns {Promise<string|null>} HTML del documento, o null se non trovato
 * ============================================================ */
Pages._prevBuildHTML = async function (prevId) {
  DB.invalidateCache('preventivi');
  DB.invalidateCache('preventivi_righe');

  const prev = (await DB.all('preventivi')).find(p => p.id === prevId);
  if (!prev) return null;

  const righe = (await DB.all('preventivi_righe')).filter(r => r.preventivo_id === prevId);
  const proj  = (await DB.all('anagrafica')).find(p => p.codice === prev.codice) ?? {};

  /* Carica dati azienda da politica_prezzi */
  DB.invalidateCache('politica_prezzi');
  const polAz  = (await DB.all('politica_prezzi'))[0] ?? {};
  const appCompany = AppSettings.get().company;
  const azienda = {
    nome:      polAz.azienda_nome      || appCompany.name || '',
    indirizzo: polAz.azienda_indirizzo || appCompany.address || '',
    cap:       polAz.azienda_cap       || appCompany.postal_code || '',
    tel:       polAz.azienda_tel       || appCompany.phone || '',
    email:     polAz.azienda_email     || appCompany.email || '',
    piva:      polAz.azienda_piva      || appCompany.tax_id || '',
  };

  /* Calcoli totali */
  let totImp = 0, totIva = 0;
  righe.forEach(function (r) {
    const imp = +r.importo || 0;
    totImp += imp;
    totIva += imp * F.iva(r.aliq_iva ?? F.defaultTaxRate());
  });

  /* Righe tabella HTML */
  const righeHTML = righe.map(function (r, i) {
    const bg = i % 2 === 0 ? '#ffffff' : '#F8FAF8';
    return '<tr style="background:' + bg + ';">' +
      '<td style="padding:9px 12px;border-bottom:1px solid #EEF0EE;font-size:13px;color:#1A1A2E;">'      + F.esc(r.descrizione || '\u2014') + '</td>' +
      '<td style="padding:9px 12px;border-bottom:1px solid #EEF0EE;font-size:13px;text-align:center;color:#475569;">' + F.esc(String(r.qta ?? '')) + '</td>' +
      '<td style="padding:9px 12px;border-bottom:1px solid #EEF0EE;font-size:13px;text-align:center;color:#475569;">' + F.esc(r.um || '') + '</td>' +
      '<td style="padding:9px 12px;border-bottom:1px solid #EEF0EE;font-size:13px;text-align:right;color:#1A1A2E;">'  + F.money(+r.prezzo_unitario || 0) + '</td>' +
      '<td style="padding:9px 12px;border-bottom:1px solid #EEF0EE;font-size:13px;text-align:right;font-weight:600;color:#1B4332;">' + F.money(+r.importo || 0) + '</td>' +
      '<td style="padding:9px 12px;border-bottom:1px solid #EEF0EE;font-size:13px;text-align:center;color:#475569;">' + F.esc(String(r.aliq_iva ?? F.defaultTaxRate())) + '%</td>' +
    '</tr>';
  }).join('');

  return Pages._prevTemplatePDF({
    numero:      prev.numero,
    data:        prev.data,
    nomeCliente: proj.cliente || '',
    noteCliente: prev.note_cliente || '',
    righeHTML,
    totImp,
    totIva,
    totFinale:   totImp + totIva,
    azienda,
  });
};


/* ============================================================
 * _prevGeneraPDF — apre il PDF in un popup con barra azioni.
 * L'utente può cliccare "Stampa / Salva PDF" per scaricare.
 * ============================================================ */
Pages._prevGeneraPDF = async function (prevId) {
  const html = await Pages._prevBuildHTML(prevId);
  if (!html) { alert('Preventivo non trovato.'); return; }
  Pages._prevApriFinestra(html);
};


/* ============================================================
 * _prevGeneraPDFEditor — genera PDF direttamente dall'editor
 * attivo, senza richiedere un id salvato (anteprima rapida).
 * ============================================================ */
Pages._prevGeneraPDFEditor = async function () {
  const g = (id) => document.getElementById(id)?.value ?? '';

  const numero = g('prev-numero').trim() || 'Bozza';
  const data   = g('prev-data');
  const note   = g('prev-note');

  /* Raccoglie righe dall'editor */
  const righe = [];
  document.querySelectorAll('#prev-tbody tr').forEach(function (row) {
    const gv   = (role) => row.querySelector('[data-role="' + role + '"]')?.value ?? '';
    const des  = gv('des');
    const qty  = +gv('qty') || 0;
    const cu   = +gv('cu')  || 0;
    const mkup = +gv('mkup') || 0;
    if (!des && !qty && !cu) return;
    const pu  = cu * (1 + mkup / 100);
    const imp = pu * qty;
    righe.push({
      descrizione: des, qta: qty, um: gv('um'),
      prezzo_unitario: pu, importo: imp,
      aliq_iva: gv('iva') || String(F.defaultTaxRate()),
    });
  });

  /* Dati cliente */
  const proj = (await DB.all('anagrafica')).find(p => p.codice === App.proj) ?? {};

  /* Carica dati azienda da politica_prezzi */
  DB.invalidateCache('politica_prezzi');
  const polAz  = (await DB.all('politica_prezzi'))[0] ?? {};
  const appCompany = AppSettings.get().company;
  const azienda = {
    nome:      polAz.azienda_nome      || appCompany.name || '',
    indirizzo: polAz.azienda_indirizzo || appCompany.address || '',
    cap:       polAz.azienda_cap       || appCompany.postal_code || '',
    tel:       polAz.azienda_tel       || appCompany.phone || '',
    email:     polAz.azienda_email     || appCompany.email || '',
    piva:      polAz.azienda_piva      || appCompany.tax_id || '',
  };

  /* Calcoli */
  let totImp = 0, totIva = 0;
  righe.forEach(function (r) {
    const imp = +r.importo || 0;
    totImp += imp;
    totIva += imp * F.iva(r.aliq_iva ?? F.defaultTaxRate());
  });

  /* Righe tabella */
  const righeHTML = righe.map(function (r, i) {
    const bg = i % 2 === 0 ? '#ffffff' : '#F8FAF8';
    return '<tr style="background:' + bg + ';">' +
      '<td style="padding:9px 12px;border-bottom:1px solid #EEF0EE;font-size:13px;">'                   + F.esc(r.descrizione || '\u2014') + '</td>' +
      '<td style="padding:9px 12px;border-bottom:1px solid #EEF0EE;font-size:13px;text-align:center;color:#475569;">' + F.esc(String(r.qta ?? '')) + '</td>' +
      '<td style="padding:9px 12px;border-bottom:1px solid #EEF0EE;font-size:13px;text-align:center;color:#475569;">' + F.esc(r.um || '') + '</td>' +
      '<td style="padding:9px 12px;border-bottom:1px solid #EEF0EE;font-size:13px;text-align:right;">'  + F.money(+r.prezzo_unitario || 0) + '</td>' +
      '<td style="padding:9px 12px;border-bottom:1px solid #EEF0EE;font-size:13px;text-align:right;font-weight:600;color:#1B4332;">' + F.money(+r.importo || 0) + '</td>' +
      '<td style="padding:9px 12px;border-bottom:1px solid #EEF0EE;font-size:13px;text-align:center;color:#475569;">' + F.esc(String(r.aliq_iva ?? F.defaultTaxRate())) + '%</td>' +
    '</tr>';
  }).join('');

  const html = Pages._prevTemplatePDF({
    numero, data,
    nomeCliente: proj.cliente || '',
    noteCliente: note,
    righeHTML,
    totImp, totIva,
    totFinale: totImp + totIva,
    azienda,
  });

  Pages._prevApriFinestra(html);
};


/* ------------------------------------------------------------
 * _prevApriFinestra — apre il documento HTML in un popup.
 * Usato dal bottone PDF: mostra la barra con i bottoni
 * "Chiudi" e "Stampa / Salva PDF".
 * ------------------------------------------------------------ */
Pages._prevApriFinestra = function (html) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Il browser ha bloccato il popup. Consenti i popup per questo sito e riprova.');
    return;
  }
  win.opener = null;
  win.document.open();
  win.document.write(html);
  win.document.close();
};


/* ------------------------------------------------------------
 * Calcola il prossimo numero preventivo.
 * Formato: PREV-YYYY-NNN (es. PREV-2026-003)
 * ------------------------------------------------------------ */
Pages._prevCalcolaNumero = function (tuttiPrev) {
  const anno   = new Date().getFullYear();
  const prefix = 'PREV-' + anno + '-';

  const nums = tuttiPrev
    .filter(p => p.numero && p.numero.startsWith(prefix))
    .map(p => parseInt(p.numero.replace(prefix, ''), 10))
    .filter(n => !isNaN(n));

  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return prefix + String(next).padStart(3, '0');
};


/* Cache politica prezzi — popolata da _prevNuovo e dall'entry point */
Pages._polCache = null;
