'use strict';
/**
 * Pehelysúlyú JSON-fájl alapú adattár.
 * Nem igényel adatbázis-szervert, így a projekt azonnal futtatható.
 * Nagyobb forgalom esetén ez a modul cserélhető PostgreSQL/MySQL rétegre –
 * az API-ja (users.*, orders.*) változatlanul hagyható.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

function file(name) {
  return path.join(DATA_DIR, name + '.json');
}

function readAll(name) {
  const f = file(name);
  try {
    if (!fs.existsSync(f)) return [];
    const raw = fs.readFileSync(f, 'utf8').trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`[db] Nem olvasható: ${name}.json –`, e.message);
    return [];
  }
}

/* atomi írás: temp fájl + rename, hogy félbeszakadás esetén se sérüljön az adat */
function writeAll(name, rows) {
  const f = file(name);
  const tmp = f + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2), 'utf8');
  fs.renameSync(tmp, f);
}

/* egyszerű írási sorosítás, hogy párhuzamos kérések ne írjanak egymásra */
const queues = new Map();
function withLock(name, fn) {
  const prev = queues.get(name) || Promise.resolve();
  const next = prev.then(fn, fn);
  queues.set(name, next.catch(() => {}));
  return next;
}

function collection(name) {
  return {
    all: () => readAll(name),
    find: pred => readAll(name).find(pred) || null,
    filter: pred => readAll(name).filter(pred),
    insert: row => withLock(name, () => {
      const rows = readAll(name);
      rows.push(row);
      writeAll(name, rows);
      return row;
    }),
    update: (pred, patch) => withLock(name, () => {
      const rows = readAll(name);
      const i = rows.findIndex(pred);
      if (i === -1) return null;
      rows[i] = typeof patch === 'function' ? patch(rows[i]) : { ...rows[i], ...patch };
      writeAll(name, rows);
      return rows[i];
    }),
    remove: pred => withLock(name, () => {
      const rows = readAll(name).filter(r => !pred(r));
      writeAll(name, rows);
    })
  };
}

module.exports = {
  DATA_DIR,
  users: collection('users'),
  requests: collection('requests'),
  orders: collection('orders'),
  sessions: collection('sessions')
};
