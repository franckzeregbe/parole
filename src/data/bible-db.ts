import * as SQLite from 'expo-sqlite';
import { getAllBooks, getAllSeedData } from './bible-data';
import type { VersionId } from './bible';

export type { VersionId };
export { VERSIONS, VLABEL, VLANG } from './bible';

const BOOK_NAMES_EN: Record<string, string> = {
  gen: 'genesis', ex: 'exodus', lev: 'leviticus', num: 'numbers', deu: 'deuteronomy',
  jos: 'joshua', jug: 'judges', rut: 'ruth', '1sa': '1-samuel', '2sa': '2-samuel',
  '1ro': '1-kings', '2ro': '2-kings', '1ch': '1-chronicles', '2ch': '2-chronicles',
  ezd: 'ezra', neh: 'nehemiah', est: 'esther', job: 'job', ps: 'psalms',
  pro: 'proverbs', ecc: 'ecclesiastes', cant: 'song-of-solomon', esa: 'isaiah',
  jer: 'jeremiah', la: 'lamentations', eze: 'ezekiel', dan: 'daniel', hos: 'hosea',
  joe: 'joel', am: 'amos', abd: 'obadiah', jon: 'jonah', mi: 'micah', nah: 'nahum',
  hab: 'habakkuk', soph: 'zephaniah', agg: 'haggai', zac: 'zechariah', mal: 'malachi',
  mat: 'matthew', mar: 'mark', luc: 'luke', jean: 'john', act: 'acts', rom: 'romans',
  '1co': '1-corinthians', '2co': '2-corinthians', gal: 'galatians', eph: 'ephesians',
  phi: 'philippians', col: 'colossians', '1ts': '1-thessalonians', '2ts': '2-thessalonians',
  '1ti': '1-timothy', '2ti': '2-timothy', tit: 'titus', phm: 'philemon', heb: 'hebrews',
  jac: 'james', '1pi': '1-peter', '2pi': '2-peter', '1jo': '1-john', '2jo': '2-john',
  '3jo': '3-john', jud: 'jude', apo: 'revelation',
};

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

  const books = getAllBooks();
  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    await db.runAsync(
      'INSERT OR IGNORE INTO books (id, name, testament, order_num, all_chapters) VALUES (?, ?, ?, ?, 0)',
      [b.id, b.name, b.testament === 'Ancien Testament' ? 'Ancien' : 'Nouveau', i + 1]
    );
  }

  const seeds = getAllSeedData();
  for (const seed of seeds) {
    await db.runAsync(
      'INSERT OR IGNORE INTO chapters (book_id, chapter_number, sub) VALUES (?, ?, ?)',
      [seed.bookId, seed.chapter, seed.sub]
    );

    for (const v of seed.verses) {
      await db.runAsync(
        'INSERT OR IGNORE INTO verses (book_id, chapter_number, verse_number, dar, lsg, kjv) VALUES (?, ?, ?, ?, ?, ?)',
        [seed.bookId, seed.chapter, v.verse, v.dar, v.lsg, v.kjv]
      );
    }
  }
}

export async function loadBibleDb(): Promise<any> {
  const db = await SQLite.openDatabaseAsync('bible.db');
  await initBibleDb(db);
  return db;
}

export async function downloadChapterFromApi(
  db: any,
  bookId: string,
  chapterNum: number
): Promise<{ success: boolean; versesStored: number; error?: string }> {
  const nameEn = BOOK_NAMES_EN[bookId];
  if (!nameEn) return { success: false, versesStored: 0, error: `Unknown book ID: ${bookId}` };

  try {
    const baseUrl = `https://bible-api.com/${nameEn}+${chapterNum}?verse_numbers=true`;

    const [kjvResponse, lsgResponse, darResponse] = await Promise.all([
      fetch(baseUrl),
      fetch(`${baseUrl}&translation=segond`),
      fetch(`${baseUrl}&translation=darby`),
    ]);

    if (!kjvResponse.ok) {
      return { success: false, versesStored: 0, error: `KJV API returned ${kjvResponse.status}` };
    }

    const kjvData = await kjvResponse.json();
    const lsgData = lsgResponse.ok ? await lsgResponse.json() : null;
    const darData = darResponse.ok ? await darResponse.json() : null;

    const verseMap: Map<number, { kjv: string; lsg: string | null; dar: string | null }> = new Map();

    for (const v of kjvData.verses || []) {
      verseMap.set(v.verse, { kjv: v.text, lsg: null, dar: null });
    }

    if (lsgData?.verses) {
      for (const v of lsgData.verses) {
        const existing = verseMap.get(v.verse);
        if (existing) existing.lsg = v.text;
      }
    }

    if (darData?.verses) {
      for (const v of darData.verses) {
        const existing = verseMap.get(v.verse);
        if (existing) existing.dar = v.text;
      }
    }

    const verses = Array.from(verseMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([verseNum, texts]) => ({
        verse: verseNum,
        kjv: texts.kjv,
        lsg: texts.lsg ?? '',
        dar: texts.dar ?? '',
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
