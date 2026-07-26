// bible-data.ts — Complete Bible structure: 66 books with chapter counts
// Books are listed canonically with testament classification.
// Chapters are bundled in the SQLite database.

export type Testament = 'Ancien Testament' | 'Nouveau Testament';

export type BookCategory =
  | 'Loi'
  | 'Histoire'
  | 'Poésie & Sagesse'
  | 'Prophètes majeurs'
  | 'Prophètes mineurs'
  | 'Évangiles'
  | 'Épîtres pauliniennes'
  | 'Épîtres générales'
  | 'Apocalypse';

export interface BookStructure {
  id: string;
  name: string;
  nameEn: string;
  testament: Testament;
  category: BookCategory;
  chapterCount: number;
}

// ─── 66-book canonical order ──────────────────────────────────────────────

const BOOK_NAMES: Record<string, { name: string; nameEn: string }> = {
  gen: { name: 'Genèse', nameEn: 'Genesis' },
  ex: { name: 'Exode', nameEn: 'Exodus' },
  lev: { name: 'Lévitique', nameEn: 'Leviticus' },
  num: { name: 'Nombres', nameEn: 'Numbers' },
  deu: { name: 'Deutéronome', nameEn: 'Deuteronomy' },
  jos: { name: 'Josué', nameEn: 'Joshua' },
  jug: { name: 'Juges', nameEn: 'Judges' },
  rut: { name: 'Ruth', nameEn: 'Ruth' },
  '1sa': { name: '1 Samuel', nameEn: '1 Samuel' },
  '2sa': { name: '2 Samuel', nameEn: '2 Samuel' },
  '1ro': { name: '1 Rois', nameEn: '1 Kings' },
  '2ro': { name: '2 Rois', nameEn: '2 Kings' },
  '1ch': { name: '1 Chroniques', nameEn: '1 Chronicles' },
  '2ch': { name: '2 Chroniques', nameEn: '2 Chronicles' },
  ezd: { name: 'Esdras', nameEn: 'Ezra' },
  neh: { name: 'Néhémie', nameEn: 'Nehemiah' },
  est: { name: 'Esther', nameEn: 'Esther' },
  job: { name: 'Job', nameEn: 'Job' },
  ps: { name: 'Psaumes', nameEn: 'Psalms' },
  pro: { name: 'Proverbes', nameEn: 'Proverbs' },
  ecc: { name: 'Ecclésiaste', nameEn: 'Ecclesiastes' },
  cant: { name: 'Cantique des Cantiques', nameEn: 'Song of Solomon' },
  esa: { name: 'Ésaïe', nameEn: 'Isaiah' },
  jer: { name: 'Jérémie', nameEn: 'Jeremiah' },
  la: { name: 'Lamentations', nameEn: 'Lamentations' },
  eze: { name: 'Ézéchiel', nameEn: 'Ezekiel' },
  dan: { name: 'Daniel', nameEn: 'Daniel' },
  hos: { name: 'Osée', nameEn: 'Hosea' },
  joe: { name: 'Joël', nameEn: 'Joel' },
  am: { name: 'Amos', nameEn: 'Amos' },
  abd: { name: 'Abdias', nameEn: 'Obadiah' },
  jon: { name: 'Jonas', nameEn: 'Jonah' },
  mi: { name: 'Michée', nameEn: 'Micah' },
  nah: { name: 'Nahum', nameEn: 'Nahum' },
  hab: { name: 'Habacuc', nameEn: 'Habakkuk' },
  soph: { name: 'Sophonie', nameEn: 'Zephaniah' },
  agg: { name: 'Aggée', nameEn: 'Haggai' },
  zac: { name: 'Zacharie', nameEn: 'Zechariah' },
  mal: { name: 'Malachie', nameEn: 'Malachi' },
  mat: { name: 'Matthieu', nameEn: 'Matthew' },
  mar: { name: 'Marc', nameEn: 'Mark' },
  luc: { name: 'Luc', nameEn: 'Luke' },
  jean: { name: 'Jean', nameEn: 'John' },
  act: { name: 'Actes', nameEn: 'Acts' },
  rom: { name: 'Romains', nameEn: 'Romans' },
  '1co': { name: '1 Corinthiens', nameEn: '1 Corinthians' },
  '2co': { name: '2 Corinthiens', nameEn: '2 Corinthians' },
  gal: { name: 'Galates', nameEn: 'Galatians' },
  eph: { name: 'Éphésiens', nameEn: 'Ephesians' },
  phi: { name: 'Philippiens', nameEn: 'Philippians' },
  col: { name: 'Colossiens', nameEn: 'Colossians' },
  '1ts': { name: '1 Thessaloniciens', nameEn: '1 Thessalonians' },
  '2ts': { name: '2 Thessaloniciens', nameEn: '2 Thessalonians' },
  '1ti': { name: '1 Timothée', nameEn: '1 Timothy' },
  '2ti': { name: '2 Timothée', nameEn: '2 Timothy' },
  tit: { name: 'Tite', nameEn: 'Titus' },
  phm: { name: 'Philémon', nameEn: 'Philemon' },
  heb: { name: 'Hébreux', nameEn: 'Hebrews' },
  jac: { name: 'Jacques', nameEn: 'James' },
  '1pi': { name: '1 Pierre', nameEn: '1 Peter' },
  '2pi': { name: '2 Pierre', nameEn: '2 Peter' },
  '1jo': { name: '1 Jean', nameEn: '1 John' },
  '2jo': { name: '2 Jean', nameEn: '2 John' },
  '3jo': { name: '3 Jean', nameEn: '3 John' },
  jud: { name: 'Jude', nameEn: 'Jude' },
  apo: { name: 'Apocalypse', nameEn: 'Revelation' },
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

// ─── Category per book (traditional biblical grouping) ────────────────────

const BOOK_CATEGORY: Record<string, BookCategory> = {
  // Ancien Testament — Loi (Pentateuque)
  gen: 'Loi', ex: 'Loi', lev: 'Loi', num: 'Loi', deu: 'Loi',
  // Ancien Testament — Histoire
  jos: 'Histoire', jug: 'Histoire', rut: 'Histoire', '1sa': 'Histoire',
  '2sa': 'Histoire', '1ro': 'Histoire', '2ro': 'Histoire', '1ch': 'Histoire',
  '2ch': 'Histoire', ezd: 'Histoire', neh: 'Histoire', est: 'Histoire',
  // Ancien Testament — Poésie & Sagesse
  job: 'Poésie & Sagesse', ps: 'Poésie & Sagesse', pro: 'Poésie & Sagesse',
  ecc: 'Poésie & Sagesse', cant: 'Poésie & Sagesse',
  // Ancien Testament — Prophètes majeurs
  esa: 'Prophètes majeurs', jer: 'Prophètes majeurs', la: 'Prophètes majeurs',
  eze: 'Prophètes majeurs', dan: 'Prophètes majeurs',
  // Ancien Testament — Prophètes mineurs
  hos: 'Prophètes mineurs', joe: 'Prophètes mineurs', am: 'Prophètes mineurs',
  abd: 'Prophètes mineurs', jon: 'Prophètes mineurs', mi: 'Prophètes mineurs',
  nah: 'Prophètes mineurs', hab: 'Prophètes mineurs', soph: 'Prophètes mineurs',
  agg: 'Prophètes mineurs', zac: 'Prophètes mineurs', mal: 'Prophètes mineurs',
  // Nouveau Testament — Évangiles
  mat: 'Évangiles', mar: 'Évangiles', luc: 'Évangiles', jean: 'Évangiles',
  // Nouveau Testament — Histoire
  act: 'Histoire',
  // Nouveau Testament — Épîtres pauliniennes
  rom: 'Épîtres pauliniennes', '1co': 'Épîtres pauliniennes', '2co': 'Épîtres pauliniennes',
  gal: 'Épîtres pauliniennes', eph: 'Épîtres pauliniennes', phi: 'Épîtres pauliniennes',
  col: 'Épîtres pauliniennes', '1ts': 'Épîtres pauliniennes', '2ts': 'Épîtres pauliniennes',
  '1ti': 'Épîtres pauliniennes', '2ti': 'Épîtres pauliniennes', tit: 'Épîtres pauliniennes',
  phm: 'Épîtres pauliniennes',
  // Nouveau Testament — Épîtres générales
  heb: 'Épîtres générales', jac: 'Épîtres générales', '1pi': 'Épîtres générales',
  '2pi': 'Épîtres générales', '1jo': 'Épîtres générales', '2jo': 'Épîtres générales',
  '3jo': 'Épîtres générales', jud: 'Épîtres générales',
  // Nouveau Testament — Apocalypse
  apo: 'Apocalypse',
};

// Display order of categories within each testament.
export const CATEGORIES_BY_TESTAMENT: Record<Testament, BookCategory[]> = {
  'Ancien Testament': [
    'Loi', 'Histoire', 'Poésie & Sagesse', 'Prophètes majeurs', 'Prophètes mineurs',
  ],
  'Nouveau Testament': [
    'Évangiles', 'Histoire', 'Épîtres pauliniennes', 'Épîtres générales', 'Apocalypse',
  ],
};

// ─── Canonical order ──────────────────────────────────────────────────────

export const CANONICAL_ORDER: string[] = Object.keys(BOOK_NAMES);

// ─── Build book metadata with testament ───────────────────────────────────

const OT_IDS: readonly string[] = [
  'gen', 'ex', 'lev', 'num', 'deu', 'jos', 'jug', 'rut', '1sa', '2sa',
  '1ro', '2ro', '1ch', '2ch', 'ezd', 'neh', 'est', 'job', 'ps', 'pro',
  'ecc', 'cant', 'esa', 'jer', 'la', 'eze', 'dan', 'hos', 'joe', 'am',
  'abd', 'jon', 'mi', 'nah', 'hab', 'soph', 'agg', 'zac', 'mal',
];
const OT_SET = new Set(OT_IDS);

const ALL_BOOKS: BookStructure[] = CANONICAL_ORDER.map((id) => ({
  id,
  name: BOOK_NAMES[id].name,
  nameEn: BOOK_NAMES[id].nameEn,
  testament: (OT_SET.has(id) ? 'Ancien Testament' : 'Nouveau Testament') as Testament,
  category: BOOK_CATEGORY[id],
  chapterCount: CHAPTER_COUNTS[id],
}));

const BOOK_BY_ID_MAP = new Map<string, BookStructure>(ALL_BOOKS.map((b) => [b.id, b]));

// ─── Public API ────────────────────────────────────────────────────────────

export function getAllBooks(): BookStructure[] {
  return ALL_BOOKS;
}

export function getBookById(id: string): BookStructure | undefined {
  return BOOK_BY_ID_MAP.get(id);
}

export interface BookCategoryGroup {
  category: BookCategory;
  books: BookStructure[];
}

/**
 * Returns the books of a testament grouped by category, in canonical
 * category order. Used to render a well-organised, browsable book list.
 */
export function getBookGroupsByTestament(testament: Testament): BookCategoryGroup[] {
  return CATEGORIES_BY_TESTAMENT[testament]
    .map((category) => ({
      category,
      books: ALL_BOOKS.filter((b) => b.testament === testament && b.category === category),
    }))
    .filter((g) => g.books.length > 0);
}

/** Case- and accent-insensitive search across French and English book names. */
export function searchBooks(query: string): BookStructure[] {
  const q = normalizeText(query);
  if (q.length === 0) return [];
  return ALL_BOOKS.filter((b) => {
    const hay = `${normalizeText(b.name)} ${normalizeText(b.nameEn)} ${b.id}`;
    return hay.includes(q);
  });
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}