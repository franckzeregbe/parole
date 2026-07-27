import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { getAllBooks, getBookById } from './bible-data';
import type { VersionId } from './bible';
import { seedDatabase } from './bible-seed';
import type { SQLiteDatabase } from 'expo-sqlite';

export type { VersionId };
export { VERSIONS, VLABEL, VLANG } from './bible';

export type BibleDb = SQLiteDatabase;

export async function initBibleDb(db: SQLiteDatabase): Promise<void> {
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
    DROP TABLE IF EXISTS verses;
    CREATE TABLE IF NOT EXISTS version_verses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      chapter_number INTEGER NOT NULL,
      verse_number INTEGER NOT NULL,
      verse_text TEXT NOT NULL,
      UNIQUE(version_id, book_id, chapter_number, verse_number)
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_vv_lookup ON version_verses(version_id, book_id, chapter_number, verse_number);
  `);

  const books = getAllBooks();
  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    const chapterCount = getBookById(b.id)?.chapterCount ?? 0;
    await db.runAsync(
      'INSERT OR IGNORE INTO books (id, name, testament, order_num, all_chapters) VALUES (?, ?, ?, ?, ?)',
      [b.id, b.name, b.testament === 'Ancien Testament' ? 'Ancien' : 'Nouveau', i + 1, chapterCount]
    );
  }
}

export async function loadBibleDb(): Promise<SQLiteDatabase> {
  const dbDir = `${FileSystem.documentDirectory}SQLite/`;
  const dbPath = `${dbDir}bible.db`;

  await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });

  const dbInfo = await FileSystem.getInfoAsync(dbPath);
  if (dbInfo.exists) {
    await FileSystem.deleteAsync(dbPath, { idempotent: true });
  }

  const asset = Asset.fromModule(require('../../assets/bible.db'));
  await asset.downloadAsync();
  await FileSystem.copyAsync({ from: asset.localUri!, to: dbPath });

  const db = await SQLite.openDatabaseAsync(dbPath);
  await initBibleDb(db);
  return db;
}


export async function getBookList(db: SQLiteDatabase): Promise<{ id: string; name: string; testament: string; order_num: number; all_chapters: number }[]> {
  return db.getAllAsync('SELECT * FROM books ORDER BY order_num');
}

export async function getChapter(
  db: SQLiteDatabase,
  bookId: string,
  chapterNum: number
): Promise<{ id: number; book_id: string; chapter_number: number; sub: string | null; dar: { v: number; t: string }[]; lsg: { v: number; t: string }[]; kjv: { v: number; t: string }[] } | null> {
  const chapter = await db.getFirstAsync<{ id: number; book_id: string; chapter_number: number; sub: string | null }>(
    'SELECT id, book_id, chapter_number, sub FROM chapters WHERE book_id = ? AND chapter_number = ?',
    [bookId, chapterNum]
  );
  if (!chapter) return null;

  const rows = await db.getAllAsync<{ version_id: string; verse_number: number; verse_text: string }>(
    'SELECT version_id, verse_number, verse_text FROM version_verses WHERE book_id = ? AND chapter_number = ? ORDER BY version_id, verse_number',
    [bookId, chapterNum]
  );

  const dar: { v: number; t: string }[] = [];
  const lsg: { v: number; t: string }[] = [];
  const kjv: { v: number; t: string }[] = [];

  for (const row of rows) {
    const v = { v: row.verse_number, t: row.verse_text };
    if (row.version_id === 'dar') dar.push(v);
    else if (row.version_id === 'lsg') lsg.push(v);
    else if (row.version_id === 'kjv') kjv.push(v);
  }

  return { ...chapter, dar, lsg, kjv };
}

interface VerseRow {
  book_id: string; book_name: string; chapter_number: number; verse_number: number; verse_text: string;
}

export async function getVerse(
  db: SQLiteDatabase,
  bookId: string,
  chapter: number,
  verse: number,
  versionId: VersionId = 'dar'
): Promise<VerseRow | null> {
  const row = await db.getFirstAsync<VerseRow>(
    `SELECT v.book_id, b.name AS book_name, v.chapter_number, v.verse_number, v.verse_text
     FROM version_verses v
     JOIN books b ON v.book_id = b.id
     WHERE v.version_id = ? AND v.book_id = ? AND v.chapter_number = ? AND v.verse_number = ?`,
    [versionId, bookId, chapter, verse]
  );
  return row;
}

export async function searchVerses(
  db: SQLiteDatabase,
  query: string,
  version: VersionId
): Promise<{ book_id: string; book_name: string; chapter_number: number; verse_number: number; text: string }[]> {
  return db.getAllAsync(
    `SELECT v.book_id, b.name AS book_name, v.chapter_number, v.verse_number, v.verse_text AS text
     FROM version_verses v
     JOIN books b ON v.book_id = b.id
     WHERE v.version_id = ? AND v.verse_text LIKE ?
     ORDER BY v.book_id, v.chapter_number, v.verse_number`,
    [version, `%${query}%`]
  );
}

export async function getBookVerseLayout(
  db: SQLiteDatabase,
  bookId: string
): Promise<{ chapter: number; verseCount: number }[]> {
  return db.getAllAsync<{ chapter: number; verseCount: number }>(
    `SELECT chapter_number AS chapter, COUNT(*) AS verseCount
     FROM version_verses WHERE book_id = ? AND version_id = 'dar' GROUP BY chapter_number ORDER BY chapter_number`,
    [bookId]
  );
}

export async function getAvailableChapters(
  db: SQLiteDatabase,
  bookId: string
): Promise<number[]> {
  const rows = await db.getAllAsync<{ chapter_number: number }>(
    'SELECT chapter_number FROM chapters WHERE book_id = ? ORDER BY chapter_number',
    [bookId]
  );
  return rows.map((r) => r.chapter_number);
}
