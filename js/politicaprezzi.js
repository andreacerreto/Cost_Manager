'use strict';

/* ============================================================
 * POLITICAPREZZI.JS — Schermata "Impostazioni Preventivi"
 *
 * Permette all'imprenditore di definire:
 *   1. Dati aziendali (nome, indirizzo, CAP, tel, email, P.IVA)
 *      usati nell'intestazione dei PDF preventivo.
 *   2. Overhead% teorico + Profit% desiderato (a livello aziendale)
 *   3. Markup% per ogni categoria di costo (Manodopera, Materiali…)
 *
 * I valori vengono salvati in storage locale (tabella politica_prezzi)
 * e usati come pre-compilazione automatica nel modulo Preventivi.
 * ============================================================ */


/* ------------------------------------------------------------
 * Entry point — chiamato da App.go('politicaprezzi')
 * Invalida la cache prima di caricare per garantire dati freschi
 * dopo un eventuale salvataggio precedente.
 * ------------------------------------------------------------ */
Pages.politicaprezzi = async function () {
  const el = document.getElementById('page-politicaprezzi');
  el.innerHTML = '<p style="padding:32px;color:#64748B;">Loading...</p>';

  /* Forza ricarica da storage locale — evita che la cache mostri dati vecchi */
  DB.invalidateCache('politica_prezzi');

  /* Carica politica salvata; se non esiste usa i default da config.js */
  const rows = await DB.all('politica_prezzi');
  const pol  = rows[0] ?? {};
  const appCompany = AppSettings.get().company;

  /* Helper: legge valore da politica salvata o da MARKUP_DEFAULT */
  const val = (key) => pol[key] ?? C.MARKUP_DEFAULT[key] ?? 0;

  /* Helper: legge valore stringa da politica salvata (dati azienda) */
  const valStr = (key, def) => pol[key] ?? def ?? '';
  const sampleStr = function (key, def) {
    const value = valStr(key, def);
    const samples = {
      'Azienda S.r.l.': 'Greenfield Services LLC',
      'Via Roma, 1 — 00100 Roma (RM)': '123 Market St, Austin, TX',
      '00100': '78701',
      '06 12345678': '(512) 555-0184',
      'info@azienda.it': 'billing@greenfield.com',
      '12345678901': '12-3456789',
    };
    return samples[value] || value;
  };

  /* Costruisce le righe della tabella markup per ogni categoria */
  const catRows = C.CATC.map(function (cat) {
    const dbKey  = 'markup_' + cat.toLowerCase(); /* es. markup_manodopera */
    const mkup   = val(dbKey);
    const margin = Pages._markupToMargin(mkup);
    return (
      '<tr data-cat="' + cat + '">' +
        '<td style="font-weight:600;">' + cat + '</td>' +
        '<td>' +
          '<input type="number" class="pp-markup" data-key="' + dbKey + '"' +
          '  value="' + mkup + '" min="0" max="200" step="0.5"' +
          '  style="width:80px;" oninput="Pages._ppUpdateRow(this)">' +
          ' %' +
        '</td>' +
        '<td class="pp-margin r" style="color:#64748B;font-size:13px;">' +
          F.pct(margin) +
        '</td>' +
        '<td class="pp-badge">' + Pages._markupBadge(mkup, val('overhead_pct') + val('profit_pct')) + '</td>' +
      '</tr>'
    );
  }).join('');

  /* Markup minimo suggerito calcolato dagli obiettivi aziendali */
  const margineTarget = val('overhead_pct') + val('profit_pct');
  const markupSugg    = Pages._marginToMarkup(margineTarget);

  /* ---- Render HTML completo ---- */
  el.innerHTML =
    '<h1>Pricing Settings</h1>' +

    /* =========================================================
     * SEZIONE 0: Dati Aziendali
     * I dati qui inseriti vengono usati nell’intestazione PDF.
     * ========================================================= */
    '<div class="sec">Company Details</div>' +
    '<p style="color:#64748B;font-size:13px;margin:0 0 14px;">' +
      'These details appear in the header of each printed quote / PDF.' +
    '</p>' +
    '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;' +
         'padding:22px 28px;max-width:620px;margin-bottom:32px;">' +

      /* Riga 1: nome azienda (campo largo) */
      '<div style="margin-bottom:16px;">' +
        '<label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">Company Name</label>' +
        '<input id="pp-az-nome" type="text" style="width:100%;" placeholder="Example: Greenfield Services LLC"' +
        '  value="' + F.esc(sampleStr('azienda_nome', appCompany.name || 'Greenfield Services LLC')) + '">' +
      '</div>' +

      /* Riga 2: indirizzo + CAP affiancati */
      '<div style="display:grid;grid-template-columns:2fr 1fr;gap:14px;margin-bottom:16px;">' +
        '<div>' +
          '<label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">Address (street, city)</label>' +
          '<input id="pp-az-indirizzo" type="text" style="width:100%;" placeholder="Example: 123 Market St, Austin, TX"' +
          '  value="' + F.esc(sampleStr('azienda_indirizzo', appCompany.address)) + '">' +
        '</div>' +
        '<div>' +
          '<label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">ZIP code</label>' +
          '<input id="pp-az-cap" type="text" style="width:100%;" placeholder="Example: 78701" maxlength="10"' +
          '  value="' + F.esc(sampleStr('azienda_cap', appCompany.postal_code)) + '">' +
        '</div>' +
      '</div>' +

      /* Riga 3: telefono + email affiancati */
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;">' +
        '<div>' +
          '<label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">Phone</label>' +
          '<input id="pp-az-tel" type="tel" style="width:100%;" placeholder="Example: (512) 555-0184"' +
          '  value="' + F.esc(sampleStr('azienda_tel', appCompany.phone)) + '">' +
        '</div>' +
        '<div>' +
          '<label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">Email</label>' +
          '<input id="pp-az-email" type="email" style="width:100%;" placeholder="Example: billing@greenfield.com"' +
          '  value="' + F.esc(sampleStr('azienda_email', appCompany.email)) + '">' +
        '</div>' +
      '</div>' +

      /* Riga 4: partita IVA */
      '<div>' +
        '<label style="display:block;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;">Tax ID</label>' +
        '<input id="pp-az-piva" type="text" style="width:200px;" placeholder="Example: 12-3456789" maxlength="20"' +
        '  value="' + F.esc(sampleStr('azienda_piva', appCompany.tax_id)) + '">' +
      '</div>' +

    '</div>' +

    /* =========================================================
     * SEZIONE 1: Obiettivi Aziendali (overhead + profit)
     * ========================================================= */
    '<div class="sec">Company Targets</div>' +
    '<div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;' +
         'padding:22px 28px;max-width:620px;margin-bottom:28px;">' +

      '<p style="color:#64748B;font-size:13px;margin:0 0 20px;">' +
        'Set your estimated overheads and target profit. ' +
        'The app automatically calculates the <b>recommended minimum markup</b> that ' +
        'each quote should meet to cover expenses and profit.' +
      '</p>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px;">' +

        /* Campo overhead% */
        '<div>' +
          '<label style="display:block;font-size:12px;font-weight:700;color:#374151;' +
                  'margin-bottom:6px;">Estimated overheads<br>' +
            '<span style="font-weight:400;color:#64748B;">(% of annual revenue)</span></label>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<input id="pp-overhead" type="number" min="0" max="80" step="0.5"' +
            '  value="' + val('overhead_pct') + '"' +
            '  style="width:80px;" oninput="Pages._ppUpdateSuggested()">' +
            '<span style="color:#374151;">%</span>' +
          '</div>' +
        '</div>' +

        /* Campo profit% */
        '<div>' +
          '<label style="display:block;font-size:12px;font-weight:700;color:#374151;' +
                  'margin-bottom:6px;">Target profit<br>' +
            '<span style="font-weight:400;color:#64748B;">(% of revenue)</span></label>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<input id="pp-profit" type="number" min="0" max="60" step="0.5"' +
            '  value="' + val('profit_pct') + '"' +
            '  style="width:80px;" oninput="Pages._ppUpdateSuggested()">' +
            '<span style="color:#374151;">%</span>' +
          '</div>' +
        '</div>' +

      '</div>' +

      /* Box markup suggerito (si aggiorna live) */
      '<div id="pp-sugg-box" style="' +
        'background:#D8F3DC;border:1.5px solid #52B788;border-radius:8px;' +
        'padding:12px 18px;display:flex;align-items:center;justify-content:space-between;">' +
        '<span style="font-size:13px;color:#1B4332;font-weight:600;">' +
          'Recommended minimum markup (covers overheads + profit):' +
        '</span>' +
        '<span id="pp-sugg-val" style="font-size:20px;font-weight:800;color:#1B4332;">' +
          F.pct(markupSugg) +
        '</span>' +
      '</div>' +

    '</div>' +

    /* =========================================================
     * SEZIONE 2: Markup per categoria di costo
     * ========================================================= */
    '<div class="sec">Markup by Cost Category</div>' +
    '<p style="color:#64748B;font-size:13px;margin:0 0 14px;">' +
      'Set the percentage to add to direct costs for each category. ' +
      'You can still adjust it line by line when creating a quote.' +
    '</p>' +
    '<div class="tbl-wrap" style="max-width:620px;">' +
    '<table>' +
      '<thead><tr>' +
        '<th>Category</th>' +
        '<th>Markup %</th>' +
        '<th class="r">Equivalent margin</th>' +
        '<th>Status</th>' +
      '</tr></thead>' +
      '<tbody id="pp-cat-tbody">' + catRows + '</tbody>' +
    '</table>' +
    '</div>' +

    /* Pulsante applica suggeriti */
    '<button class="btn-add" style="margin-top:10px;"' +
    '  onclick="Pages._ppApplySuggested()">' +
    '  Apply recommended markup to all categories' +
    '</button>' +

    /* Pulsante salva unico per tutte le sezioni */
    '<div style="margin-top:28px;">' +
      '<button onclick="Pages._ppSave()" style="' +
        'padding:12px 32px;background:#1B4332;color:#fff;border:none;' +
        'border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;' +
        'font-family:var(--font);transition:background .2s;"' +
        'onmouseover="this.style.background=\'#2D6A4F\'"' +
        'onmouseout="this.style.background=\'#1B4332\'">' +
        'Save Pricing Settings' +
      '</button>' +
      '<span id="pp-save-msg" style="margin-left:16px;font-size:13px;color:#2E7D32;' +
            'display:none;font-weight:600;"></span>' +
    '</div>';
};


/* ------------------------------------------------------------
 * Recalculates the recommended minimum markup box live.
 * ------------------------------------------------------------ */
Pages._ppUpdateSuggested = function () {
  const overhead = +document.getElementById('pp-overhead').value || 0;
  const profit   = +document.getElementById('pp-profit').value   || 0;
  const sugg     = Pages._marginToMarkup(overhead + profit);
  document.getElementById('pp-sugg-val').textContent = F.pct(sugg);

  document.querySelectorAll('#pp-cat-tbody tr').forEach(function (tr) {
    const inp  = tr.querySelector('.pp-markup');
    const bdg  = tr.querySelector('.pp-badge');
    if (inp && bdg) {
      bdg.innerHTML = Pages._markupBadge(+inp.value, overhead + profit);
    }
  });
};


/* ------------------------------------------------------------
 * Aggiorna margine equivalente e badge di una singola riga
 * ------------------------------------------------------------ */
Pages._ppUpdateRow = function (inputEl) {
  const tr       = inputEl.closest('tr');
  const mkup     = +inputEl.value || 0;
  const overhead = +document.getElementById('pp-overhead').value || 0;
  const profit   = +document.getElementById('pp-profit').value   || 0;

  const marginEl = tr.querySelector('.pp-margin');
  if (marginEl) marginEl.textContent = F.pct(Pages._markupToMargin(mkup));

  const bdgEl = tr.querySelector('.pp-badge');
  if (bdgEl) bdgEl.innerHTML = Pages._markupBadge(mkup, overhead + profit);
};


/* ------------------------------------------------------------
 * Applica il markup consigliato a tutte le categorie
 * ------------------------------------------------------------ */
Pages._ppApplySuggested = function () {
  const overhead = +document.getElementById('pp-overhead').value || 0;
  const profit   = +document.getElementById('pp-profit').value   || 0;
  const sugg     = Pages._marginToMarkup(overhead + profit);

  document.querySelectorAll('#pp-cat-tbody .pp-markup').forEach(function (inp) {
    inp.value = sugg.toFixed(1);
    Pages._ppUpdateRow(inp);
  });
};


/* ------------------------------------------------------------
 * Salva tutte le impostazioni su storage locale:
 *   - dati aziendali (azienda_nome, azienda_indirizzo, …)
 *   - overhead_pct e profit_pct
 *   - markup per categoria
 *
 * Logica salvataggio:
 *   - riga esistente → DB.update(id, changes)
 *     Usa .update().eq() che NON include id nel payload,
 *     compatibile con colonne GENERATED ALWAYS AS IDENTITY.
 *   - prima volta    → DB.insertBatch() (inserimento)
 * ------------------------------------------------------------ */
Pages._ppSave = async function () {

  /* --- Raccoglie dati aziendali --- */
  const gv = (id) => (document.getElementById(id)?.value ?? '').trim();

  const data = {
    /* Dati azienda — usati nel template PDF */
    azienda_nome:      gv('pp-az-nome'),
    azienda_indirizzo: gv('pp-az-indirizzo'),
    azienda_cap:       gv('pp-az-cap'),
    azienda_tel:       gv('pp-az-tel'),
    azienda_email:     gv('pp-az-email'),
    azienda_piva:      gv('pp-az-piva'),

    /* Obiettivi aziendali */
    overhead_pct: +document.getElementById('pp-overhead').value || 0,
    profit_pct:   +document.getElementById('pp-profit').value   || 0,

    updated_at: new Date().toISOString(),
  };

  /* --- Raccoglie i markup per categoria --- */
  document.querySelectorAll('#pp-cat-tbody .pp-markup').forEach(function (inp) {
    data[inp.dataset.key] = +inp.value || 0;
  });

  /* --- Carica riga esistente (forza fresh da DB, bypassa cache) --- */
  DB.invalidateCache('politica_prezzi');
  const existing = await DB.all('politica_prezzi');

  /* --- Salva: update se esiste, insert se prima volta --- */
  try {
    if (existing.length > 0) {
      /*
       * FIX: usa DB.update(table, id, changes) invece di DB.put().
       * DB.update esegue .update(changes).eq('id', id): l'id viene
       * usato solo nel WHERE e mai nel payload, evitando l'errore
       * "cannot insert a non-DEFAULT value into column id" che si
       * verifica con colonne GENERATED ALWAYS AS IDENTITY.
       */
      await DB.update('politica_prezzi', existing[0].id, data);
    } else {
      /* Prima volta: inserisce la riga — id generato automaticamente da storage locale */
      await DB.insertBatch('politica_prezzi', [data]);
    }
  } catch (err) {
    /* Mostra l'errore reale per il debug */
    const prefix = AppSettings.get().language === 'it' ? 'Errore salvataggio: ' : 'Save error: ';
    alert(prefix + (err.message || JSON.stringify(err)));
    return;
  }

  /* Invalida cache così il prossimo DB.all('politica_prezzi') legge da storage locale */
  DB.invalidateCache('politica_prezzi');
  AppSettings.update({
    company: {
      name: data.azienda_nome,
      address: data.azienda_indirizzo,
      postal_code: data.azienda_cap,
      phone: data.azienda_tel,
      email: data.azienda_email,
      tax_id: data.azienda_piva,
    },
  });

  /* Feedback visivo */
  const msg = document.getElementById('pp-save-msg');
  msg.textContent = AppSettings.get().language === 'it' ? 'Salvato' : 'Saved';
  msg.style.display = 'inline';
  setTimeout(function () { msg.style.display = 'none'; }, 3000);
};


/* ============================================================
 * UTILITY MATEMATICHE — condivise con preventivi.js
 * ============================================================ */

/**
 * Converte markup% in margine%
 * Es. markup 40% → margine 28.6%
 * Formula: margin = markup / (1 + markup/100)
 */
Pages._markupToMargin = function (markup) {
  if (!markup || markup <= 0) return 0;
  return (markup / (1 + markup / 100));
};

/**
 * Converte margine% in markup%
 * Es. margine 30% → markup 42.86%
 * Formula: markup = margin / (1 - margin/100)
 */
Pages._marginToMarkup = function (margin) {
  if (!margin || margin <= 0) return 0;
  if (margin >= 100) return 999;
  return (margin / (1 - margin / 100));
};

/**
 * Badge semaforo: verde/giallo/rosso in base al markup vs obiettivo.
 */
Pages._markupBadge = function (markup, margineTarget) {
  const sugg = Pages._marginToMarkup(margineTarget);
  let color, label;

  if (sugg <= 0) {
    color = '#64748B'; label = '— nessun obiettivo';
  } else if (markup >= sugg) {
    color = '#2E7D32'; label = '✔ Sopra obiettivo';
  } else if (markup >= sugg * 0.8) {
    color = '#F9A825'; label = '⚠ Vicino al limite';
  } else {
    color = '#C62828'; label = 'Below target';
  }

  return '<span style="display:inline-block;padding:3px 10px;border-radius:20px;' +
    'background:' + color + '20;color:' + color + ';font-size:11px;font-weight:700;">' +
    label + '</span>';
};
