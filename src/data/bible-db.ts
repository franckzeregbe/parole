import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import type { VersionId } from './bible';
import type { SQLiteDatabase } from 'expo-sqlite';

export type { VersionId };
export { VERSIONS, VLABEL, VLANG } from './bible';

export type BibleDb = SQLiteDatabase;

/** Seed version attendue — incrémenter quand la structure de la DB embarquée change. */
const EXPECTED_SEED_VERSION = 2;

/**
 * Copie la base pré-compilée depuis les assets natifs vers le répertoire
 * documents/SQLite/ si elle n'y est pas encore. Si la version embarquée
 * diffère de celle attendue, on recopie (rare — uniquement après upgrade).
 *
 * Le `downloadAsync` d'Asset + `copyAsync` peuvent être coûteux sur les
 * gros fichiers ; on garde donc la logique minimale et on loggue les
 * étapes pour le debug.
 */
export async function loadBibleDb(): Promise<SQLiteDatabase> {
  const dbDir = `${FileSystem.documentDirectory}SQLite/`;
  const dbPath = `${dbDir}bible.db`;

  const info = await FileSystem.getInfoAsync(dbPath);
  let needsCopy = !info.exists;

  const db = await SQLite.openDatabaseAsync('bible.db');

  // Vérifie la version sans recopier si la DB semble déjà à jour.
  if (!needsCopy) {
    try {
      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM meta WHERE key = 'seed_version'"
      );
      needsCopy = !(row && Number(row.value) === EXPECTED_SEED_VERSION);
    } catch {
      needsCopy = true;
    }
  }

  if (needsCopy) {
    try {
      await db.closeAsync();
    } catch { /* ignore */ }

    await FileSystem.deleteAsync(dbPath, { idempotent: true });
    const asset = Asset.fromModule(require('../../assets/bible.db'));
    await asset.downloadAsync();
    await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
    if (!asset.localUri) {
      throw new Error('Échec du téléchargement de la base Bible (asset.localUri null)');
    }
    await FileSystem.copyAsync({ from: asset.localUri, to: dbPath });
    const db2 = await SQLite.openDatabaseAsync('bible.db');
    return db2;
  }

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
