export function formatDate(): string {
  const d = new Date();
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export const vkey = (b: string, c: number, v: number) => `${b}:${c}:${v}`;

import type { VersionId, Chapter } from './data/bible';
export function chapArr(chap: Chapter, v: VersionId): { v: number; t: string }[] {
  return v === 'dar' ? chap.dar : v === 'lsg' ? chap.lsg : chap.kjv;
}

export function parseReference(input: string): { bookId: string; chapter: number; verse: number } | null {
  const trim = input.trim();
  const match = trim.match(/^(\S+)\s*(\d+)\s*[.:,]\s*(\d+)$/i);
  if (!match) return null;

  const bookName = match[1];
  const chapter = parseInt(match[2], 10);
  const verse = parseInt(match[3], 10);
  if (!chapter || !verse) return null;

  const bookId = bookName.toLowerCase()
    .replace(/^1([er])?(\s|$)/, '1')
    .replace(/^2([e])?(\s|$)/, '2')
    .replace(/^3([e])?(\s|$)/, '3')
    .replace(/^st\.?\s*/i, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');

  const BOOK_ALIASES: Record<string, string> = {
    gen: 'gen', genesis: 'gen', gene: 'gen', 'genèse': 'gen',
    ex: 'ex', exode: 'ex', exodus: 'ex',
    lev: 'lev', levitique: 'lev', leviticus: 'lev',
    num: 'num', nombres: 'num', numbers: 'num',
    deu: 'deu', deuteronome: 'deu', deuteronomy: 'deu',
    jos: 'jos', josue: 'jos', joshua: 'jos',
    jug: 'jug', juges: 'jug', judges: 'jug',
    rut: 'rut', ruth: 'rut',
    '1sa': '1sa', '1samuel': '1sa', '1sa ': '1sa', 'i sa': '1sa',
    '2sa': '2sa', '2samuel': '2sa', 'ii sa': '2sa',
    '1ro': '1ro', '1rois': '1ro', 'i ro': '1ro', '1kings': '1ro',
    '2ro': '2ro', '2rois': '2ro', 'ii ro': '2ro', '2kings': '2ro',
    '1ch': '1ch', '1chroniques': '1ch', 'i ch': '1ch', '1chronicles': '1ch',
    '2ch': '2ch', '2chroniques': '2ch', 'ii ch': '2ch', '2chronicles': '2ch',
    ezd: 'ezd', esdras: 'ezd', ezra: 'ezd',
    neh: 'neh', nehemie: 'neh', nehemiah: 'neh',
    est: 'est', esther: 'est',
    job: 'job',
    ps: 'ps', psaumes: 'ps', psalms: 'ps', psaume: 'ps', psalm: 'ps',
    pro: 'pro', proverbes: 'pro', proverbs: 'pro',
    ecc: 'ecc', ecclesiastes: 'ecc', ecclesiaste: 'ecc',
    cant: 'cant', 'cantique des cantiques': 'cant', cantique: 'cant', 'song of solomon': 'cant',
    esa: 'esa', es: 'esa', 'esaïe': 'esa', isa: 'esa', isaiah: 'esa',
    jer: 'jer', jeremie: 'jer', jeremiah: 'jer',
    la: 'la', lamentations: 'la',
    eze: 'eze', ezechiel: 'eze', ezekiel: 'eze',
    dan: 'dan', daniel: 'dan',
    hos: 'hos', osee: 'hos', hosea: 'hos',
    joe: 'joe', joel: 'joe',
    am: 'am', amos: 'am',
    abd: 'abd', abdias: 'abd', obadiah: 'abd',
    jon: 'jon', jonas: 'jon', jonah: 'jon',
    mi: 'mi', michee: 'mi', micah: 'mi',
    nah: 'nah', nahum: 'nah',
    hab: 'hab', habacuc: 'hab', habakkuk: 'hab',
    soph: 'soph', sophonie: 'soph', zephaniah: 'soph',
    agg: 'agg', aggee: 'agg', haggai: 'agg',
    zac: 'zac', zacharie: 'zac', zechariah: 'zac',
    mal: 'mal', malachie: 'mal', malachi: 'mal',
    mat: 'mat', matthieu: 'mat', matthew: 'mat',
    mar: 'mar', marc: 'mar', mark: 'mar',
    luc: 'luc', luke: 'luc',
    jean: 'jean', jn: 'jean', john: 'jean',
    act: 'act', actes: 'act', acts: 'act',
    rom: 'rom', romains: 'rom', romans: 'rom',
    '1co': '1co', '1cor': '1co', '1corinthiens': '1co', 'i co': '1co', '1corinthians': '1co',
    '2co': '2co', '2cor': '2co', '2corinthiens': '2co', 'ii co': '2co', '2corinthians': '2co',
    gal: 'gal', galates: 'gal', galatians: 'gal',
    eph: 'eph', ephesiens: 'eph', ephesians: 'eph',
    phi: 'phi', philippiens: 'phi', philippians: 'phi',
    col: 'col', colossiens: 'col', colossians: 'col',
    '1ts': '1ts', '1thess': '1ts', '1thessaloniciens': '1ts', 'i ts': '1ts',
    '2ts': '2ts', '2thess': '2ts', '2thessaloniciens': '2ts', 'ii ts': '2ts',
    '1ti': '1ti', '1tim': '1ti', '1timothee': '1ti', 'i ti': '1ti', '1timothy': '1ti',
    '2ti': '2ti', '2tim': '2ti', '2timothee': '2ti', 'ii ti': '2ti', '2timothy': '2ti',
    tit: 'tit', tite: 'tit', titus: 'tit',
    phm: 'phm', philemon: 'phm',
    heb: 'heb', hebreux: 'heb', hebrews: 'heb',
    jac: 'jac', jacques: 'jac', james: 'jac',
    '1pi': '1pi', '1pier': '1pi', '1pierre': '1pi', 'i pi': '1pi', '1peter': '1pi',
    '2pi': '2pi', '2pier': '2pi', '2pierre': '2pi', 'ii pi': '2pi', '2peter': '2pi',
    '1jo': '1jo', '1jean': '1jo', 'i jo': '1jo', '1john': '1jo',
    '2jo': '2jo', '2jean': '2jo', 'ii jo': '2jo', '2john': '2jo',
    '3jo': '3jo', '3jean': '3jo', 'iii jo': '3jo', '3john': '3jo',
    jud: 'jud', jude: 'jud',
    apo: 'apo', apocalypse: 'apo', revelation: 'apo',
  };

  const matched = BOOK_ALIASES[bookId];
  return matched ? { bookId: matched, chapter, verse } : null;
}
