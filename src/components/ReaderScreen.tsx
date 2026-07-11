import { useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VersionId, Chapter } from '../data/bible';
import { CANONICAL_ORDER, getBookById } from '../data/bible-data';
import { colors as C, space as S, HL_COLORS } from '../theme';

const vkey = (b: string, c: number, v: number) => `${b}:${c}:${v}`;

export default function ReaderScreen({ book, chapter, version, readSize, hl, fav, playing, playBook, playChapter, readIdx, chapterData, onSelectVerse, onPrevBook, onNextBook, onPrevChapter, onNextChapter, onGoToChapter }: {
  book: string; chapter: number; version: VersionId; readSize: number; hl: Record<string, string>; fav: Record<string, true>;
  playing: boolean; playBook: string; playChapter: number; readIdx: number; chapterData?: Chapter | null;
  onSelectVerse: (i: number) => void; onPrevBook: () => void; onNextBook: () => void;
  onPrevChapter: () => void; onNextChapter: () => void; onGoToChapter: (n: number) => void;
}) {
  const chap = chapterData;
  const arr = chap?.text[version] ?? [];
  const scrollRef = useRef<ScrollView>(null);
  const pos = CANONICAL_ORDER.indexOf(book);
  const prev = CANONICAL_ORDER[pos - 1]; const next = CANONICAL_ORDER[pos + 1];
  const hasContent = !!chapterData;
  const scrollYRef = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    scrollYRef.current = 0;
  }, [book]);

  if (!hasContent) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 150 }}>
        <Text style={{ color: C.inkSoft, fontSize: 15 }}>Chargement…</Text>
      </View>
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chapStrip}>
        {Array.from({ length: getBookById(book)?.chapterCount ?? 0 }, (_, n) => n + 1).map((n) => (
          <Pressable key={n} onPress={() => onGoToChapter(n)}
            style={[styles.chapPill, chapter === n && styles.chapPillActive]}>
            <Text style={[styles.chapPillTxt, chapter === n && styles.chapPillTxtActive]}>{n}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={{ fontSize: readSize, lineHeight: readSize * 1.8, color: C.ink }}>
        {arr.map((t: string, i: number) => {
          const vn = chap!.verseNumbers[i];
          const k = vkey(book, chapter, vn);
          const bg = playing && book === playBook && i === readIdx
            ? C.hlReading : hl[k] ? HL_COLORS[hl[k]] : 'transparent';
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
        <Pressable style={[styles.chapNavBtn, chapter <= 1 && { opacity: 0.4 }]} disabled={chapter <= 1} onPress={onPrevChapter}>
          <Ionicons name="chevron-back" size={16} color={C.inkSoft} />
          <Text style={styles.chapNavTxt}>  Chapitre préc.</Text>
        </Pressable>
        <Pressable style={[styles.chapNavBtn, chapter >= (getBookById(book)?.chapterCount ?? 0) && { opacity: 0.4 }]} disabled={chapter >= (getBookById(book)?.chapterCount ?? 0)} onPress={onNextChapter}>
          <Text style={styles.chapNavTxt}>Chapitre suiv.  </Text>
          <Ionicons name="chevron-forward" size={16} color={C.inkSoft} />
        </Pressable>
      </View>

      <View style={[styles.chapNav, { marginTop: S.s3 }]}>
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
  chapStrip: { flexDirection: 'row', gap: S.s2, paddingVertical: S.s2 },
  chapPill: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  chapPillActive: { backgroundColor: C.accent, borderColor: C.accent },
  chapPillTxt: { fontSize: 13, fontWeight: '600', color: C.inkSoft },
  chapPillTxtActive: { color: C.paper },
});
