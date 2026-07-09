// bible-complete.ts — Fetches ALL 66 books × all chapters × 3 translations from bible-api.com
// Run: npx ts-node src/data/bible-complete.ts   (generates bible-complete.json cache)
// Import: import { getCompleteBibleData } from './bible-complete'

import { ChapterSeed, VerseDatum } from './bible-data';

// ─── API book name mapping (kebab-case for bible-api.com) ──────────────────

const API_BOOK_NAMES: Record<string, string> = {
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

// ─── Chapter counts per book (standard Protestant canon) ──────────────────

const CHAPTER_COUNTS: Record<string, number> = {
  gen: 50, ex: 40, lev: 27, num: 36, deu: 34, jos: 24, jug: 21, rut: 4,
  '1sa': 31, '2sa': 24, '1ro': 22, '2ro': 25, '1ch': 29, '2ch': 36, ezd: 10,
  neh: 13, est: 10, job: 42, ps: 150, pro: 31, ecc: 12, cant: 8, esa: 66,
  jer: 52, la: 5, eze: 48, dan: 12, hos: 14, joe: 3, am: 9, abd: 1, jon: 4,
  mi: 7, nah: 3, hab: 3, soph: 3, agg: 2, zac: 14, mal: 4,
  mat: 28, mar: 16, luc: 24, jean: 21, act: 28, rom: 16, '1co': 16, '2co': 13,
  gal: 6, eph: 6, phi: 4, col: 4, '1ts': 5, '2ts': 3, '1ti': 6, '2ti': 4,
  tit: 3, phm: 1, heb: 13, jac: 5, '1pi': 5, '2pi': 3, '1jo': 5, '2jo': 1,
  '3jo': 1, jud: 1, apo: 22,
};

const CANONICAL_ORDER: string[] = Object.keys(API_BOOK_NAMES);

// ─── API response types ────────────────────────────────────────────────────

interface ApiVerse {
  verse: number;
  text: string;
  book_name: string;
  chapter: number;
}

interface ApiResponse {
  verses: ApiVerse[];
  reference: string;
  translation_id: string;
  translation_name: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCachePath(): string | null {
  try {
    const path = require('path');
    return path.join(__dirname, 'bible-complete.json');
  } catch {
    return null;
  }
}

function getFs(): any {
  try {
    return require('fs');
  } catch {
    return null;
  }
}

// ─── API fetch functions ───────────────────────────────────────────────────

async function fetchTranslation(
  bookName: string,
  chapterNum: number,
  translation: 'kjv' | 'darby' | 'segond',
): Promise<Record<number, string>> {
  const param = translation === 'kjv' ? '' : `&translation=${translation}`;
  const url = `https://bible-api.com/${bookName}+${chapterNum}?verse_numbers=true${param}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${bookName} ${chapterNum} ${translation}`);
  }

  const data: ApiResponse = await response.json();
  const verses: Record<number, string> = {};
  for (const v of data.verses) {
    verses[v.verse] = v.text.trim();
  }
  return verses;
}

async function fetchChapter(bookId: string, chapterNum: number): Promise<ChapterSeed | null> {
  const bookName = API_BOOK_NAMES[bookId];
  if (!bookName) return null;

  try {
    const [kjv, darby, lsg] = await Promise.all([
      fetchTranslation(bookName, chapterNum, 'kjv'),
      fetchTranslation(bookName, chapterNum, 'darby'),
      fetchTranslation(bookName, chapterNum, 'segond'),
    ]);

    const allVerseNums = new Set<number>([
      ...Object.keys(kjv).map(Number),
      ...Object.keys(darby).map(Number),
      ...Object.keys(lsg).map(Number),
    ]);

    const verses: VerseDatum[] = Array.from(allVerseNums)
      .sort((a, b) => a - b)
      .map((verseNum) => ({
        verse: verseNum,
        dar: darby[verseNum] || '',
        lsg: lsg[verseNum] || '',
        kjv: kjv[verseNum] || '',
      }));

    if (verses.length === 0) return null;

    return {
      bookId,
      chapter: chapterNum,
      sub: '',
      verses,
    };
  } catch (error) {
    console.warn(`[bible-complete] Failed to fetch ${bookId} ${chapterNum}: ${error}`);
    return null;
  }
}

// ─── Main function ─────────────────────────────────────────────────────────

export async function getCompleteBibleData(): Promise<ChapterSeed[]> {
  // 1) Try loading from cache file
  const fs = getFs();
  const cachePath = getCachePath();
  if (fs && cachePath) {
    try {
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, 'utf-8');
        const data: ChapterSeed[] = JSON.parse(raw);
        console.log(`[bible-complete] Loaded ${data.length} chapters from cache`);
        return data;
      }
    } catch (e) {
      console.warn('[bible-complete] Cache read failed, will fetch from API:', e);
    }
  }

  // 2) Fetch from API
  console.log('[bible-complete] Fetching all chapters from bible-api.com...');
  const results: ChapterSeed[] = [];
  let totalChapters = 0;
  let failedChapters = 0;

  for (const bookId of CANONICAL_ORDER) {
    const chapterCount = CHAPTER_COUNTS[bookId];
    for (let ch = 1; ch <= chapterCount; ch++) {
      totalChapters++;
      const chapter = await fetchChapter(bookId, ch);
      if (chapter) {
        results.push(chapter);
      } else {
        failedChapters++;
      }
      // Rate limiting: 50ms between requests
      await sleep(50);
    }
  }

  console.log(
    `[bible-complete] Done. Fetched ${results.length}/${totalChapters} chapters. ${failedChapters} failed.`,
  );

  // 3) Save to cache if possible
  if (fs && cachePath) {
    try {
      fs.writeFileSync(cachePath, JSON.stringify(results, null, 2), 'utf-8');
      console.log(`[bible-complete] Saved ${results.length} chapters to ${cachePath}`);
    } catch (e) {
      console.warn('[bible-complete] Failed to write cache:', e);
    }
  }

  return results;
}

// ─── Script execution (run directly with ts-node) ──────────────────────────

async function generateAndCache(): Promise<void> {
  console.log('[bible-complete] Starting complete Bible data generation...');
  const start = Date.now();
  const data = await getCompleteBibleData();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  let totalVerses = 0;
  for (const ch of data) {
    totalVerses += ch.verses.length;
  }

  console.log(`[bible-complete] Generation complete in ${elapsed}s`);
  console.log(`[bible-complete] ${data.length} chapters, ${totalVerses} verses across all 3 translations`);
}

// Detect direct execution (works with ts-node and node)
const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv.length >= 2 &&
  process.argv[1]?.replace(/\\/g, '/').includes('bible-complete');

if (isDirectRun) {
  generateAndCache().catch((err) => {
    console.error('[bible-complete] Fatal error:', err);
    process.exit(1);
  });
}
