'use strict';

/* ============================================================
 * DASHBOARD.JS — Renderer della pagina Dashboard.
 *
 * OTTIMIZZAZIONI v2 (branch dev_ottimizzazione):
 *   Prima: N progetti × 4 tabelle = N*4 query HTTP a storage locale.
 *   Dopo:  1 chiamata DB.allBulk() carica le 4 tabelle una volta
 *          sola, poi tutti i calcoli avvengono in memoria (JS).
 *          Per 50 progetti: da ~200 query → 6 query totali.
 *
 *          Le 6 query parallele al caricamento sono:
 *            1. anagrafica
 *            2. budget_costi
 *            3. budget_ricavi
 *            4. consuntivo_costi
 *            5. consuntivo_ricavi
 *            6. cg_budget + cg_consuntivo (Promise.all separato)
 * ============================================================ */

var Pages = window.Pages || {};
window.Pages = Pages;

/* ------------------------------------------------------------
 * Stato interno del filtro attivo.
 * '' = tutti i progetti (nessun filtro applicato)
 * ------------------------------------------------------------ */
Pages._dashboardFiltroStato = '';

/* ------------------------------------------------------------
 * Funzione principale — carica dati e renderizza la Dashboard.
 * ------------------------------------------------------------ */
Pages.dashboard = async function () {
  const el = document.getElementById('page-dashboard');
  el.innerHTML = '<p class="subtitle">Loading...</p>';

  /* ----------------------------------------------------------
   * STEP 1 — Carica in parallelo:
   *   - anagrafica (lista progetti)
   *   - le 4 tabelle di dettaglio economico (bulk)
   *   - i 2 totali costi generali
   *
   * DB.allBulk usa DB.all internamente → beneficia della cache.
   * Totale: 7 query HTTP invece di N*4+2 della versione precedente.
   * ---------------------------------------------------------- */
  const [
    projs,
    bulk,
    cgArr,
  ] = await Promise.all([
    DB.all('anagrafica'),
    DB.allBulk([
      'budget_costi',
      'budget_ricavi',
      'consuntivo_costi',
      'consuntivo_ricavi',
    ]),
    Promise.all(['cg_budget', 'cg_consuntivo'].map(async function (s) {
      return (await DB.all(s)).reduce(function (a, r) {
        return a + C.MESIK.reduce(function (sum, m) { return sum + (+r[m] || 0); }, 0);
      }, 0);
    })),
  ]);

  const cgB = cgArr[0];
  const cgC = cgArr[1];

  /* ----------------------------------------------------------
   * STEP 2 — Calcola i totali di ogni progetto in memoria.
   * totali() riceve `bulk` → usa il FAST PATH (nessuna query).
   * Promise.all mantiene il parallelismo per i calcoli JS.
   * ---------------------------------------------------------- */
  let rp=0, rc=0, cp=0, cc=0, iNp=0, iNc=0, iRp=0, iRc=0, iCp=0, iCc=0;

  const projRows = await Promise.all(projs.map(async function (p) {
    /* Passa `bulk` → totali() filtra in JS, zero query HTTP */
    const b = await totali('budget',     p.codice, bulk);
    const e = await totali('consuntivo', p.codice, bulk);

    /* Accumula i totali globali per le KPI card */
    rp+=b.ricavi; rc+=e.ricavi; cp+=b.costi; cc+=e.costi;
    iNp+=b.taxNet; iNc+=e.taxNet;
    iRp+=b.taxRevenue; iRc+=e.taxRevenue;
    iCp+=b.taxCosts;  iCc+=e.taxCosts;

    /* Calcola percentuale margine per la barra progresso */
    const pctM = e.ricavi ? e.margine / e.ricavi * 100 : NaN;
    const bar  = Math.min(Math.max(isNaN(pctM) ? 0 : pctM, 0), 100);

    /* Mappa stato → classe CSS badge */
    const badge = {
      'Completed':   'badge-completato',
      'In progress': 'badge-in-corso',
      'Planned':     'badge-pianificato',
      'On hold':     'badge-sospeso',
    }[p.stato] || 'badge-pianificato';

    /* Riga HTML con data-stato per il filtro client-side */
    return '<tr data-stato="' + F.esc(p.stato) + '">' +
      '<td><b>' + F.esc(p.codice) + '</b></td>' +
      '<td>' + F.esc(p.nome) + '</td>' +
      '<td>' + F.esc(p.cliente) + '</td>' +
      '<td><span class="stato-badge ' + badge + '">' + F.esc(p.stato) + '</span></td>' +
      '<td class="r">' + F.money(e.margine) + '</td>' +
      '<td><div style="display:flex;align-items:center;gap:8px;">' +
        '<div class="pct-bar" style="flex:1;">' +
          '<div class="pct-fill-amber" style="width:' + Math.min(bar, 70) + '%;"></div>' +
          '<div class="pct-fill-green" style="width:' + Math.max(bar - 70, 0) + '%;"></div>' +
        '</div>' +
        '<span style="font-size:11px;color:var(--text-muted);">' +
          (isNaN(pctM) ? '\u2014' : F.pct(pctM)) +
        '</span>' +
      '</div></td>' +
    '</tr>';
  }));

  const mp = rp - cp;
  const mc = rc - cc;

  /* ----------------------------------------------------------
   * Helper: genera un icon-box colorato per le KPI card.
   * ---------------------------------------------------------- */
  function icon(bg, path) {
    return '<div style="width:40px;height:40px;background:' + bg + ';border-radius:8px;' +
      'display:flex;align-items:center;justify-content:center;margin-bottom:10px;">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg></div>';
  }

  /* SVG paths delle icone KPI */
  const iEuro  = '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>';
  const iCosto = '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>';
  const iTrend = '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>';
  const iTax   = '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>';

  /* Helper: KPI card con icon-box */
  function kcard(cls, bg, ico, label, val, delta) {
    return '<div class="card ' + cls + '">' + icon(bg, ico) +
      '<div class="label">' + label + '</div>' +
      '<div class="value">' + val + '</div>' +
      '<div class="delta">' + delta + '</div></div>';
  }

  /* Alert imposta dinamico */
  const taxAlert = iNc > 0
    ? '<div class="alert warn">' + F.esc(F.taxLabel()) + ' payable estimate <b>' + F.money(iNc) + '</b>.</div>'
    : iNc < 0
    ? '<div class="alert success">' + F.esc(F.taxLabel()) + ' credit estimate <b>' + F.money(Math.abs(iNc)) + '</b></div>'
    : '';

  /* ----------------------------------------------------------
   * STEP 3 — Costruzione HTML
   * ---------------------------------------------------------- */
  let h = '<h1>Dashboard</h1>';
  h += '<p class="subtitle">Real-time overview · ' +
    projs.length + ' project' + (projs.length === 1 ? '' : 's') + ' total</p>';

  h += '<div class="sec">Economic KPIs</div><div class="kpi-grid">';
  h += kcard('',                               '#F9A825',                      iEuro,  'Total Revenue',   F.money(rc), '\u25b2 Planned ' + F.money(rp));
  h += kcard('c-red',                          '#EF5350',                      iCosto, 'Total Costs',     F.money(cc), '\u25b2 Planned ' + F.money(cp));
  h += kcard(mc < 0 ? 'c-red' : 'c-margin',   mc < 0 ? '#EF5350' : '#1B4332', iTrend, 'Gross Margin',   F.money(mc), (mc >= 0 ? '\u25b2' : '\u25bc') + ' Planned ' + F.money(mp));
  h += kcard('c-grey',                         '#37474F',                      iTax,   F.taxLabel() + ' Net', F.money(iNc), (iNc >= 0 ? '\u25b2' : '\u25bc') + ' Planned ' + F.money(iNp));
  h += kcard('c-blue',                         '#1565C0',                      iEuro,  'Actual Margin %', F.pct(rc ? mc / rc * 100 : NaN), 'Planned ' + F.pct(rp ? mp / rp * 100 : NaN));
  h += kcard('c-grey',                         '#546E7A',                      iCosto, 'Overheads Planned / Actual', F.money(cgC), 'Planned ' + F.money(cgB));
  h += '</div>';

  h += '<div class="tax-hdr">' + F.esc(F.taxLabel()) + ' \u2014 Company Summary</div><div class="kpi-grid">';
  h += F.kpi(F.taxLabel() + ' Revenue Budget', F.money(iRp), '', 'c-grey');
  h += F.kpi(F.taxLabel() + ' Revenue Actual', F.money(iRc), '', 'c-grey');
  h += F.kpi(F.taxLabel() + ' Costs Budget',  F.money(iCp), '', 'c-grey');
  h += F.kpi(F.taxLabel() + ' Costs Actual',   F.money(iCc), '', 'c-grey');
  h += F.kpi(F.taxLabel() + ' Net Budget',  F.money(iNp), '', 'c-grey');
  h += F.kpi(F.taxLabel() + ' Net Actual',   F.money(iNc), '', iNc > 500 ? 'c-red' : 'c-grey');
  h += '</div>';

  h += taxAlert;

  /* ----------------------------------------------------------
   * Sezione tabella con filtri per stato.
   * ---------------------------------------------------------- */
  h += '<div class="sec">Project Status</div>';

  if (projRows.length) {
    /* Calcola contatori per i pill filtro */
    const contatori = { '': projs.length };
    C.STATI.forEach(function (s) {
      contatori[s] = projs.filter(function (p) { return p.stato === s; }).length;
    });

    h += '<div class="dash-filtri" id="dash-filtri-bar">';
    h += _dashPill('', 'All', contatori[''], Pages._dashboardFiltroStato);
    C.STATI.forEach(function (s) {
      if (contatori[s] > 0) h += _dashPill(s, s, contatori[s], Pages._dashboardFiltroStato);
    });
    h += '</div>';

    h += '<div id="dash-tbl-wrap" class="tbl-wrap"><table id="dash-tabella-progetti">' +
      '<thead><tr><th>Code</th><th>Project Name</th><th>Customer</th>' +
      '<th>Status</th><th class="r">Actual Margin</th><th>Margin %</th></tr></thead>' +
      '<tbody>' + projRows.join('') + '</tbody></table></div>';

    h += '<div id="dash-count-label" class="dash-count-lbl"></div>';

  } else {
    h += '<div class="alert info">No projects yet. Add one in <b>Projects</b>.</div>';
  }

  el.innerHTML = h;

  /* Ripristina il filtro attivo alla navigazione */
  dashFiltroApplica(Pages._dashboardFiltroStato);
};

/* ------------------------------------------------------------
 * _dashPill — markup HTML di un singolo pill filtro.
 * ------------------------------------------------------------ */
function _dashPill(stato, etichetta, contatore, attivo) {
  const isAttivo = stato === attivo;
  return '<button ' +
    'class="dash-fil-pill' + (isAttivo ? ' dash-fil-active' : '') + '" ' +
    'onclick="dashFiltroApplica(\'' + stato.replace(/'/g, "\\'") + '\')">' +
    etichetta +
    '<span class="dash-fil-count">' + contatore + '</span>' +
    '</button>';
}

/* ------------------------------------------------------------
 * dashFiltroApplica — filtra le righe per stato e aggiorna
 * i pill e il contatore visibile.
 * ------------------------------------------------------------ */
function dashFiltroApplica(stato) {
  Pages._dashboardFiltroStato = stato;

  const tabella = document.getElementById('dash-tabella-progetti');
  if (!tabella) return;

  const righe = tabella.querySelectorAll('tbody tr');
  let visibili = 0;

  righe.forEach(function (riga) {
    const statoRiga = riga.getAttribute('data-stato') || '';
    const mostra = stato === '' || statoRiga === stato;
    riga.style.display = mostra ? '' : 'none';
    if (mostra) visibili++;
  });

  /* Aggiorna stile pill attivo */
  const barFiltri = document.getElementById('dash-filtri-bar');
  if (barFiltri) {
    barFiltri.querySelectorAll('.dash-fil-pill').forEach(function (pill) {
      pill.classList.remove('dash-fil-active');
      const onc = pill.getAttribute('onclick') || '';
      const match = onc.match(/dashFiltroApplica\('(.*)'\)/);
      if (match && match[1] === stato) pill.classList.add('dash-fil-active');
    });
  }

  /* Aggiorna label contatore */
  const lbl = document.getElementById('dash-count-label');
  if (lbl) {
    lbl.textContent = stato === ''
      ? visibili + ' project' + (visibili === 1 ? '' : 's') + ' total'
      : visibili + ' project' + (visibili === 1 ? '' : 's') + ' with status "' + stato + '"';
  }
}
