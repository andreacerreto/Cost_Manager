'use strict';

/* ============================================================
 * VARIANZE.JS — Renderer della pagina Analisi Varianze.
 * Automatic planned vs actual comparison for each project.
 * No manual data entry: everything is calculated from the DB.
 * ============================================================ */

Pages.varianze = async function() {
  const el    = document.getElementById('page-varianze');
  const projs = await DB.all('anagrafica');

  let rp=0, rc=0, cp=0, cc=0, iNp=0, iNc=0;

  /* Righe tabella varianze */
  const rows = await Promise.all(projs.map(async function(p) {
    const b = await totali('budget',     p.codice);
    const e = await totali('consuntivo', p.codice);
    rp+=b.ricavi; rc+=e.ricavi;
    cp+=b.costi;  cc+=e.costi;
    iNp+=b.ivanetta; iNc+=e.ivanetta;

    return '<tr>' +
      '<td><b>' + F.esc(p.codice) + '</b></td>' +
      '<td>' + F.esc(p.nome) + '</td>' +
      /* Costi */
      '<td class="r">' + F.money(b.costi) + '</td>' +
      '<td class="r">' + F.money(e.costi) + '</td>' +
      '<td class="r ' + F.cls(e.costi - b.costi, true) + '">' + F.money(e.costi - b.costi) + '</td>' +
      '<td class="r ' + F.cls(e.costi - b.costi, true) + '">' + F.pct(b.costi ? (e.costi - b.costi) / b.costi * 100 : NaN) + '</td>' +
      /* Ricavi */
      '<td class="r">' + F.money(b.ricavi) + '</td>' +
      '<td class="r">' + F.money(e.ricavi) + '</td>' +
      '<td class="r ' + F.cls(e.ricavi - b.ricavi) + '">' + F.money(e.ricavi - b.ricavi) + '</td>' +
      '<td class="r ' + F.cls(e.ricavi - b.ricavi) + '">' + F.pct(b.ricavi ? (e.ricavi - b.ricavi) / b.ricavi * 100 : NaN) + '</td>' +
      /* Margine */
      '<td class="r">' + F.money(b.margine) + '</td>' +
      '<td class="r">' + F.money(e.margine) + '</td>' +
      '<td class="r ' + F.cls(e.margine - b.margine) + '">' + F.money(e.margine - b.margine) + '</td>' +
      /* Imposta netta */
      '<td class="r iva">' + F.money(b.ivanetta) + '</td>' +
      '<td class="r iva">' + F.money(e.ivanetta) + '</td>' +
    '</tr>';
  }));

  const mp = rp - cp, mc = rc - cc;

  el.innerHTML =
    '<h1>Variance Analysis</h1>' +
    '<p class="subtitle">Automatic planned vs actual comparison. No manual data entry is needed here.</p>' +

    '<div class="tbl-wrap"><table>' +
      '<thead><tr>' +
        '<th>Code</th><th>Name</th>' +
        '<th class="r">Planned Cost</th><th class="r">Actual Cost</th>' +
        '<th class="r">\u0394 Cost</th><th class="r">\u0394%</th>' +
        '<th class="r">Planned Revenue</th><th class="r">Actual Revenue</th>' +
        '<th class="r">\u0394 Revenue</th><th class="r">\u0394%</th>' +
        '<th class="r">Planned Margin</th><th class="r">Actual Margin</th>' +
        '<th class="r">\u0394 Margin</th>' +
        '<th class="r iva">' + F.esc(F.taxLabel()) + ' Net B.</th><th class="r iva">' + F.esc(F.taxLabel()) + ' Net A.</th>' +
      '</tr></thead>' +

      '<tbody>' + rows.join('') + '</tbody>' +

      '<tfoot><tr>' +
        '<td colspan="2"><b>TOTALS</b></td>' +
        '<td class="r">' + F.money(cp) + '</td>' +
        '<td class="r">' + F.money(cc) + '</td>' +
        '<td class="r ' + F.cls(cc - cp, true) + '">' + F.money(cc - cp) + '</td>' +
        '<td></td>' +
        '<td class="r">' + F.money(rp) + '</td>' +
        '<td class="r">' + F.money(rc) + '</td>' +
        '<td class="r ' + F.cls(rc - rp) + '">' + F.money(rc - rp) + '</td>' +
        '<td></td>' +
        '<td class="r">' + F.money(mp) + '</td>' +
        '<td class="r">' + F.money(mc) + '</td>' +
        '<td class="r ' + F.cls(mc - mp) + '">' + F.money(mc - mp) + '</td>' +
        '<td class="r">' + F.money(iNp) + '</td>' +
        '<td class="r">' + F.money(iNc) + '</td>' +
      '</tr></tfoot>' +
    '</table></div>';
};
