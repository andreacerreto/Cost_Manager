'use strict';

/* ============================================================
 * DATABASE.JS - Storage locale offline
 *
 * Mantiene la stessa API usata dalle pagine:
 *   DB.all, DB.byProject, DB.allBulk, DB.put, DB.update,
 *   DB.del, DB.clear, DB.delByProject, DB.insertBatch.
 *
 * I dati sono salvati nel browser via localStorage. Non ci sono
 * chiamate di rete, backend remoti o credenziali hardcoded.
 * ============================================================ */

const DB_STORAGE_KEY = 'project_cost_manager_db_v1';
const LEGACY_DB_STORAGE_KEY = 'gestionale_commesse_offline_db_v1';
const DB_MAX_ROWS_PER_TABLE = 10000;
const _DB_CACHE = {};

function _emptyStore() {
  return Object.keys(TABLE_KEYS).reduce(function (acc, table) {
    acc[table] = [];
    return acc;
  }, {});
}

function _readStore() {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY) || localStorage.getItem(LEGACY_DB_STORAGE_KEY);
    return raw ? _normalizeStore(JSON.parse(raw)) : _emptyStore();
  } catch (err) {
    console.error('Errore lettura storage locale:', err);
    return _emptyStore();
  }
}

function _writeStore(store) {
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(_normalizeStore(store)));
}

function _normalizeStore(rawStore) {
  const clean = _emptyStore();
  if (!rawStore || typeof rawStore !== 'object' || Array.isArray(rawStore)) return clean;

  Object.keys(TABLE_KEYS).forEach(function (table) {
    const rows = rawStore[table];
    if (!Array.isArray(rows)) return;
    clean[table] = rows
      .filter(row => row && typeof row === 'object' && !Array.isArray(row))
      .slice(0, DB_MAX_ROWS_PER_TABLE)
      .map(row => ({ ...row }));
  });

  return clean;
}

function _cloneRows(rows) {
  return JSON.parse(JSON.stringify(rows || []));
}

function _sortRows(table, rows) {
  const key = TABLE_KEYS[table];
  return rows.slice().sort(function (a, b) {
    const av = a?.[key], bv = b?.[key];
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    return String(av ?? '').localeCompare(String(bv ?? ''), 'it');
  });
}

function _nextId(rows) {
  return rows.reduce(function (max, row) {
    return Math.max(max, Number(row.id) || 0);
  }, 0) + 1;
}

function _normalizeRow(table, row, rows) {
  const key = TABLE_KEYS[table];
  const payload = { ...row };
  if (key === 'id') {
    const numericId = Number(payload.id);
    payload.id = Number.isFinite(numericId) && numericId > 0 ? numericId : _nextId(rows);
  }
  return payload;
}

const DB = {
  async all(table) {
    if (_DB_CACHE[table]) return _cloneRows(_DB_CACHE[table]);
    const store = _readStore();
    const rows = _sortRows(table, store[table] || []);
    _DB_CACHE[table] = rows;
    return _cloneRows(rows);
  },

  async byProject(table, codice) {
    const rows = await DB.all(table);
    return rows.filter(row => row.codice === codice);
  },

  async allBulk(tables) {
    const results = await Promise.all(tables.map(table => DB.all(table)));
    return tables.reduce(function (acc, table, index) {
      acc[table] = results[index];
      return acc;
    }, {});
  },

  invalidateCache(table) {
    if (table) {
      delete _DB_CACHE[table];
      return;
    }
    Object.keys(_DB_CACHE).forEach(key => delete _DB_CACHE[key]);
  },

  async put(table, obj) {
    const key = TABLE_KEYS[table];
    if (!key) throw new Error('Tabella non configurata: ' + table);

    const store = _readStore();
    const rows = store[table] || [];
    const payload = _normalizeRow(table, obj, rows);
    const index = rows.findIndex(row => String(row[key]) === String(payload[key]));

    if (index >= 0) rows[index] = { ...rows[index], ...payload };
    else rows.push(payload);

    store[table] = rows;
    _writeStore(store);
    DB.invalidateCache(table);
    return payload;
  },

  async update(table, id, changes) {
    const key = TABLE_KEYS[table];
    if (!key) throw new Error('Tabella non configurata: ' + table);

    const store = _readStore();
    const rows = store[table] || [];
    const index = rows.findIndex(row => String(row[key]) === String(id));
    if (index < 0) throw new Error('Record non trovato in ' + table + ': ' + id);

    rows[index] = { ...rows[index], ...changes, [key]: rows[index][key] };
    store[table] = rows;
    _writeStore(store);
    DB.invalidateCache(table);
  },

  async del(table, value) {
    const key = TABLE_KEYS[table];
    if (!key) throw new Error('Tabella non configurata: ' + table);

    const store = _readStore();
    store[table] = (store[table] || []).filter(row => String(row[key]) !== String(value));
    _writeStore(store);
    DB.invalidateCache(table);
  },

  async clear(table) {
    const store = _readStore();
    store[table] = [];
    _writeStore(store);
    DB.invalidateCache(table);
  },

  async delByProject(table, codice) {
    const store = _readStore();
    store[table] = (store[table] || []).filter(row => row.codice !== codice);
    _writeStore(store);
    DB.invalidateCache(table);
  },

  async insertBatch(table, rows) {
    if (!rows.length) return [];

    const store = _readStore();
    const current = store[table] || [];
    const inserted = [];
    rows.forEach(function (row) {
      const payload = _normalizeRow(table, row, current.concat(inserted));
      inserted.push(payload);
    });
    store[table] = current.concat(inserted);
    _writeStore(store);
    DB.invalidateCache(table);
    return inserted;
  },
};
