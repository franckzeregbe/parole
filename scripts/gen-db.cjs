const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DATA = require('../src/data/bible-complete.json');
const DB_PATH = path.join(__dirname, '..', 'assets', 'bible.db');

if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE books (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    testament TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    all_chapters INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id TEXT NOT NULL REFERENCES books(id),
    chapter_number INTEGER NOT NULL,
    sub TEXT,
    UNIQUE(book_id, chapter_number)
  );
  CREATE TABLE version_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version_id TEXT NOT NULL,
    book_id TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    verse_text TEXT NOT NULL,
    UNIQUE(version_id, book_id, chapter_number, verse_number)
  );
  CREATE TABLE meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_vv_lookup ON version_verses(version_id, book_id, chapter_number, verse_number);
`);

const BOOKS = {
  gen: { name: 'Genèse', testament: 'Ancien' },
  ex: { name: 'Exode', testament: 'Ancien' },
  lev: { name: 'Lévitique', testament: 'Ancien' },
  num: { name: 'Nombres', testament: 'Ancien' },
  deu: { name: 'Deutéronome', testament: 'Ancien' },
  jos: { name: 'Josué', testament: 'Ancien' },
  jug: { name: 'Juges', testament: 'Ancien' },
  rut: { name: 'Ruth', testament: 'Ancien' },
  '1sa': { name: '1 Samuel', testament: 'Ancien' },
  '2sa': { name: '2 Samuel', testament: 'Ancien' },
  '1ro': { name: '1 Rois', testament: 'Ancien' },
  '2ro': { name: '2 Rois', testament: 'Ancien' },
  '1ch': { name: '1 Chroniques', testament: 'Ancien' },
  '2ch': { name: '2 Chroniques', testament: 'Ancien' },
  ezd: { name: 'Esdras', testament: 'Ancien' },
  neh: { name: 'Néhémie', testament: 'Ancien' },
  est: { name: 'Esther', testament: 'Ancien' },
  job: { name: 'Job', testament: 'Ancien' },
  ps: { name: 'Psaumes', testament: 'Ancien' },
  pro: { name: 'Proverbes', testament: 'Ancien' },
  ecc: { name: 'Ecclésiaste', testament: 'Ancien' },
  cant: { name: 'Cantique des Cantiques', testament: 'Ancien' },
  esa: { name: 'Ésaïe', testament: 'Ancien' },
  jer: { name: 'Jérémie', testament: 'Ancien' },
  la: { name: 'Lamentations', testament: 'Ancien' },
  eze: { name: 'Ézéchiel', testament: 'Ancien' },
  dan: { name: 'Daniel', testament: 'Ancien' },
  hos: { name: 'Osée', testament: 'Ancien' },
  joe: { name: 'Joël', testament: 'Ancien' },
  am: { name: 'Amos', testament: 'Ancien' },
  abd: { name: 'Abdias', testament: 'Ancien' },
  jon: { name: 'Jonas', testament: 'Ancien' },
  mi: { name: 'Michée', testament: 'Ancien' },
  nah: { name: 'Nahum', testament: 'Ancien' },
  hab: { name: 'Habacuc', testament: 'Ancien' },
  soph: { name: 'Sophonie', testament: 'Ancien' },
  agg: { name: 'Aggée', testament: 'Ancien' },
  zac: { name: 'Zacharie', testament: 'Ancien' },
  mal: { name: 'Malachie', testament: 'Ancien' },
  mat: { name: 'Matthieu', testament: 'Nouveau' },
  mar: { name: 'Marc', testament: 'Nouveau' },
  luc: { name: 'Luc', testament: 'Nouveau' },
  jean: { name: 'Jean', testament: 'Nouveau' },
  act: { name: 'Actes', testament: 'Nouveau' },
  rom: { name: 'Romains', testament: 'Nouveau' },
  '1co': { name: '1 Corinthiens', testament: 'Nouveau' },
  '2co': { name: '2 Corinthiens', testament: 'Nouveau' },
  gal: { name: 'Galates', testament: 'Nouveau' },
  eph: { name: 'Éphésiens', testament: 'Nouveau' },
  phi: { name: 'Philippiens', testament: 'Nouveau' },
  col: { name: 'Colossiens', testament: 'Nouveau' },
  '1ts': { name: '1 Thessaloniciens', testament: 'Nouveau' },
  '2ts': { name: '2 Thessaloniciens', testament: 'Nouveau' },
  '1ti': { name: '1 Timothée', testament: 'Nouveau' },
  '2ti': { name: '2 Timothée', testament: 'Nouveau' },
  tit: { name: 'Tite', testament: 'Nouveau' },
  phm: { name: 'Philémon', testament: 'Nouveau' },
  heb: { name: 'Hébreux', testament: 'Nouveau' },
  jac: { name: 'Jacques', testament: 'Nouveau' },
  '1pi': { name: '1 Pierre', testament: 'Nouveau' },
  '2pi': { name: '2 Pierre', testament: 'Nouveau' },
  '1jo': { name: '1 Jean', testament: 'Nouveau' },
  '2jo': { name: '2 Jean', testament: 'Nouveau' },
  '3jo': { name: '3 Jean', testament: 'Nouveau' },
  jud: { name: 'Jude', testament: 'Nouveau' },
  apo: { name: 'Apocalypse', testament: 'Nouveau' },
};

const CANONICAL_ORDER = [
  'gen','ex','lev','num','deu','jos','jug','rut','1sa','2sa','1ro','2ro','1ch','2ch',
  'ezd','neh','est','job','ps','pro','ecc','cant','esa','jer','la','eze','dan',
  'hos','joe','am','abd','jon','mi','nah','hab','soph','agg','zac','mal',
  'mat','mar','luc','jean','act','rom','1co','2co','gal','eph','phi','col',
  '1ts','2ts','1ti','2ti','tit','phm','heb','jac','1pi','2pi','1jo','2jo','3jo','jud','apo',
];

const chapterCounts = {};
for (const ch of DATA) {
  chapterCounts[ch.bookId] = (chapterCounts[ch.bookId] || 0) + 1;
}

const insBook = db.prepare(
  'INSERT OR IGNORE INTO books (id, name, testament, order_num, all_chapters) VALUES (?, ?, ?, ?, ?)'
);
const insChapter = db.prepare(
  'INSERT OR IGNORE INTO chapters (book_id, chapter_number, sub) VALUES (?, ?, ?)'
);
const insVerse = db.prepare(
  'INSERT OR IGNORE INTO version_verses (version_id, book_id, chapter_number, verse_number, verse_text) VALUES (?, ?, ?, ?, ?)'
);

db.exec('BEGIN TRANSACTION');
for (let i = 0; i < CANONICAL_ORDER.length; i++) {
  const id = CANONICAL_ORDER[i];
  const b = BOOKS[id];
  if (b) {
    insBook.run(id, b.name, b.testament, i + 1, chapterCounts[id] || 0);
  }
}

for (const ch of DATA) {
  insChapter.run(ch.bookId, ch.chapter, ch.sub || '');
  for (const v of ch.verses) {
    if (v.dar) insVerse.run('dar', ch.bookId, ch.chapter, v.verse, v.dar);
    if (v.lsg) insVerse.run('lsg', ch.bookId, ch.chapter, v.verse, v.lsg);
    if (v.kjv) insVerse.run('kjv', ch.bookId, ch.chapter, v.verse, v.kjv);
  }
}

db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('seed_version', '2')").run();
db.exec('COMMIT');
db.close();

const size = fs.statSync(DB_PATH).size;
console.log(`Generated ${DB_PATH}: ${(size / 1024 / 1024).toFixed(1)} MB`);
