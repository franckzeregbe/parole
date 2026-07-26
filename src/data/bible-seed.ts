import completeBible from './bible-complete.json';
import type { SQLiteDatabase } from 'expo-sqlite';

export const SEED_VERSION = 2;

export interface SeedVerse {
  verse: number;
  dar: string;
  lsg: string;
  kjv: string;
}

export interface SeedChapter {
  bookId: string;
  chapter: number;
  sub: string;
  verses: SeedVerse[];
}

const DATA: SeedChapter[] = completeBible as SeedChapter[];

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', ['seed_version']);
  if (row && Number(row.value) === SEED_VERSION) return;

  await db.execAsync('BEGIN TRANSACTION');
  try {
    for (const ch of DATA) {
      await db.runAsync(
        'INSERT OR IGNORE INTO chapters (book_id, chapter_number, sub) VALUES (?, ?, ?)',
        [ch.bookId, ch.chapter, ch.sub]
      );
      for (const v of ch.verses) {
        if (v.dar) {
          await db.runAsync(
            'INSERT OR IGNORE INTO version_verses (version_id, book_id, chapter_number, verse_number, verse_text) VALUES (?, ?, ?, ?, ?)',
            ['dar', ch.bookId, ch.chapter, v.verse, v.dar]
          );
        }
        if (v.lsg) {
          await db.runAsync(
            'INSERT OR IGNORE INTO version_verses (version_id, book_id, chapter_number, verse_number, verse_text) VALUES (?, ?, ?, ?, ?)',
            ['lsg', ch.bookId, ch.chapter, v.verse, v.lsg]
          );
        }
        if (v.kjv) {
          await db.runAsync(
            'INSERT OR IGNORE INTO version_verses (version_id, book_id, chapter_number, verse_number, verse_text) VALUES (?, ?, ?, ?, ?)',
            ['kjv', ch.bookId, ch.chapter, v.verse, v.kjv]
          );
        }
      }
    }
    await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', ['seed_version', String(SEED_VERSION)]);
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}
