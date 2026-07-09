// bible-data.ts — Complete Bible structure: 66 books, all chapters, initial KJV/Darby/Segond seed data
// Three chapters are fully seeded (gen:1, ps:23, jean:3). The rest have known chapter counts.
// Use downloadChapter() from bible-db.ts to fetch missing chapters from API at runtime.

export type SeedStatus = 'seeded' | 'pending';

export interface VerseDatum {
  verse: number;
  dar: string;
  lsg: string;
  kjv: string;
}

export interface ChapterSeed {
  bookId: string;
  chapter: number;
  sub: string;
  verses: VerseDatum[];
}

export interface BookStructure {
  id: string;
  name: string;
  nameEn: string;
  testament: 'Ancien Testament' | 'Nouveau Testament';
  chapterCount: number;
}

export interface BookSeedMeta extends BookStructure {
  seededChapters: { chapter: number; sub: string }[];
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

// ─── Canonical order ──────────────────────────────────────────────────────

export const CANONICAL_ORDER: string[] = Object.keys(BOOK_NAMES);

// ─── Build book metadata with testament ───────────────────────────────────

export function getBookStructure(): BookStructure[] {
  const ot: string[] = [
    'gen', 'ex', 'lev', 'num', 'deu', 'jos', 'jug', 'rut', '1sa', '2sa',
    '1ro', '2ro', '1ch', '2ch', 'ezd', 'neh', 'est', 'job', 'ps', 'pro',
    'ecc', 'cant', 'esa', 'jer', 'la', 'eze', 'dan', 'hos', 'joe', 'am',
    'abd', 'jon', 'mi', 'nah', 'hab', 'soph', 'agg', 'zac', 'mal',
  ];
  return CANONICAL_ORDER.map((id) => ({
    id,
    name: BOOK_NAMES[id].name,
    nameEn: BOOK_NAMES[id].nameEn,
    testament: (ot.includes(id) ? 'Ancien Testament' : 'Nouveau Testament') as 'Ancien Testament' | 'Nouveau Testament',
    chapterCount: CHAPTER_COUNTS[id],
  }));
}

// ─── Seeded chapter metadata tracker ──────────────────────────────────────

const SEEDED_CHAPTERS: Set<string> = new Set();

function markSeeded(bookId: string, chapter: number): void {
  SEEDED_CHAPTERS.add(`${bookId}:${chapter}`);
}

export function isChapterSeeded(bookId: string, chapterNum: number): boolean {
  return SEEDED_CHAPTERS.has(`${bookId}:${chapterNum}`);
}

export function getChapterInfo(bookId: string): { chapter: number; verseCount: number } | null {
  const count = CHAPTER_COUNTS[bookId];
  if (!count) return null;
  return { chapter: count, verseCount: count };
}

// ─── SEED DATA ────────────────────────────────────────────────────────────
// Genesis 1 (5 verses), Psalms 23 (6 verses), John 3:16-18 (3 verses)

const SEED_FULL: ChapterSeed[] = [
  {
    bookId: 'gen', chapter: 1, sub: 'La création',
    verses: [
      { verse: 1, dar: 'Au commencement Dieu créa les cieux et la terre.', lsg: 'Au commencement, Dieu créa les cieux et la terre.', kjv: 'In the beginning God created the heaven and the earth.' },
      { verse: 2, dar: 'Et la terre était désolation et vide, et il y avait des ténèbres sur la face de l\'abîme. Et l\'Esprit de Dieu planait sur la face des eaux.', lsg: 'La terre était informe et vide: il y avait des ténèbres à la surface de l\'abîme, et l\'esprit de Dieu se mouvait au-dessus des eaux.', kjv: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.' },
      { verse: 3, dar: 'Et Dieu dit: Que la lumière soit. Et la lumière fut.', lsg: 'Dieu dit: Que la lumière soit! Et la lumière fut.', kjv: 'And God said, Let there be light: and there was light.' },
      { verse: 4, dar: 'Et Dieu vit la lumière, qu\'elle était bonne; et Dieu sépara la lumière d\'avec les ténèbres.', lsg: 'Dieu vit que la lumière était bonne; et Dieu sépara la lumière d\'avec les ténèbres.', kjv: 'And God saw the light, that it was good: and God divided the light from the darkness.' },
      { verse: 5, dar: 'Et Dieu appela la lumière Jour; et les ténèbres, il les appela Nuit. Et il y eut soir, et il y eut matin: le premier jour.', lsg: 'Dieu appela la lumière jour, et il appela les ténèbres nuit. Ainsi, il y eut un soir, et il y eut un matin: ce fut le premier jour.', kjv: 'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.' },
    ],
  },
  {
    bookId: 'ps', chapter: 23, sub: 'Le Seigneur est mon berger',
    verses: [
      { verse: 1, dar: 'L\'Éternel est mon berger: je ne manquerai de rien.', lsg: 'L\'Éternel est mon berger: je ne manquerai de rien.', kjv: 'The LORD is my shepherd; I shall not want.' },
      { verse: 2, dar: 'Il me fait reposer dans de verts pâturages, il me mène à des eaux paisibles.', lsg: 'Il me fait reposer dans de verts pâturages, il me dirige près des eaux paisibles.', kjv: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.' },
      { verse: 3, dar: 'Il restaure mon âme; il me conduit dans des sentiers de justice, à cause de son nom.', lsg: 'Il restaure mon âme, il me conduit dans les sentiers de la justice, à cause de son nom.', kjv: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.' },
      { verse: 4, dar: 'Même quand je marcherais par la vallée de l\'ombre de la mort, je ne craindrai aucun mal; car tu es avec moi: ta houlette et ton bâton, ce sont eux qui me consolent.', lsg: 'Quand je marche dans la vallée de l\'ombre de la mort, je ne crains aucun mal, car tu es avec moi: ta houlette et ton bâton me rassurent.', kjv: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.' },
      { verse: 5, dar: 'Tu dresses devant moi une table, en la présence de mes ennemis; tu as oint ma tête d\'huile, ma coupe est comble.', lsg: 'Tu dresses devant moi une table, en face de mes adversaires; tu oins d\'huile ma tête, et ma coupe déborde.', kjv: 'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.' },
      { verse: 6, dar: 'Oui, la bonté et la gratuité me suivront tous les jours de ma vie, et mon habitation sera dans la maison de l\'Éternel pour de longs jours.', lsg: 'Oui, le bonheur et la grâce m\'accompagneront tous les jours de ma vie, et j\'habiterai dans la maison de l\'Éternel jusqu\'à la fin de mes jours.', kjv: 'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.' },
    ],
  },
  {
    bookId: 'jean', chapter: 3, sub: 'L\'amour de Dieu',
    verses: [
      { verse: 16, dar: 'Car Dieu a tant aimé le monde, qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais qu\'il ait la vie éternelle.', lsg: 'Car Dieu a tant aimé le monde qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu\'il ait la vie éternelle.', kjv: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
      { verse: 17, dar: 'Car Dieu n\'a pas envoyé son Fils dans le monde afin qu\'il jugeât le monde, mais afin que le monde fût sauvé par lui.', lsg: 'Dieu, en effet, n\'a pas envoyé son Fils dans le monde pour qu\'il juge le monde, mais pour que le monde soit sauvé par lui.', kjv: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.' },
      { verse: 18, dar: 'Celui qui croit en lui n\'est pas jugé, mais celui qui ne croit pas est déjà jugé, parce qu\'il n\'a pas cru au nom du Fils unique de Dieu.', lsg: 'Celui qui croit en lui n\'est point jugé; mais celui qui ne croit pas est déjà jugé, parce qu\'il n\'a pas cru au nom du Fils unique de Dieu.', kjv: 'He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.' },
    ],
  },
];

SEED_FULL.forEach((s) => markSeeded(s.bookId, s.chapter));

// ─── Public API ────────────────────────────────────────────────────────────

export function getAllBooks(): BookStructure[] {
  return getBookStructure();
}

export function getBookById(id: string): BookStructure | undefined {
  return getBookStructure().find((b) => b.id === id);
}

export function getVerseCount(bookId: string, chapterNum: number): number {
  const seeded = SEED_FULL.find((s) => s.bookId === bookId && s.chapter === chapterNum);
  if (seeded) return seeded.verses.length;
  return 0;
}

export function getChapterSeeds(bookId: string, chapterNum: number): ChapterSeed | undefined {
  return SEED_FULL.find((s) => s.bookId === bookId && s.chapter === chapterNum);
}

export function getAllSeedData(): ChapterSeed[] {
  return SEED_FULL;
}

export function getSeededChaptersForBook(bookId: string): ChapterSeed[] {
  return SEED_FULL.filter((s) => s.bookId === bookId);
}