// legacyMigration.ts — Safe migration of favorites / highlights from the
// legacy prototype storage format to the current format.
//
// Legacy prototype format : `${book}:${verseIndex}`   (global verse index within a book)
// Current app format      : `${book}:${chapter}:${verse}`
//
// Because a global verse index can only be mapped to a (chapter, verse) pair
// once we know the real per-chapter verse layout, the migration runs in two
// phases:
//   1. `separateLegacyKeys` runs during AsyncStorage restoration and partitions
//      the stored records into current-format records (kept as-is) and
//      legacy-format records (held for later resolution).
//   2. `resolveLegacyKey` uses the SQLite database to translate each legacy key
//      into its current-format equivalent, falling back safely when a key is
//      out of range or references an unknown book.

import type { SQLiteDatabase } from 'expo-sqlite';
import { getBookById } from './bible-data';
import { getBookVerseLayout } from './bible-db';

export interface StoredRecord {
  [key: string]: true;
}
export interface StoredColorRecord {
  [key: string]: string;
}

export interface ParsedRecords<T extends StoredRecord | StoredColorRecord> {
  /** Keys already in the current `book:chapter:verse` format. */
  current: T;
  /** Keys still in the legacy `book:verseIndex` format, awaiting resolution. */
  legacy: T;
}

/** True when `key` looks like the legacy `book:verseIndex` format. */
export function isLegacyKey(key: string): boolean {
  const parts = key.split(':');
  if (parts.length !== 2) return false;
  const [book, idxStr] = parts;
  if (!getBookById(book)) return false;
  return /^\d+$/.test(idxStr.trim());
}

/**
 * Partition a stored record map into current-format and legacy-format keys.
 * Invalid keys (unknown book, malformed value) are dropped so a corrupt store
 * can never crash the app.
 */
export function separateLegacyKeys<T extends StoredRecord | StoredColorRecord>(
  record: T | undefined | null
): ParsedRecords<T> {
  const current = {} as T;
  const legacy = {} as T;
  if (!record || typeof record !== 'object') return { current, legacy };

  for (const key of Object.keys(record)) {
    const value = record[key];
    if (value === undefined || value === null) continue;
    if (isLegacyKey(key)) {
      (legacy as any)[key] = value;
    } else {
      (current as any)[key] = value;
    }
  }
  return { current, legacy };
}

/**
 * Resolve a single legacy `book:verseIndex` key into the current
 * `book:chapter:verse` format using the database's verse layout.
 *
 * The legacy index is assumed 0-based (array-style). If it falls outside the
 * book's verse count we also try a 1-based interpretation before giving up.
 * Returns `null` when the key cannot be resolved safely.
 */
export async function resolveLegacyKey(
  db: SQLiteDatabase,
  legacyKey: string
): Promise<string | null> {
  const parts = legacyKey.split(':');
  if (parts.length !== 2) return null;

  const [bookId, idxStr] = parts;
  const rawIndex = Number(idxStr);
  if (!getBookById(bookId) || !Number.isInteger(rawIndex) || rawIndex < 0) {
    return null;
  }

  let layout: { chapter: number; verseCount: number }[];
  try {
    layout = await getBookVerseLayout(db, bookId);
  } catch {
    return null;
  }
  if (layout.length === 0) return null;

  const total = layout.reduce((sum, l) => sum + l.verseCount, 0);
  if (total === 0) return null;

  // Try 0-based first, then 1-based.
  let target = rawIndex;
  if (target >= total) target = rawIndex - 1;
  if (target < 0 || target >= total) return null;

  let cursor = 0;
  for (const l of layout) {
    if (target < cursor + l.verseCount) {
      const verse = target - cursor + 1;
      return `${bookId}:${l.chapter}:${verse}`;
    }
    cursor += l.verseCount;
  }
  return null;
}

/** Resolve every legacy key in `legacy` and merge it into `current`. */
export async function resolveLegacyRecords<T extends StoredRecord | StoredColorRecord>(
  db: SQLiteDatabase,
  current: T,
  legacy: T
): Promise<T> {
  const merged = { ...current } as T;
  for (const key of Object.keys(legacy)) {
    try {
      const resolved = await resolveLegacyKey(db, key);
      if (resolved) {
        (merged as any)[resolved] = (legacy as any)[key];
      }
    } catch {
      /* skip unresolvable key */
    }
  }
  return merged;
}
