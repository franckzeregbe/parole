// bible-complete.ts — Fetches ALL 66 books x all chapters x 3 translations
//
// SOURCES (switched from bible-api.com to midvash/bible-data):
//   KJV     -> https://github.com/midvash/bible-data (en/kjv) — King James Version
//   Darby   -> https://github.com/midvash/bible-data (fr/darby-fr) — Bible Darby Française
//   Segond  -> https://github.com/midvash/bible-data (fr/lsg) — Louis Segond 1910
//
// WHY THE SWITCH?
//   bible-api.com does NOT support Louis Segond (French) — all Segond requests returned 404.
//   bible-api.com also returns ENGLISH Darby, but the app expects FRENCH Darby (seed data
//   confirms dar fields contain French text). bible-api.com rate-limits at 15 req/30s (HTTP 429),
//   and the User Input API chokes on hyphenated book names like "1-corinthians" (HTTP 400).
//
//   The midvash/bible-data project (github.com/midvash/bible-data) provides all three
//   translations as public-domain JSON, served via GitHub's raw CDN (no rate limits),
//   with clean OSIS book codes and the correct French Darby text.
//
// Run: npx ts-node src/data/bible-complete.ts   (generates bible-complete.json cache)
// Import: import { getCompleteBibleData } from './bible-complete'

interface VerseDatum { verse: number; dar: string; lsg: string; kjv: string; }
interface ChapterSeed { bookId: string; chapter: number; sub: string; verses: VerseDatum[]; }

// ─── OSIS book codes for midvash/bible-data ──────────────────────────

const OSIS_BOOK_NAMES: Record<string, string> = {
  gen: 'Gen', ex: 'Exod', lev: 'Lev', num: 'Num', deu: 'Deut',
  jos: 'Josh', jug: 'Judg', rut: 'Ruth',
  '1sa': '1Sam', '2sa': '2Sam', '1ro': '1Kgs', '2ro': '2Kgs',
  '1ch': '1Chr', '2ch': '2Chr', ezd: 'Ezra', neh: 'Neh',
  est: 'Esth', job: 'Job', ps: 'Ps', pro: 'Prov',
  ecc: 'Eccl', cant: 'Song', esa: 'Isa', jer: 'Jer',
  la: 'Lam', eze: 'Ezek', dan: 'Dan', hos: 'Hos',
  joe: 'Joel', am: 'Amos', abd: 'Obad', jon: 'Jonah',
  mi: 'Mic', nah: 'Nah', hab: 'Hab', soph: 'Zeph',
  agg: 'Hag', zac: 'Zech', mal: 'Mal',
  mat: 'Matt', mar: 'Mark', luc: 'Luke', jean: 'John',
  act: 'Acts', rom: 'Rom', '1co': '1Cor', '2co': '2Cor',
  gal: 'Gal', eph: 'Eph', phi: 'Phil', col: 'Col',
  '1ts': '1Thess', '2ts': '2Thess', '1ti': '1Tim', '2ti': '2Tim',
  tit: 'Titus', phm: 'Phlm', heb: 'Heb', jac: 'Jas',
  '1pi': '1Pet', '2pi': '2Pet', '1jo': '1John', '2jo': '2John',
  '3jo': '3John', jud: 'Jude', apo: 'Rev',
};

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

const CANONICAL_ORDER: string[] = Object.keys(OSIS_BOOK_NAMES);

// ─── Midvash config ──────────────────────────────────────────────────

const MIDVASH_BASE = 'https://raw.githubusercontent.com/midvash/bible-data/main/versions';
const VERSION_MAP: Record<string, string> = {
  kjv: 'en/kjv',
  darby: 'fr/darby-fr',
  lsg: 'fr/lsg',
};

// ─── API response types ──────────────────────────────────────────────

interface MvVerse {
  number: number;
  text: string;
}

interface MvChapter {
  chapter: number;
  verses: MvVerse[];
}

interface MvBook {
  version: string;
  book: string;
  bookId: number;
  englishName: string;
  testament: string;
  chapters: MvChapter[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

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

async function fetchWithRetry(url: string, retries = 5): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url);
    if (response.ok) return response;
    if (response.status === 429 && attempt < retries - 1) {
      const delay = Math.pow(2, attempt + 1) * 1000;
      console.warn(`  [429] Rate limited, retry ${attempt + 1}/${retries} in ${delay}ms`);
      await sleep(delay);
      continue;
    }
    if (response.status === 404) {
      return response;
    }
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  throw new Error(`Failed after ${retries} retries: ${url}`);
}

async function fetchMidvashBook(versionKey: string, osisBook: string): Promise<MvBook | null> {
  const url = `${MIDVASH_BASE}/${VERSION_MAP[versionKey]}/books/${osisBook}.json`;
  try {
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      if (res.status === 404) {
        console.warn(`  [404] ${versionKey} book '${osisBook}' not found`);
      }
      return null;
    }
    return (await res.json()) as MvBook;
  } catch (err: any) {
    console.warn(`  Failed ${versionKey}/${osisBook}: ${err.message}`);
    return null;
  }
}

function saveCache(fs: any, cachePath: string | null, data: ChapterSeed[]): void {
  if (fs && cachePath) {
    try {
      fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[bible-complete] Failed to write cache:', e);
    }
  }
}

// ─── Main fetch function ─────────────────────────────────────────────

export async function getCompleteBibleData(): Promise<ChapterSeed[]> {
  const fs = getFs();
  const cachePath = getCachePath();
  const results: ChapterSeed[] = [];
  const fetchedKeys = new Set<string>();

  // 1) Resume from cache if it exists
  if (fs && cachePath) {
    try {
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, 'utf-8');
        const data: ChapterSeed[] = JSON.parse(raw);
        for (const ch of data) {
          results.push(ch);
          fetchedKeys.add(`${ch.bookId}:${ch.chapter}`);
        }
        console.log(`[bible-complete] Loaded ${results.length} chapters from cache (${fetchedKeys.size} keys)`);
      }
    } catch (e) {
      console.warn('[bible-complete] Cache read failed, will re-fetch:', e);
    }
  }

  // 2) Compute total across all books
  let totalExpected = 0;
  for (const bookId of CANONICAL_ORDER) {
    totalExpected += CHAPTER_COUNTS[bookId];
  }

  console.log(`[bible-complete] ${fetchedKeys.size}/${totalExpected} chapters cached. Starting fetch...`);

  let fetchedCount = 0;
  let failedCount = 0;
  let segondWarnings = 0;

  for (const bookId of CANONICAL_ORDER) {
    const chapterCount = CHAPTER_COUNTS[bookId];
    const osisName = OSIS_BOOK_NAMES[bookId];

    // Skip book if all chapters already in cache
    let allCached = true;
    for (let ch = 1; ch <= chapterCount; ch++) {
      if (!fetchedKeys.has(`${bookId}:${ch}`)) {
        allCached = false;
        break;
      }
    }
    if (allCached) {
      console.log(`[  OK  ] ${bookId} - all ${chapterCount} chapters cached, skipping`);
      continue;
    }

    console.log(`[FETCH ] ${bookId} (${osisName}) - ${chapterCount} chapters`);

    const [kjvBook, lsgBook, darbyBook] = await Promise.all([
      fetchMidvashBook('kjv', osisName),
      fetchMidvashBook('lsg', osisName),
      fetchMidvashBook('darby', osisName),
    ]);

    const getVerse = (book: MvBook | null, ch: number, verseNum: number): string => {
      const chapter = book?.chapters?.find((c) => c.chapter === ch);
      return chapter?.verses?.find((v) => v.number === verseNum)?.text?.trim() || '';
    };

    for (let ch = 1; ch <= chapterCount; ch++) {
      const key = `${bookId}:${ch}`;
      if (fetchedKeys.has(key)) continue;

      const kjvCh = kjvBook?.chapters?.find((c) => c.chapter === ch);
      const lsgCh = lsgBook?.chapters?.find((c) => c.chapter === ch);
      const darbyCh = darbyBook?.chapters?.find((c) => c.chapter === ch);

      const allVerseNums = new Set<number>();
      if (kjvCh) kjvCh.verses.forEach((v) => allVerseNums.add(v.number));
      if (lsgCh) lsgCh.verses.forEach((v) => allVerseNums.add(v.number));
      if (darbyCh) darbyCh.verses.forEach((v) => allVerseNums.add(v.number));

      if (allVerseNums.size === 0) {
        failedCount++;
        continue;
      }

      if (!lsgCh) {
        segondWarnings++;
      }

      const verses: VerseDatum[] = Array.from(allVerseNums)
        .sort((a, b) => a - b)
        .map((verseNum) => ({
          verse: verseNum,
          dar: getVerse(darbyBook, ch, verseNum),
          lsg: getVerse(lsgBook, ch, verseNum),
          kjv: getVerse(kjvBook, ch, verseNum),
        }));

      results.push({ bookId, chapter: ch, sub: '', verses });
      fetchedKeys.add(key);
      fetchedCount++;
    }

    // Incremental save after each book
    saveCache(fs, cachePath, results);

    // Brief delay to be kind to GitHub's CDN
    await sleep(200);
  }

  console.log(
    `[bible-complete] Done. Fetched ${fetchedCount} new chapters. ` +
    `${totalExpected - fetchedKeys.size + fetchedCount} total. ` +
    `${failedCount} failed. ${segondWarnings} Segond-missing chapters.`,
  );

  // 3) Final save
  saveCache(fs, cachePath, results);

  return results;
}

// ─── Direct execution ────────────────────────────────────────────────

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
