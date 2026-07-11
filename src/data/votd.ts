export interface VerseOfTheDay {
  bookId: string;
  chapter: number;
  verse: number;
  ref: string;
}

const LIST: VerseOfTheDay[] = [
  { bookId: 'jean', chapter: 3, verse: 16, ref: 'Jean 3:16' },
  { bookId: 'ps', chapter: 23, verse: 1, ref: 'Psaumes 23:1' },
  { bookId: 'gen', chapter: 1, verse: 1, ref: 'Genèse 1:1' },
  { bookId: 'phi', chapter: 4, verse: 13, ref: 'Philippiens 4:13' },
  { bookId: 'pro', chapter: 3, verse: 5, ref: 'Proverbes 3:5' },
  { bookId: 'rom', chapter: 8, verse: 28, ref: 'Romains 8:28' },
  { bookId: 'mat', chapter: 5, verse: 3, ref: 'Matthieu 5:3' },
  { bookId: 'jean', chapter: 14, verse: 6, ref: 'Jean 14:6' },
  { bookId: 'esa', chapter: 40, verse: 31, ref: 'Ésaïe 40:31' },
  { bookId: 'ps', chapter: 46, verse: 1, ref: 'Psaumes 46:1' },
  { bookId: 'rom', chapter: 12, verse: 2, ref: 'Romains 12:2' },
  { bookId: 'eph', chapter: 2, verse: 8, ref: 'Éphésiens 2:8' },
  { bookId: '1co', chapter: 13, verse: 4, ref: '1 Corinthiens 13:4' },
  { bookId: 'mat', chapter: 28, verse: 19, ref: 'Matthieu 28:19' },
  { bookId: 'luc', chapter: 1, verse: 37, ref: 'Luc 1:37' },
  { bookId: 'heb', chapter: 11, verse: 1, ref: 'Hébreux 11:1' },
  { bookId: '1pi', chapter: 5, verse: 7, ref: '1 Pierre 5:7' },
  { bookId: 'jos', chapter: 1, verse: 9, ref: 'Josué 1:9' },
  { bookId: 'ps', chapter: 119, verse: 105, ref: 'Psaumes 119:105' },
  { bookId: 'jer', chapter: 29, verse: 11, ref: 'Jérémie 29:11' },
  { bookId: '2co', chapter: 5, verse: 17, ref: '2 Corinthiens 5:17' },
  { bookId: 'gal', chapter: 5, verse: 22, ref: 'Galates 5:22' },
  { bookId: 'mat', chapter: 11, verse: 28, ref: 'Matthieu 11:28' },
  { bookId: 'apo', chapter: 3, verse: 20, ref: 'Apocalypse 3:20' },
];

export function getVerseOfTheDay(): VerseOfTheDay {
  const idx = Math.floor(Date.now() / 86400000 + new Date().getFullYear()) % LIST.length;
  return LIST[idx];
}
