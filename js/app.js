'use strict';

/* ============================================================
 * APP.JS — Router principale dell'applicazione.
 * Gestisce la navigazione tra le pagine e lo stato corrente.
 * Va caricato per ULTIMO nel index.html (dopo tutti gli altri JS).
 * ============================================================ */

const App = {

  /* Pagina corrente */
  page: 'dashboard',

  /* Codice progetto selezionato (usato da Budget e Consuntivo) */
  proj: null,

  /* Tab attivo in Costi Generali */
  cgTab: 'budget',

  /* Naviga verso una pagina — aggiorna DOM e chiama il renderer */
  async go(page) {
    /* Rimuove active da tutte le pagine e voci nav */
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('#sidebar nav a').forEach(el => el.classList.remove('active'));

    /* Attiva la pagina e la voce nav corrispondente */
    document.getElementById('page-' + page)?.classList.add('active');
    document.getElementById('nav-'  + page)?.classList.add('active');

    App.page = page;

    /* Chiama il renderer della pagina */
    if (Pages[page]) await Pages[page]();
    if (window.AppSettings) AppSettings.translateDom(document.getElementById('main'));
  },
};
