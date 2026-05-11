'use strict';

/* ============================================================
 * ANALYTICS.JS — Pagina Analytics
 *
 * Sezioni attive:
 *   1. Incidenza Costi Generali — torta SVG + sparkline
 *
 * Sezioni temporaneamente disabilitate:
 *   [BEP DISABILITATO] Break Even Point — diagramma cartesiano SVG
 *   Per riabilitare: cercare tutti i blocchi marcati con
 *   "BEP DISABILITATO" e decommentarli, poi ripristinare
 *   il tab nella funzione Pages.analytics.
 *
 * Dati letti da:
 *   - cg_budget       (per la sezione Incidenza)
 *   - consuntivo_costi (per il calcolo incidenza totale)
 * ============================================================ */

Pages.analytics = async function () {
  const el = document.getElementById('page-analytics');

  /* ----------------------------------------------------------
   * Nota: il tab BEP è stato rimosso temporaneamente.
   * Quando verrà reintrodotto, aggiungere qui il markup:
   *
   *   '<div class="tab active" onclick="Pages.anlTab(this,\'bep\')" >&#128202; Break Even Point</div>' +
   *   '<div class="tab"        onclick="Pages.anlTab(this,\'incidenza\')" >&#129383; Incidenza Costi Generali</div>' +
   *
   * e sostituire await Pages.anlRenderIncidenza() con await Pages.anlRenderBep().
   * ---------------------------------------------------------- */
  el.innerHTML =
    '<h1>Analytics</h1>' +
    '<p class="subtitle">Analisi avanzata: incidenza dei costi generali sui progetti.</p>' +
    '<div class="tabs">' +
      '<div class="tab active" onclick="Pages.anlTab(this,\'incidenza\')" >&#129383; Incidenza Costi Generali</div>' +
    '</div>' +
    '<div id="anl-content"></div>';

  /* Carica direttamente la sezione Incidenza (BEP disabilitato) */
  await Pages.anlRenderIncidenza();
};

/* ----------------------------------------------------------------
 * Cambio tab — gestisce la navigazione tra le sezioni attive.
 * Quando il BEP verrà reintrodotto, aggiungere il case 'bep'.
 * ---------------------------------------------------------------- */
Pages.anlTab = async function (tabEl, tab) {
  document.querySelectorAll('#page-analytics .tab').forEach(function (t) {
    t.classList.remove('active');
  });
  tabEl.classList.add('active');

  /* Router sezioni attive */
  if (tab === 'incidenza') {
    await Pages.anlRenderIncidenza();

  /* [BEP DISABILITATO] — decommentare il blocco sottostante per ripristinare
  } else if (tab === 'bep') {
    await Pages.anlRenderBep();
  */
  }
};

/* ================================================================
 * [BEP DISABILITATO] — SEZIONE BREAK EVEN POINT
 *
 * Per ripristinare questa sezione:
 *   1. Decommentare l'intero blocco qui sotto
 *   2. Aggiungere il tab BEP nell'HTML di Pages.analytics
 *   3. Aggiungere il case 'bep' nel router Pages.anlTab
 *
 * ================================================================

Pages.anlRenderBep = async function () {
  const el = document.getElementById('anl-content');
  el.innerHTML = '<p style="color:#64748B;padding:20px;">Caricamento dati BEP...</p>';

  const [cgRows, progetti] = await Promise.all([
    DB.all('cg_consuntivo'),
    DB.all('anagrafica'),
  ]);

  const totaleCostiFissi = cgRows.reduce(function (acc, r) {
    return acc + C.MESIK.reduce(function (a, m) { return a + (+r[m] || 0); }, 0);
  }, 0);

  const datiProgetti = await Promise.all(
    progetti.map(async function (p) {
      const tot = await totali('consuntivo', p.codice);
      return { codice: p.codice, nome: p.nome || p.codice, costi: tot.costi, ricavi: tot.ricavi };
    })
  );

  const attivi = datiProgetti.filter(function (p) { return p.ricavi > 0; });

  if (!attivi.length) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:#64748B;">Nessun progetto con ricavi consuntivati.</div>';
    return;
  }

  const totRicavi = attivi.reduce(function (a, p) { return a + p.ricavi; }, 0);

  const bepData = attivi.map(function (p) {
    const quotaCF  = totRicavi > 0 ? (p.ricavi / totRicavi) * totaleCostiFissi : 0;
    const cvRate   = p.ricavi > 0 ? p.costi / p.ricavi : 0;
    const bep      = (1 - cvRate) > 0 ? quotaCF / (1 - cvRate) : null;
    const margSic  = bep !== null ? p.ricavi - bep : null;
    const mcPct    = (1 - cvRate) * 100;
    return {
      nome:      p.nome,
      ricavi:    p.ricavi,
      costiVar:  p.costi,
      quotaCF:   quotaCF,
      cvRate:    cvRate,
      bep:       bep,
      margSic:   margSic,
      mcPct:     mcPct,
      superaBep: bep !== null ? p.ricavi >= bep : false,
    };
  });

  Pages._anlBepData = bepData;

  const opts = bepData.map(function (d, i) {
    return '<option value="' + i + '">' + F.esc(d.nome) + '</option>';
  }).join('');

  const totRic = bepData.reduce(function (a, d) { return a + d.ricavi; }, 0);
  const sopra  = bepData.filter(function (d) { return d.superaBep; }).length;

  const kpiHtml =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:22px;">' +
    F.kpi('Costi Fissi Totali',    F.money(totaleCostiFissi), null, '') +
    F.kpi('Ricavi Totali (cons.)', F.money(totRic),           null, '') +
    F.kpi('Progetti sopra BEP',   sopra + ' / ' + bepData.length, null, sopra === bepData.length ? 'pos' : '') +
    '</div>';

  el.innerHTML =
    kpiHtml +
    '<div style="margin-bottom:18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
      '<label style="font-weight:600;color:#1B4332;font-size:14px;">Progetto:</label>' +
      '<select id="anl-bep-select" onchange="Pages.anlAggiornaBep()" style="padding:8px 14px;border:1.5px solid #CBD5E1;border-radius:8px;font-size:14px;font-family:var(--font);color:#334155;background:#fff;cursor:pointer;">' + opts + '</select>' +
    '</div>' +
    '<div id="anl-bep-chart"></div>' +
    '<div id="anl-bep-table"></div>';

  Pages.anlAggiornaBep();
};

Pages.anlAggiornaBep = function () {
  const sel = document.getElementById('anl-bep-select');
  if (!sel || !Pages._anlBepData) return;

  const d = Pages._anlBepData[parseInt(sel.value, 10)];

  const W = 620, H = 380, padL = 80, padB = 50, padT = 30, padR = 20;
  const xMax = Math.max(d.ricavi * 1.3, d.bep ? d.bep * 2.1 : d.ricavi * 1.3);
  const yMax = xMax;
  const sx = function (v) { return padL + (v / xMax) * (W - padL - padR); };
  const sy = function (v) { return padT + H - padB - (v / yMax) * (H - padB - padT); };

  const ricX0 = 0, ricY0 = 0, ricX1 = xMax, ricY1 = xMax;
  const cosX0 = 0, cosY0 = d.quotaCF, cosX1 = xMax, cosY1 = d.quotaCF + d.cvRate * xMax;
  const bepSX = d.bep ? sx(d.bep) : null;
  const bepSY = d.bep ? sy(d.bep) : null;
  const realSX = sx(d.ricavi);

  const nGriglie = 5;
  let griglia = '';
  for (var gi = 0; gi <= nGriglie; gi++) {
    const val = (yMax / nGriglie) * gi;
    const yPx = sy(val);
    const xPx = sx(val);
    griglia +=
      '<line x1="' + padL + '" y1="' + yPx + '" x2="' + (W - padR) + '" y2="' + yPx + '" stroke="#E2E8F0" stroke-width="1"/>' +
      '<text x="' + (padL - 6) + '" y="' + (yPx + 4) + '" font-size="10" fill="#94A3B8" text-anchor="end" font-family="Segoe UI,Arial">' + Pages._anlShortMoney(val) + '</text>' +
      '<line x1="' + xPx + '" y1="' + padT + '" x2="' + xPx + '" y2="' + (H - padB + padT) + '" stroke="#E2E8F0" stroke-width="1"/>' +
      '<text x="' + xPx + '" y="' + (H - padB + padT + 16) + '" font-size="10" fill="#94A3B8" text-anchor="middle" font-family="Segoe UI,Arial">' + Pages._anlShortMoney(val) + '</text>';
  }

  let areaLoss = '';
  if (bepSX) {
    const pts = sx(0) + ',' + sy(0) + ' ' + bepSX + ',' + bepSY + ' ' + bepSX + ',' + bepSY + ' ' + sx(0) + ',' + sy(cosY0);
    areaLoss = '<polygon points="' + pts + '" fill="#FEE2E2" opacity="0.5"/>';
  }
  let areaProfit = '';
  if (bepSX) {
    const pts = bepSX + ',' + bepSY + ' ' + sx(xMax) + ',' + sy(xMax) + ' ' + sx(xMax) + ',' + sy(d.quotaCF + d.cvRate * xMax) + ' ' + bepSX + ',' + bepSY;
    areaProfit = '<polygon points="' + pts + '" fill="#DCFCE7" opacity="0.5"/>';
  }

  const lineaReale = '<line x1="' + realSX + '" y1="' + padT + '" x2="' + realSX + '" y2="' + (H - padB + padT) + '" stroke="#2D6A4F" stroke-width="1.5" stroke-dasharray="5,3"/>';

  let labelZone = '';
  if (bepSX) {
    const midLoss = (sx(0) + bepSX) / 2;
    const midProfit = (bepSX + sx(xMax)) / 2;
    labelZone =
      '<text x="' + midLoss + '" y="' + (padT + 18) + '" font-size="11" fill="#C62828" text-anchor="middle" font-family="Segoe UI,Arial" font-weight="600">PERDITA</text>' +
      '<text x="' + midProfit + '" y="' + (padT + 18) + '" font-size="11" fill="#1B4332" text-anchor="middle" font-family="Segoe UI,Arial" font-weight="600">UTILE</text>';
  }

  const svgContent =
    areaLoss + areaProfit + griglia +
    '<line x1="' + sx(ricX0) + '" y1="' + sy(ricY0) + '" x2="' + sx(ricX1) + '" y2="' + sy(ricY1) + '" stroke="#2D6A4F" stroke-width="2.5"/>' +
    '<text x="' + (sx(xMax) - 4) + '" y="' + (sy(xMax) - 8) + '" font-size="11" fill="#2D6A4F" text-anchor="end" font-family="Segoe UI,Arial" font-weight="600">Ricavi</text>' +
    '<line x1="' + sx(cosX0) + '" y1="' + sy(cosY0) + '" x2="' + sx(cosX1) + '" y2="' + sy(cosY1) + '" stroke="#F9A825" stroke-width="2.5"/>' +
    '<text x="' + (sx(xMax) - 4) + '" y="' + (sy(cosY1) + 14) + '" font-size="11" fill="#B45309" text-anchor="end" font-family="Segoe UI,Arial" font-weight="600">Costi Totali</text>' +
    lineaReale +
    '<text x="' + (realSX + 4) + '" y="' + (padT + 14) + '" font-size="10" fill="#2D6A4F" font-family="Segoe UI,Arial">' + F.esc(d.nome.length > 16 ? d.nome.substring(0,14) + '...' : d.nome) + '</text>' +
    labelZone +
    (bepSX ?
      '<circle cx="' + bepSX + '" cy="' + bepSY + '" r="7" fill="#fff" stroke="#C62828" stroke-width="2.5"/>' +
      '<circle cx="' + bepSX + '" cy="' + bepSY + '" r="3" fill="#C62828"/>' +
      '<line x1="' + bepSX + '" y1="' + bepSY + '" x2="' + bepSX + '" y2="' + (H - padB + padT) + '" stroke="#C62828" stroke-width="1" stroke-dasharray="3,2"/>' +
      '<line x1="' + padL  + '" y1="' + bepSY + '" x2="' + bepSX + '" y2="' + bepSY + '" stroke="#C62828" stroke-width="1" stroke-dasharray="3,2"/>' +
      '<text x="' + bepSX + '" y="' + (H - padB + padT + 30) + '" font-size="10" fill="#C62828" text-anchor="middle" font-family="Segoe UI,Arial" font-weight="700">BEP ' + Pages._anlShortMoney(d.bep) + '</text>' +
      '<text x="' + (padL - 6) + '" y="' + (bepSY + 4) + '" font-size="10" fill="#C62828" text-anchor="end" font-family="Segoe UI,Arial" font-weight="700">' + Pages._anlShortMoney(d.bep) + '</text>'
    : '') +
    '<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (H - padB + padT) + '" stroke="#334155" stroke-width="1.5"/>' +
    '<line x1="' + padL + '" y1="' + (H - padB + padT) + '" x2="' + (W - padR) + '" y2="' + (H - padB + padT) + '" stroke="#334155" stroke-width="1.5"/>' +
    '<text x="' + (W / 2) + '" y="' + (H + padT - 2) + '" font-size="11" fill="#64748B" text-anchor="middle" font-family="Segoe UI,Arial">Volume Ricavi (&#8364;)</text>' +
    '<text x="' + (-H / 2) + '" y="14" font-size="11" fill="#64748B" text-anchor="middle" font-family="Segoe UI,Arial" transform="rotate(-90)">Importo (&#8364;)</text>';

  const kpiProgetto =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:20px;">' +
    F.kpi('Ricavi reali',        F.money(d.ricavi),                          null, '') +
    F.kpi('Costi Variabili',     F.money(d.costiVar),                        null, '') +
    F.kpi('Quota CG Allocata',   F.money(d.quotaCF),                         null, '') +
    F.kpi('Marg. Contribuzione', F.pct(d.mcPct),                             null, '') +
    F.kpi('BEP (&#8364;)',       d.bep ? F.money(d.bep) : 'n/d',            null, '') +
    F.kpi('Marg. di Sicurezza',  d.margSic !== null ? F.money(d.margSic) : 'n/d', null, d.superaBep ? 'pos' : 'neg') +
    '</div>';

  const legenda =
    '<div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:14px;font-size:12px;">' +
    '<span><span style="display:inline-block;width:28px;height:3px;background:#2D6A4F;vertical-align:middle;margin-right:5px;"></span>Ricavi</span>' +
    '<span><span style="display:inline-block;width:28px;height:3px;background:#F9A825;vertical-align:middle;margin-right:5px;"></span>Costi Totali</span>' +
    '<span><span style="display:inline-block;width:28px;height:3px;background:#2D6A4F;border-top:2px dashed #2D6A4F;vertical-align:middle;margin-right:5px;"></span>Ricavi reali progetto</span>' +
    '<span><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#fff;border:2.5px solid #C62828;vertical-align:middle;margin-right:5px;"></span>Punto BEP</span>' +
    '</div>';

  document.getElementById('anl-bep-chart').innerHTML =
    '<div style="overflow-x:auto;">' +
      '<svg width="' + W + '" height="' + (H + padT) + '" style="display:block;">' +
        svgContent +
      '</svg>' +
    '</div>' +
    legenda;

  document.getElementById('anl-bep-table').innerHTML = kpiProgetto;
};

Pages._anlShortMoney = function (v) {
  if (!v && v !== 0) return '';
  if (Math.abs(v) >= 1000000) return (v / 1000000).toFixed(1).replace('.', ',') + 'M';
  if (Math.abs(v) >= 1000)    return (v / 1000).toFixed(1).replace('.', ',') + 'k';
  return v.toFixed(0);
};

--- FINE BLOCCO BEP DISABILITATO --- */

/* ================================================================
 * SEZIONE ATTIVA — INCIDENZA COSTI GENERALI
 * ================================================================ */
Pages.anlRenderIncidenza = async function () {
  const el = document.getElementById('anl-content');
  el.innerHTML = '<p style="color:#64748B;padding:20px;">Caricamento dati...</p>';

  const cgRows = await DB.all('cg_budget');

  if (!cgRows.length) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:#64748B;">Nessun dato nei Costi Generali Budget.</div>';
    return;
  }

  /* Filtra le voci con almeno un valore > 0 */
  const voci = cgRows.map(function (r) {
    const tot = C.MESIK.reduce(function (a, m) { return a + (+r[m] || 0); }, 0);
    return { voce: r.voce || '(senza nome)', totale: tot, dati: r };
  }).filter(function (v) { return v.totale > 0; });

  if (!voci.length) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:#64748B;">Tutte le voci di Costi Generali sono a zero.</div>';
    return;
  }

  Pages._anlVoci = voci;

  const opts = voci.map(function (v, i) {
    return '<option value="' + i + '">' + F.esc(v.voce) + ' — ' + F.money(v.totale) + '</option>';
  }).join('');

  el.innerHTML =
    '<div style="margin-bottom:22px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
      '<label style="font-weight:600;color:#1B4332;font-size:14px;">Voce di costo generale:</label>' +
      '<select id="anl-select-voce" onchange="Pages.anlAggiornaTorta()" style="padding:8px 14px;border:1.5px solid #CBD5E1;border-radius:8px;font-size:14px;font-family:var(--font);color:#334155;background:#fff;cursor:pointer;">' + opts + '</select>' +
    '</div>' +
    '<div id="anl-torta-container"></div>';

  await Pages.anlAggiornaTorta();
};

/* Aggiorna la torta SVG e la sparkline al cambio della voce selezionata */
Pages.anlAggiornaTorta = async function () {
  const sel = document.getElementById('anl-select-voce');
  if (!sel || !Pages._anlVoci) return;

  const idx       = parseInt(sel.value, 10);
  const voce      = Pages._anlVoci[idx];
  const voci      = Pages._anlVoci;
  const totaleCG  = voci.reduce(function (a, v) { return a + v.totale; }, 0);

  const allCosti       = await DB.all('consuntivo_costi');
  const totaleCostiVar = allCosti.reduce(function (a, r) { return a + (+r.importo || 0); }, 0);
  const grandTotal     = totaleCG + totaleCostiVar;

  /* Fette della torta: voce selezionata / altri CG / costi variabili */
  const fette = [
    { label: voce.voce,              valore: voce.totale,            colore: '#F9A825' },
    { label: 'Altri Costi Generali', valore: totaleCG - voce.totale, colore: '#D8F3DC' },
    { label: 'Costi Var. Progetti',  valore: totaleCostiVar,         colore: '#1B4332' },
  ].filter(function (f) { return f.valore > 0; });

  const torta        = Pages._anlTortaSvg(fette, grandTotal);
  const pctVoceSuCG  = totaleCG   > 0 ? (voce.totale / totaleCG)   * 100 : 0;
  const pctVoceSuTot = grandTotal > 0 ? (voce.totale / grandTotal) * 100 : 0;

  /* Sparkline distribuzione mensile della voce selezionata */
  const mesiVals = C.MESIK.map(function (m) { return +(voce.dati[m] || 0); });
  const maxMese  = Math.max.apply(null, mesiVals.concat([1]));
  const spark    = C.MESIK.map(function (m, i) {
    const h = Math.max(2, (mesiVals[i] / maxMese) * 80);
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">' +
      '<div style="width:100%;max-width:40px;height:' + h + 'px;background:#2D6A4F;border-radius:3px 3px 0 0;"></div>' +
      '<div style="font-size:10px;color:#64748B;">' + C.MESIL[i] + '</div>' +
      '<div style="font-size:10px;color:#334155;font-weight:600;">' + (mesiVals[i] ? F.money(mesiVals[i]) : '\u2014') + '</div>' +
    '</div>';
  }).join('');

  const kpiHtml =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:22px;">' +
    F.kpi('Totale voce/anno',   F.money(voce.totale),       null, '') +
    F.kpi('% su CG aziendali',  F.pct(pctVoceSuCG),         null, '') +
    F.kpi('% su tutti i costi', F.pct(pctVoceSuTot),        null, '') +
    F.kpi('Media mensile',      F.money(voce.totale / 12),  null, '') +
    '</div>';

  document.getElementById('anl-torta-container').innerHTML =
    kpiHtml +
    '<div style="display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start;">' +
      '<div style="flex:0 0 auto;">' + torta + '</div>' +
      '<div style="flex:1;min-width:280px;">' +
        '<h3 style="color:#1B4332;font-size:14px;margin-bottom:12px;">Distribuzione mensile \u2014 ' + F.esc(voce.voce) + '</h3>' +
        '<div style="display:flex;gap:6px;align-items:flex-end;height:120px;padding:0 4px;">' + spark + '</div>' +
      '</div>' +
    '</div>';
};

/* ----------------------------------------------------------------
 * Helper — genera la torta SVG con legenda testuale.
 * @param {Array}  fette   - array di {label, valore, colore}
 * @param {number} totale  - valore totale per calcolare le percentuali
 * ---------------------------------------------------------------- */
Pages._anlTortaSvg = function (fette, totale) {
  const cx = 120, cy = 120, r = 100;
  let angolo  = -Math.PI / 2;
  let paths   = '';
  let legenda = '';

  fette.forEach(function (f) {
    if (!f.valore || !totale) return;
    const pct   = f.valore / totale;
    const delta = pct * 2 * Math.PI;
    const x1    = cx + r * Math.cos(angolo);
    const y1    = cy + r * Math.sin(angolo);
    const x2    = cx + r * Math.cos(angolo + delta);
    const y2    = cy + r * Math.sin(angolo + delta);
    const large = delta > Math.PI ? 1 : 0;

    paths +=
      '<path d="M ' + cx + ' ' + cy +
        ' L ' + x1.toFixed(2) + ' ' + y1.toFixed(2) +
        ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2) +
        ' Z" fill="' + f.colore + '" stroke="#fff" stroke-width="2"/>';

    legenda +=
      '<div style="display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:6px;">' +
        '<span style="width:14px;height:14px;background:' + f.colore + ';border-radius:3px;flex-shrink:0;"></span>' +
        '<span style="color:#334155;">' + F.esc(f.label) + '</span>' +
        '<span style="margin-left:auto;font-weight:600;color:#1B4332;">' + F.money(f.valore) + '</span>' +
        '<span style="color:#94A3B8;">(' + F.pct(totale > 0 ? (f.valore / totale) * 100 : 0) + ')</span>' +
      '</div>';

    angolo += delta;
  });

  return '<div style="display:flex;flex-direction:column;gap:14px;">' +
    '<svg width="240" height="240" viewBox="0 0 240 240">' + paths + '</svg>' +
    '<div style="background:#F8FAFC;border-radius:8px;padding:12px 16px;min-width:240px;">' + legenda + '</div>' +
  '</div>';
};
