import { useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VersionId, Chapter } from '../data/bible';
import { CANONICAL_ORDER, getBookById } from '../data/bible-data';
import { colors as C, space as S, HL_COLORS } from '../theme';

const vkey = (b: string, i: number) => `${b}:${i}`;
const DEFAULT_CHAPTERS: Record<string, number> = { gen: 1, ps: 23, jean: 3 };

function getVerses(chapter: Chapter, idx: number): { text: string; verseNumber: number } {
  const verseNumber = chapter.verseNumbers[idx] ?? idx + 1;
  const text = chapter.text.dar?.[idx] ?? chapter.text.lsg?.[idx] ?? chapter.text.kjv?.[idx] ?? '';
  return { text, verseNumber };
}

export default function ReaderScreen({ book, version, readSize, hl, fav, playing, playBook, readIdx, chapterData, onSelectVerse, onPrevBook, onNextBook, downloading, onDownloadChapter }: {
  book: string; version: VersionId; readSize: number; hl: Record<string, string>; fav: Record<string, true>;
  playing: boolean; playBook: string; readIdx: number; chapterData?: Chapter | null;
  onSelectVerse: (i: number) => void; onPrevBook: () => void; onNextBook: () => void;
  downloading: Record<string, boolean>; onDownloadChapter: (bookId: string, chapterNum: number) => void;
}) {
  const chap = chapterData;
  const arr = chap?.text[version] ?? [];
  const scrollRef = useRef<ScrollView>(null);
  const pos = CANONICAL_ORDER.indexOf(book);
  const prev = CANONICAL_ORDER[pos - 1]; const next = CANONICAL_ORDER[pos + 1];
  const hasContent = !!chapterData;
  const dlKey = `${book}:${DEFAULT_CHAPTERS[book] || 1}`;
  const isDl = downloading[dlKey];
  const scrollYRef = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    scrollYRef.current = 0;
  }, [book]);

  if (!hasContent) {
    return (
      <ScrollView contentContainerStyle={{ padding: S.s6, paddingTop: S.s10, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Ionicons name="cloud-download-outline" size={48} color={C.inkFaint} />
          <Text style={{ color: C.inkSoft, marginTop: S.s4, textAlign: 'center', fontSize: 15 }}>
            Ce chapitre n'est pas encore téléchargé.
          </Text>
          <Pressable onPress={() => onDownloadChapter(book, DEFAULT_CHAPTERS[book] || 1)} style={styles.downloadBtn}>
            <Ionicons name="download-outline" size={16} color={C.paper} />
            <Text style={styles.downloadBtnTxt}>  {isDl ? 'Téléchargement…' : 'Télécharger'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={{ padding: S.s6, paddingTop: S.s10, paddingBottom: 150 }}
      showsVerticalScrollIndicator={false}
      onScroll={(e) => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
      scrollEventThrottle={16}>
      <View style={styles.chapHead}>
        <Text style={styles.chapBook}>{chap!.name.toUpperCase()}</Text>
        <View style={styles.flourish}>
          <View style={styles.flLine} />
          <Text style={styles.chapNum}>{chap!.chapter}</Text>
          <View style={styles.flLine} />
        </View>
        <Text style={styles.chapSub}>{chap!.sub}</Text>
      </View>

      <Text style={{ fontSize: readSize, lineHeight: readSize * 1.8, color: C.ink }}>
        {arr.map((t: string, i: number) => {
          const k = vkey(book, i);
          const bg = playing && book === playBook && i === readIdx
            ? C.hlReading : hl[k] ? HL_COLORS[hl[k]] : 'transparent';
          const vn = chap!.verseNumbers[i] ?? i + 1;
          return (
            <Text key={i} onPress={() => onSelectVerse(i)}
              style={{ backgroundColor: bg, borderRadius: 6 }}>
              <Text style={styles.vn}>{vn} </Text>
              {t}
              {fav[k] ? <Text style={{ color: C.gold }}> ●</Text> : null}
              {'  '}
            </Text>
          );
        })}
      </Text>

      <View style={styles.chapNav}>
        <Pressable style={[styles.chapNavBtn, !prev && { opacity: 0.4 }]} disabled={!prev} onPress={onPrevBook}>
          <Ionicons name="arrow-back" size={16} color={C.inkSoft} />
          <Text style={styles.chapNavTxt}>  {prev ? (getBookById(prev)?.name ?? prev) : 'Début'}</Text>
        </Pressable>
        <Pressable style={[styles.chapNavBtn, !next && { opacity: 0.4 }]} disabled={!next} onPress={onNextBook}>
          <Text style={styles.chapNavTxt}>{next ? (getBookById(next)?.name ?? next) : 'Fin'}  </Text>
          <Ionicons name="arrow-forward" size={16} color={C.inkSoft} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chapHead: { alignItems: 'center', marginBottom: S.s10 },
  chapBook: { fontSize: 12, fontWeight: '700', letterSpacing: 2.5, color: C.accent, marginBottom: S.s4 },
  flourish: { flexDirection: 'row', alignItems: 'center', gap: S.s4 },
  flLine: { height: 1, width: 48, backgroundColor: C.lineStrong },
  chapNum: { fontSize: 64, fontWeight: '600', color: C.ink, letterSpacing: -1 },
  chapSub: { fontSize: 15, fontStyle: 'italic', color: C.inkFaint, marginTop: S.s4 },
  vn: { fontSize: 11, fontWeight: '700', color: C.accent, lineHeight: 0 },
  chapNav: { flexDirection: 'row', justifyContent: 'space-between', gap: S.s3, marginTop: S.s12 },
  chapNavBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: 14, paddingVertical: 15 },
  chapNavTxt: { fontSize: 13, fontWeight: '600', color: C.inkSoft },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, marginTop: S.s4 },
  downloadBtnTxt: { color: C.paper, fontSize: 15, fontWeight: '600', marginLeft: S.s1 },
});
