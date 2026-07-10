// import-json-to-sqlite.ts — Imports bible-complete.json into parole.db
// Run: npx ts-node src/data/import-json-to-sqlite.ts
//
// Uses better-sqlite3 (expo-sqlite is unavailable in Node.js).
// Creates parole.db at the project root (name avoids Expo bundler conflicts).
// Batch transactions: one transaction per book.

import * as fs from 'node:fs';
import * as path from 'node:path';
import Database from 'better-sqlite3';

// ─── Types (mirrors bible-data.ts) ────────────────────────────────────────

interface VerseDatum {
  verse: number;
  dar: string;
  lsg: string;
  kjv: string;
}

interface ChapterSeed {
  bookId: string;
  chapter: number;
  sub: string;
  verses: VerseDatum[];
}

// ─── Constants ────────────────────────────────────────────────────────────

const DB_PATH = path.resolve(__dirname, '..', '..', 'parole.db');
const JSON_PATH = path.resolve(__dirname, 'bible-complete.json');

const CANONICAL_BOOK_IDS = [
  'gen','ex','lev','num','deu','jos','jug','rut','1sa','2sa',
  '1ro','2ro','1ch','2ch','ezd','neh','est','job','ps','pro',
  'ecc','cant','esa','jer','la','eze','dan','hos','joe','am',
  'abd','jon','mi','nah','hab','soph','agg','zac','mal',
  'mat','mar','luc','jean','act','rom','1co','2co','gal','eph',
  'phi','col','1ts','2ts','1ti','2ti','tit','phm','heb','jac',
  '1pi','2pi','1jo','2jo','3jo','jud','apo',
];

const OT_SET: ReadonlySet<string> = new Set([
  'gen','ex','lev','num','deu','jos','jug','rut','1sa','2sa',
  '1ro','2ro','1ch','2ch','ezd','neh','est','job','ps','pro',
  'ecc','cant','esa','jer','la','eze','dan','hos','joe','am',
  'abd','jon','mi','nah','hab','soph','agg','zac','mal',
]);

const BOOK_NAMES: Record<string, string> = {
  gen: 'Genèse', ex: 'Exode', lev: 'Lévitique', num: 'Nombres', deu: 'Deutéronome',
  jos: 'Josué', jug: 'Juges', rut: 'Ruth', '1sa': '1 Samuel', '2sa': '2 Samuel',
  '1ro': '1 Rois', '2ro': '2 Rois', '1ch': '1 Chroniques', '2ch': '2 Chroniques',
  ezd: 'Esdras', neh: 'Néhémie', est: 'Esther', job: 'Job', ps: 'Psaumes',
  pro: 'Proverbes', ecc: 'Ecclésiaste', cant: 'Cantique des Cantiques', esa: 'Ésaïe',
  jer: 'Jérémie', la: 'Lamentations', eze: 'Ézéchiel', dan: 'Daniel', hos: 'Osée',
  joe: 'Joël', am: 'Amos', abd: 'Abdias', jon: 'Jonas', mi: 'Michée', nah: 'Nahum',
  hab: 'Habacuc', soph: 'Sophonie', agg: 'Aggée', zac: 'Zacharie', mal: 'Malachie',
  mat: 'Matthieu', mar: 'Marc', luc: 'Luc', jean: 'Jean', act: 'Actes', rom: 'Romains',
  '1co': '1 Corinthiens', '2co': '2 Corinthiens', gal: 'Galates', eph: 'Éphésiens',
  phi: 'Philippiens', col: 'Colossiens', '1ts': '1 Thessaloniciens', '2ts': '2 Thessaloniciens',
  '1ti': '1 Timothée', '2ti': '2 Timothée', tit: 'Tite', phm: 'Philémon', heb: 'Hébreux',
  jac: 'Jacques', '1pi': '1 Pierre', '2pi': '2 Pierre', '1jo': '1 Jean', '2jo': '2 Jean',
  '3jo': '3 Jean', jud: 'Jude', apo: 'Apocalypse',
};

// ─── Main ─────────────────────────────────────────────────────────────────

function main(): void {
  console.log('=== Bible JSON → SQLite Import ===');
  console.log(`JSON: ${JSON_PATH}`);
  console.log(`DB:   ${DB_PATH}`);
  console.log();

  // 1. Read JSON
  if (!fs.existsSync(JSON_PATH)) {
    console.error('ERROR: bible-complete.json not found. Run bible-complete.ts first.');
    process.exit(1);
  }

  const raw = fs.readFileSync(JSON_PATH, 'utf-8');
  const chapters: ChapterSeed[] = JSON.parse(raw);
  console.log(`Read ${chapters.length} chapters from JSON`);

  if (chapters.length === 0) {
    console.log('WARNING: JSON file is empty. Only books table will be populated.');
  }

  // 2. Open database
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log('Database opened');

  // 3. Create tables (mirrors initBibleDb from bible-db.ts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      testament TEXT NOT NULL,
      order_num INTEGER NOT NULL,
      all_chapters INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS chapters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id TEXT NOT NULL REFERENCES books(id),
      chapter_number INTEGER NOT NULL,
      sub TEXT,
      UNIQUE(book_id, chapter_number)
    );
    CREATE TABLE IF NOT EXISTS verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id TEXT NOT NULL,
      chapter_number INTEGER NOT NULL,
      verse_number INTEGER NOT NULL,
      dar TEXT,
      lsg TEXT,
      kjv TEXT,
      UNIQUE(book_id, chapter_number, verse_number)
    );
  `);
  console.log('Tables created / verified');

  // 4. Insert books
  const insertBook = db.prepare(
    `INSERT OR IGNORE INTO books (id, name, testament, order_num, all_chapters)
     VALUES (?, ?, ?, ?, 0)`
  );

  const insertBooks = db.transaction(() => {
    for (let i = 0; i < CANONICAL_BOOK_IDS.length; i++) {
      const id = CANONICAL_BOOK_IDS[i];
      insertBook.run(
        id,
        BOOK_NAMES[id],
        OT_SET.has(id) ? 'Ancien' : 'Nouveau',
        i + 1,
      );
    }
  });
  insertBooks();

  {
    const row = db.prepare('SELECT COUNT(*) AS cnt FROM books').get() as { cnt: number };
    console.log(`Books inserted: ${row.cnt}`);
  }

  // 5. Import chapters and verses (one transaction per book)
  if (chapters.length === 0) {
    db.close();
    console.log('\n=== Import Complete (empty) ===');
    return;
  }

  const insertChapter = db.prepare(
    `INSERT OR IGNORE INTO chapters (book_id, chapter_number, sub)
     VALUES (?, ?, ?)`
  );

  const insertVerse = db.prepare(
    `INSERT OR IGNORE INTO verses (book_id, chapter_number, verse_number, dar, lsg, kjv)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  // Group by bookId for batch transactions
  const byBook = new Map<string, ChapterSeed[]>();
  for (const ch of chapters) {
    const list = byBook.get(ch.bookId);
    if (list) {
      list.push(ch);
    } else {
      byBook.set(ch.bookId, [ch]);
    }
  }

  let totalChapters = 0;
  let totalVerses = 0;

  for (const [bookId, bookChapters] of byBook) {
    const importBook = db.transaction(() => {
      for (const ch of bookChapters) {
        insertChapter.run(ch.bookId, ch.chapter, ch.sub);

        for (const v of ch.verses) {
          insertVerse.run(ch.bookId, ch.chapter, v.verse, v.dar, v.lsg, v.kjv);
        }
      }
    });

    importBook();

    const chCount = bookChapters.length;
    const vsCount = bookChapters.reduce((s, c) => s + c.verses.length, 0);
    totalChapters += chCount;
    totalVerses += vsCount;
    console.log(`  ${bookId}: ${String(chCount).padStart(3)} chapters, ${String(vsCount).padStart(6)} verses`);
  }

  // 6. Update all_chapters counts
  const updateCount = db.prepare(
    `UPDATE books SET all_chapters = (SELECT COUNT(*) FROM chapters WHERE book_id = ?) WHERE id = ?`
  );

  const updateCounts = db.transaction(() => {
    for (const id of CANONICAL_BOOK_IDS) {
      updateCount.run(id, id);
    }
  });
  updateCounts();

  // 7. Summary
  const bookRow = db.prepare('SELECT COUNT(*) AS cnt FROM books').get() as { cnt: number };
  const chRow   = db.prepare('SELECT COUNT(*) AS cnt FROM chapters').get() as { cnt: number };
  const vsRow   = db.prepare('SELECT COUNT(*) AS cnt FROM verses').get() as { cnt: number };
  const missingChapters = db.prepare(
    `SELECT books.id, books.name, books.all_chapters
     FROM books
     WHERE books.all_chapters = 0
     ORDER BY books.order_num`
  ).all() as { id: string; name: string; all_chapters: number }[];

  console.log();
  console.log('=== Import Complete ===');
  console.log(`Books:    ${bookRow.cnt}`);
  console.log(`Chapters: ${chRow.cnt}`);
  console.log(`Verses:   ${vsRow.cnt}`);

  if (missingChapters.length > 0) {
    console.log(`\nBooks with no chapters imported:`);
    for (const b of missingChapters) {
      console.log(`  ${b.id} (${b.name})`);
    }
  }

  const dbSizeBytes = fs.statSync(DB_PATH).size;
  const dbSizeMb = (dbSizeBytes / 1_000_000).toFixed(2);
  console.log(`\nDatabase size: ${dbSizeMb} MB`);

  db.close();
}

main();
