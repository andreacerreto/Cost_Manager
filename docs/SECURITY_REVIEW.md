# Security Review - Project Cost Manager Offline

Data: 2026-05-11

## Threat Model

L'app e una SPA statica eseguita nel browser. I dati sono salvati nel profilo
browser locale tramite `localStorage`. Non ci sono API remote, ruoli server-side,
tenant remoti o credenziali cloud.

Asset principali:

- dati economici delle commesse;
- anagrafiche clienti/progetti;
- preventivi;
- Excel exports and JSON backups.

Confini di fiducia:

- input manuale dell'utente;
- file JSON/XLSX imported by the user;
- browser/profilo locale dell'utente;
- popup di stampa preventivi.

## Finding Discovery

Superfici controllate:

- script esterni e dipendenze CDN;
- credenziali o URL hardcoded;
- wrapper dati `DB`;
- import/export;
- rendering HTML dinamico;
- popup preventivi.

Esito:

- rimossi script CDN e dipendenza runtime da servizi esterni;
- vendorizzato SheetJS CE localmente per Excel offline;
- rimossi URL, project id e chiavi cloud;
- sostituito backend remoto con storage locale;
- separati export/import Excel e backup/ripristino JSON;
- rinforzato escaping HTML in `F.esc()`;
- rimossi handler inline con valori utente nei punti critici di eliminazione;
- normalizzati gli id numerici nello storage locale;
- impostato `win.opener = null` per il popup preventivo.

## Validation

Verifiche eseguite:

- `node --check` su tutti i file `js/*.js`;
- avvio headless via Chrome su `file:///.../index.html`;
- controllo che non vengano caricati script esterni;
- smoke test `DB.put()` + render anagrafica con input contenente HTML.

Risultato:

- nessun errore sintattico;
- nessun errore console all'avvio;
- overlay login nascosto in modalita offline;
- dashboard attiva;
- nessuno script esterno HTTP/HTTPS;
- input HTML renderizzato come testo, non come markup eseguibile.

## Attack Path Analysis

Non sono rimasti finding reportable ad alta severita nel perimetro offline.

Rischi residui:

- i dati sono protetti solo dal dispositivo/profilo browser dell'utente;
- un backup JSON importato puo sovrascrivere i dati locali dopo conferma;
- se in futuro si reintroducono CDN o backend, va rifatto il threat model.
- mantenere `docs/OPEN_SOURCE_NOTICES.md` nel pacchetto per l'attribuzione SheetJS.

## Raccomandazioni

- Distribuire l'app come cartella statica, includendo tutti gli asset locali.
- Usare export JSON come backup primario.
- Non reintrodurre chiavi, URL progetto o script CDN se l'obiettivo resta offline.
- Per protezione multiutente reale serve un backend con autenticazione e policy.
