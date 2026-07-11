import * as SQLite from 'expo-sqlite';
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
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_verses_book ON verses(book_id, chapter_number, verse_number);
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
  const db = await SQLite.openDatabaseAsync('bible.db');
  await initBibleDb(db);
  await seedDatabase(db);
  return db;
}

export async function downloadChapterFromApi(
  db: SQLiteDatabase,
  bookId: string,
  chapterNum: number
): Promise<{ success: boolean; versesStored: number; error?: string }> {
  // bible-api.com doesn't support Segond — use GitHub raw data instead
  const OSIS_MAP: Record<string, string> = {
    gen: 'Gen', ex: 'Exod', lev: 'Lev', num: 'Num', deu: 'Deut',
    jos: 'Josh', jug: 'Judg', rut: 'Ruth', '1sa': '1Sam', '2sa': '2Sam',
    '1ro': '1Kgs', '2ro': '2Kgs', '1ch': '1Chr', '2ch': '2Chr',
    ezd: 'Ezra', neh: 'Neh', est: 'Esth', job: 'Job', ps: 'Ps',
    pro: 'Prov', ecc: 'Eccl', cant: 'Song', esa: 'Isa', jer: 'Jer',
    la: 'Lam', eze: 'Ezek', dan: 'Dan', hos: 'Hos', joe: 'Joel',
    am: 'Amos', abd: 'Obad', jon: 'Jonah', mi: 'Mic', nah: 'Nah',
    hab: 'Hab', soph: 'Zeph', agg: 'Hag', zac: 'Zech', mal: 'Mal',
    mat: 'Matt', mar: 'Mark', luc: 'Luke', jean: 'John', act: 'Acts',
    rom: 'Rom', '1co': '1Cor', '2co': '2Cor', gal: 'Gal', eph: 'Eph',
    phi: 'Phil', col: 'Col', '1ts': '1Thess', '2ts': '2Thess',
    '1ti': '1Tim', '2ti': '2Tim', tit: 'Titus', phm: 'Phlm',
    heb: 'Heb', jac: 'Jas', '1pi': '1Pet', '2pi': '2Pet',
    '1jo': '1John', '2jo': '2John', '3jo': '3John', jud: 'Jude', apo: 'Rev',
  };

  const osis = OSIS_MAP[bookId];
  if (!osis) return { success: false, versesStored: 0, error: `Unknown book: ${bookId}` };

  const VERSION_SLUGS: Record<string, string> = {
    kjv: 'eng/eng-kjv',
    dar: 'fr/fr-darby',
    lsg: 'fr/fr-lsg',
  };

  try {
    const results = await Promise.all(
      (['kjv', 'dar', 'lsg'] as const).map(async (v) => {
        const url = `https://cdn.jsdelivr.net/npm/@bible-json/core@1/data/versions/${VERSION_SLUGS[v]}/books/${osis}.json`;
        const resp = await fetch(url);
        if (!resp.ok) return { version: v, verses: [] as { verse: number; text: string }[] };
        const data = await resp.json();
        const chData = data.chapters?.find((c: any) => c.chapter === chapterNum);
        return { version: v, verses: (chData?.verses || []).map((x: any) => ({ verse: x.verse, text: x.text })) };
      })
    );

    type VerseItem = { verse: number; text: string };

    const kjvVerses: VerseItem[] = results.find(r => r.version === 'kjv')?.verses || [];
    if (kjvVerses.length === 0) {
      return { success: false, versesStored: 0, error: 'KJV data not available' };
    }

    const darVerses: VerseItem[] = results.find(r => r.version === 'dar')?.verses || [];
    const lsgVerses: VerseItem[] = results.find(r => r.version === 'lsg')?.verses || [];

    const verseNums = new Set<number>([
      ...kjvVerses.map(v => v.verse),
      ...darVerses.map(v => v.verse),
      ...lsgVerses.map(v => v.verse),
    ]);

    const darMap = new Map(darVerses.map(v => [v.verse, v.text]));
    const lsgMap = new Map(lsgVerses.map(v => [v.verse, v.text]));
    const kjvMap = new Map(kjvVerses.map(v => [v.verse, v.text]));

    const verses = Array.from(verseNums)
      .sort((a, b) => a - b)
      .map(v => ({
        verse: v,
        kjv: kjvMap.get(v) || '',
        dar: darMap.get(v) || '',
        lsg: lsgMap.get(v) || '',
      }));

    await db.execAsync('BEGIN TRANSACTION');
    try {
      await db.runAsync(
        'INSERT OR IGNORE INTO chapters (book_id, chapter_number, sub) VALUES (?, ?, ?)',
        [bookId, chapterNum, null]
      );
      for (const v of verses) {
        await db.runAsync(
          'INSERT OR IGNORE INTO verses (book_id, chapter_number, verse_number, dar, lsg, kjv) VALUES (?, ?, ?, ?, ?, ?)',
          [bookId, chapterNum, v.verse, v.dar, v.lsg, v.kjv]
        );
      }
      await db.execAsync('COMMIT');
    } catch (e: any) {
      await db.execAsync('ROLLBACK');
      return { success: false, versesStored: 0, error: e.message };
    }
    return { success: true, versesStored: verses.length };
  } catch (err: any) {
    return { success: false, versesStored: 0, error: err.message };
  }
}

export async function getBookList(db: SQLiteDatabase): Promise<{ id: string; name: string; testament: string; order_num: number; all_chapters: number }[]> {
  return db.getAllAsync('SELECT * FROM books ORDER BY order_num');
}

export async function getChapter(
  db: SQLiteDatabase,
  bookId: string,
  chapterNum: number
): Promise<{ id: number; book_id: string; chapter_number: number; sub: string | null; verses: { verse_number: number; dar: string; lsg: string; kjv: string }[] } | null> {
  const chapter = await db.getFirstAsync<{ id: number; book_id: string; chapter_number: number; sub: string | null }>(
    'SELECT id, book_id, chapter_number, sub FROM chapters WHERE book_id = ? AND chapter_number = ?',
    [bookId, chapterNum]
  );
  if (!chapter) return null;

  const verses = await db.getAllAsync<{ verse_number: number; dar: string; lsg: string; kjv: string }>(
    'SELECT verse_number, dar, lsg, kjv FROM verses WHERE book_id = ? AND chapter_number = ? ORDER BY verse_number',
    [bookId, chapterNum]
  );

  return { ...chapter, verses };
}

interface VerseRow {
  book_id: string; book_name: string; chapter_number: number; verse_number: number; dar: string; lsg: string; kjv: string;
}

export async function getVerse(
  db: SQLiteDatabase,
  bookId: string,
  chapter: number,
  verse: number
): Promise<VerseRow | null> {
  const row = await db.getFirstAsync<VerseRow>(
    `SELECT v.book_id, b.name AS book_name, v.chapter_number, v.verse_number, v.dar, v.lsg, v.kjv
     FROM verses v
     JOIN books b ON v.book_id = b.id
     WHERE v.book_id = ? AND v.chapter_number = ? AND v.verse_number = ?`,
    [bookId, chapter, verse]
  );
  return row;
}

export async function searchVerses(
  db: SQLiteDatabase,
  query: string,
  version: VersionId
): Promise<{ book_id: string; book_name: string; chapter_number: number; verse_number: number; text: string }[]> {
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
  db: SQLiteDatabase,
  bookId: string
): Promise<number[]> {
  const rows = await db.getAllAsync<{ chapter_number: number }>(
    'SELECT chapter_number FROM chapters WHERE book_id = ? ORDER BY chapter_number',
    [bookId]
  );
  return rows.map((r) => r.chapter_number);
}

export async function insertChapterWithVerses(
  db: SQLiteDatabase,
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
