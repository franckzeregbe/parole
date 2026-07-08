import * as SQLite from 'expo-sqlite';
import { BIBLE, ALL_BOOKS, ORDER } from './bible';
import type { VersionId } from './bible';

export type { VersionId };
export { VERSIONS, VLABEL, VLANG } from './bible';

const BOOK_ORDER: string[] = [
  'gen', 'ex', 'lev', 'num', 'de', 'jos', 'jug', 'rut', '1sa', '2sam',
  '1ro', '2ro', '1ch', '2ch', 'ezd', 'neh', 'est', 'job', 'ps', 'pro',
  'ecc', 'cant', 'esa', 'jer', 'la', 'eze', 'dan', 'os', 'joe', 'am',
  'abd', 'jon', 'mi', 'na', 'hab', 'soph', 'agg', 'zac', 'mal',
  'mat', 'mar', 'luc', 'jean', 'act', 'rom', '1co', '2co', 'gal', 'eph',
  'ph', 'col', '1ts', '2ts', '1ti', '2ti', 'tit', 'phm', 'heb', 'jac',
  '1pi', '2pi', '1jo', '2jo', '3jo', 'jud', 'apo',
];

const BOOKS_SEED: { id: string; name: string; testament: string }[] = [
  { id: 'gen', name: 'Genèse', testament: 'Ancien' },
  { id: 'ex', name: 'Exode', testament: 'Ancien' },
  { id: 'lev', name: 'Lévitique', testament: 'Ancien' },
  { id: 'num', name: 'Nombres', testament: 'Ancien' },
  { id: 'de', name: 'Deutéronome', testament: 'Ancien' },
  { id: 'jos', name: 'Josué', testament: 'Ancien' },
  { id: 'jug', name: 'Juges', testament: 'Ancien' },
  { id: 'rut', name: 'Ruth', testament: 'Ancien' },
  { id: '1sa', name: '1 Samuel', testament: 'Ancien' },
  { id: '2sam', name: '2 Samuel', testament: 'Ancien' },
  { id: '1ro', name: '1 Rois', testament: 'Ancien' },
  { id: '2ro', name: '2 Rois', testament: 'Ancien' },
  { id: '1ch', name: '1 Chroniques', testament: 'Ancien' },
  { id: '2ch', name: '2 Chroniques', testament: 'Ancien' },
  { id: 'ezd', name: 'Esdras', testament: 'Ancien' },
  { id: 'neh', name: 'Néhémie', testament: 'Ancien' },
  { id: 'est', name: 'Esther', testament: 'Ancien' },
  { id: 'job', name: 'Job', testament: 'Ancien' },
  { id: 'ps', name: 'Psaumes', testament: 'Ancien' },
  { id: 'pro', name: 'Proverbes', testament: 'Ancien' },
  { id: 'ecc', name: 'Ecclésiaste', testament: 'Ancien' },
  { id: 'cant', name: 'Cantique des Cantiques', testament: 'Ancien' },
  { id: 'esa', name: 'Ésaïe', testament: 'Ancien' },
  { id: 'jer', name: 'Jérémie', testament: 'Ancien' },
  { id: 'la', name: 'Lamentations', testament: 'Ancien' },
  { id: 'eze', name: 'Ézéchiel', testament: 'Ancien' },
  { id: 'dan', name: 'Daniel', testament: 'Ancien' },
  { id: 'os', name: 'Osée', testament: 'Ancien' },
  { id: 'joe', name: 'Joël', testament: 'Ancien' },
  { id: 'am', name: 'Amos', testament: 'Ancien' },
  { id: 'abd', name: 'Abdias', testament: 'Ancien' },
  { id: 'jon', name: 'Jonas', testament: 'Ancien' },
  { id: 'mi', name: 'Michée', testament: 'Ancien' },
  { id: 'na', name: 'Nahum', testament: 'Ancien' },
  { id: 'hab', name: 'Habacuc', testament: 'Ancien' },
  { id: 'soph', name: 'Sophonie', testament: 'Ancien' },
  { id: 'agg', name: 'Aggée', testament: 'Ancien' },
  { id: 'zac', name: 'Zacharie', testament: 'Ancien' },
  { id: 'mal', name: 'Malachie', testament: 'Ancien' },
  { id: 'mat', name: 'Matthieu', testament: 'Nouveau' },
  { id: 'mar', name: 'Marc', testament: 'Nouveau' },
  { id: 'luc', name: 'Luc', testament: 'Nouveau' },
  { id: 'jean', name: 'Jean', testament: 'Nouveau' },
  { id: 'act', name: 'Actes', testament: 'Nouveau' },
  { id: 'rom', name: 'Romains', testament: 'Nouveau' },
  { id: '1co', name: '1 Corinthiens', testament: 'Nouveau' },
  { id: '2co', name: '2 Corinthiens', testament: 'Nouveau' },
  { id: 'gal', name: 'Galates', testament: 'Nouveau' },
  { id: 'eph', name: 'Éphésiens', testament: 'Nouveau' },
  { id: 'ph', name: 'Philippiens', testament: 'Nouveau' },
  { id: 'col', name: 'Colossiens', testament: 'Nouveau' },
  { id: '1ts', name: '1 Thessaloniciens', testament: 'Nouveau' },
  { id: '2ts', name: '2 Thessaloniciens', testament: 'Nouveau' },
  { id: '1ti', name: '1 Timothée', testament: 'Nouveau' },
  { id: '2ti', name: '2 Timothée', testament: 'Nouveau' },
  { id: 'tit', name: 'Tite', testament: 'Nouveau' },
  { id: 'phm', name: 'Philémon', testament: 'Nouveau' },
  { id: 'heb', name: 'Hébreux', testament: 'Nouveau' },
  { id: 'jac', name: 'Jacques', testament: 'Nouveau' },
  { id: '1pi', name: '1 Pierre', testament: 'Nouveau' },
  { id: '2pi', name: '2 Pierre', testament: 'Nouveau' },
  { id: '1jo', name: '1 Jean', testament: 'Nouveau' },
  { id: '2jo', name: '2 Jean', testament: 'Nouveau' },
  { id: '3jo', name: '3 Jean', testament: 'Nouveau' },
  { id: 'jud', name: 'Jude', testament: 'Nouveau' },
  { id: 'apo', name: 'Apocalypse', testament: 'Nouveau' },
];

export async function initBibleDb(db: any): Promise<void> {
  await db.execAsync(`
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

  for (let i = 0; i < BOOK_ORDER.length; i++) {
    const id = BOOK_ORDER[i];
    const book = BOOKS_SEED.find((b) => b.id === id);
    if (!book) continue;
    await db.runAsync(
      'INSERT OR IGNORE INTO books (id, name, testament, order_num, all_chapters) VALUES (?, ?, ?, ?, 0)',
      [book.id, book.name, book.testament, i + 1]
    );
  }

  for (const bookId of ORDER) {
    const chapter = BIBLE[bookId];
    if (!chapter) continue;

    await db.runAsync(
      'INSERT OR IGNORE INTO chapters (book_id, chapter_number, sub) VALUES (?, ?, ?)',
      [bookId, chapter.chapter, chapter.sub]
    );

    const verseStart = chapter.verseStart;
    const texts = chapter.text;
    for (let i = 0; i < texts.dar.length; i++) {
      await db.runAsync(
        'INSERT OR IGNORE INTO verses (book_id, chapter_number, verse_number, dar, lsg, kjv) VALUES (?, ?, ?, ?, ?, ?)',
        [
          bookId,
          chapter.chapter,
          verseStart + i,
          texts.dar[i] ?? null,
          texts.lsg[i] ?? null,
          texts.kjv[i] ?? null,
        ]
      );
    }
  }
}

export async function loadBibleDb(): Promise<any> {
  const db = await SQLite.openDatabaseAsync('bible.db');
  await initBibleDb(db);
  return db;
}

export async function getBookList(db: any): Promise<any[]> {
  return db.getAllAsync('SELECT * FROM books ORDER BY order_num');
}

export async function getChapter(
  db: any,
  bookId: string,
  chapterNum: number
): Promise<any> {
  const chapter = await db.getFirstAsync(
    'SELECT id, book_id, chapter_number, sub FROM chapters WHERE book_id = ? AND chapter_number = ?',
    [bookId, chapterNum]
  );
  if (!chapter) return null;

  const verses = await db.getAllAsync(
    'SELECT verse_number, dar, lsg, kjv FROM verses WHERE book_id = ? AND chapter_number = ? ORDER BY verse_number',
    [bookId, chapterNum]
  );

  return { ...chapter, verses };
}

export async function searchVerses(
  db: any,
  query: string,
  version: VersionId
): Promise<any[]> {
  if (!['dar', 'lsg', 'kjv'].includes(version)) {
    throw new Error('Invalid version');
  }
  return db.getAllAsync(
    `SELECT v.book_id, b.name AS book_name, v.chapter_number, v.verse_number, v.${version} AS text
     FROM verses v
     JOIN books b ON v.book_id = b.id
     WHERE v.${version} LIKE ?
     ORDER BY v.book_id, v.chapter_number, v.verse_number`,
    [`%${query}%`]
  );
}

export async function getAvailableChapters(
  db: any,
  bookId: string
): Promise<number[]> {
  const rows = await db.getAllAsync(
    'SELECT chapter_number FROM chapters WHERE book_id = ? ORDER BY chapter_number',
    [bookId]
  );
  return rows.map((r: any) => r.chapter_number);
}

export async function insertChapterWithVerses(
  db: any,
  bookId: string,
  chapterNum: number,
  sub: string | null,
  darVerses: string[],
  lsgVerses: string[],
  kjvVerses: string[]
): Promise<void> {
  await db.execAsync('BEGIN TRANSACTION');
  try {
    await db.runAsync(
      'INSERT OR IGNORE INTO chapters (book_id, chapter_number, sub) VALUES (?, ?, ?)',
      [bookId, chapterNum, sub]
    );

    const maxLen = Math.max(darVerses.length, lsgVerses.length, kjvVerses.length);
    for (let i = 0; i < maxLen; i++) {
      await db.runAsync(
        'INSERT OR IGNORE INTO verses (book_id, chapter_number, verse_number, dar, lsg, kjv) VALUES (?, ?, ?, ?, ?, ?)',
        [
          bookId,
          chapterNum,
          i + 1,
          darVerses[i] ?? null,
          lsgVerses[i] ?? null,
          kjvVerses[i] ?? null,
        ]
      );
    }

    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}
