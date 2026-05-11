'use strict';

/* ============================================================
 * AUTOSAVE.JS — Engine di salvataggio automatico con debounce.
 * Mostra la save-bar in alto a destra durante e dopo il salvataggio.
 * Uso: AutoSave.schedule('chiave', fnAsync, delayMs)
 * ============================================================ */

const AutoSave = {

  /* Dizionario dei timer attivi — una chiave per ogni sezione */
  timers: {},

  /* Riferimenti DOM alla save-bar */
  bar: document.getElementById('save-bar'),
  lbl: document.getElementById('save-label'),

  /* Pianifica il salvataggio con debounce (default 700ms).
     Se arriva un nuovo evento prima dello scadere, resetta il timer. */
  schedule(key, fn, delay) {
    delay = delay || 700;

    /* Cancella il timer precedente per questa chiave */
    clearTimeout(AutoSave.timers[key]);
    /* Cancella anche il timer che nasconde la bar */
    clearTimeout(AutoSave.timers._hide);

    /* Mostra subito la bar in stato "saving" */
    AutoSave.bar.className = 'saving';
    AutoSave.lbl.textContent = 'Salvataggio\u2026';

    /* Pianifica il salvataggio effettivo */
    AutoSave.timers[key] = setTimeout(async function() {
      try {
        await fn();
        AutoSave.bar.className = 'saved';
        AutoSave.lbl.textContent = 'Salvato \u2713';
      } catch (err) {
        console.error('AutoSave error:', err);
        AutoSave.bar.className = 'saving';
        AutoSave.lbl.textContent = 'Errore salvataggio!';
      }
      /* Nasconde la bar dopo 2.5 secondi */
      AutoSave.timers._hide = setTimeout(function() {
        AutoSave.bar.className = '';
      }, 2500);
    }, delay);
  },
};