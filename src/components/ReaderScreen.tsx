import { useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VersionId, Chapter } from '../data/bible';
import { CANONICAL_ORDER, getBookById } from '../data/bible-data';
import { colors as C, space as S, HL_COLORS } from '../theme';
import { vkey, chapArr } from '../utils';

export default function ReaderScreen({
  book, chapter, version, readSize, hl, fav, playing, playBook, playChapter, readIdx, chapterData,
  onSelectVerse, onPrevBook, onNextBook, onPrevChapter, onNextChapter, onGoToChapter, onPrevVerse, onNextVerse,
}: {
  book: string; chapter: number; version: VersionId; readSize: number; hl: Record<string, string>; fav: Record<string, true>;
  playing: boolean; playBook: string; playChapter: number; readIdx: number; chapterData?: Chapter | null;
  onSelectVerse: (i: number) => void; onPrevBook: () => void; onNextBook: () => void;
  onPrevChapter: () => void; onNextChapter: () => void; onGoToChapter: (n: number) => void;
  onPrevVerse: () => void; onNextVerse: () => void;
}) {
  const chap = chapterData;
  const arr = chap ? chapArr(chap, version) : [];
  const scrollRef = useRef<ScrollView>(null);
  const pos = CANONICAL_ORDER.indexOf(book);
  const prev = CANONICAL_ORDER[pos - 1]; const next = CANONICAL_ORDER[pos + 1];
  const hasContent = !!chapterData;
  const verseY = useRef<number[]>([]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    verseY.current = [];
  }, [book, chapter]);

  // Keep the active verse in view during verse-by-verse navigation / playback.
  useEffect(() => {
    if (readIdx < 0) return;
    const y = verseY.current[readIdx];
    if (typeof y !== 'number') return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
    }, 60);
    return () => clearTimeout(t);
  }, [readIdx, book, chapter]);

  if (!hasContent) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 150 }}>
        <Text style={{ color: C.inkSoft, fontSize: 15 }}>Chargement…</Text>
      </View>
    );
  }

  const maxCh = getBookById(book)?.chapterCount ?? 0;

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={{ padding: S.s6, paddingTop: S.s10, paddingBottom: 150 }}
      showsVerticalScrollIndicator={false}>
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
        {Array.from({ length: maxCh }, (_, n) => n + 1).map((n) => (
          <Pressable key={n} onPress={() => onGoToChapter(n)}
            style={[styles.chapPill, chapter === n && styles.chapPillActive]}
            accessible accessibilityRole="button" accessibilityLabel={`Chapitre ${n}`}>
            <Text style={[styles.chapPillTxt, chapter === n && styles.chapPillTxtActive]}>{n}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ marginTop: S.s6 }}>
        {arr.map((item, i) => {
          const vn = item.v;
          const k = vkey(book, chapter, vn);
          const isActive = i === readIdx;
          const bg = isActive
            ? C.hlReading
            : hl[k]
              ? HL_COLORS[hl[k]]
              : 'transparent';
          return (
            <Pressable key={i} onPress={() => onSelectVerse(i)}
              onLayout={(e) => { verseY.current[i] = e.nativeEvent.layout.y; }}
              style={[styles.verseRow, { backgroundColor: bg }]}
              accessible accessibilityRole="button" accessibilityLabel={`Verset ${vn}`}>
              <Text style={[styles.vn, isActive && styles.vnActive]}>{vn}</Text>
              <Text style={[styles.verseText, { fontSize: readSize, lineHeight: readSize * 1.7 }]}>
                {item.t}
                {fav[k] ? <Text style={{ color: C.gold }}>  ●</Text> : null}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.chapNav, styles.verseNav]}>
        <Pressable style={styles.chapNavBtn} onPress={onPrevVerse}
          accessible accessibilityRole="button" accessibilityLabel="Verset précédent">
          <Ionicons name="chevron-up" size={16} color={C.inkSoft} />
          <Text style={styles.chapNavTxt}>Verset préc.</Text>
        </Pressable>
        <Pressable style={styles.chapNavBtn} onPress={onNextVerse}
          accessible accessibilityRole="button" accessibilityLabel="Verset suivant">
          <Text style={styles.chapNavTxt}>Verset suiv.</Text>
          <Ionicons name="chevron-down" size={16} color={C.inkSoft} />
        </Pressable>
      </View>

      <View style={styles.chapNav}>
        <Pressable style={[styles.chapNavBtn, chapter <= 1 && { opacity: 0.4 }]} disabled={chapter <= 1} onPress={onPrevChapter}
          accessible accessibilityRole="button" accessibilityLabel="Chapitre précédent">
          <Ionicons name="chevron-back" size={16} color={C.inkSoft} />
          <Text style={styles.chapNavTxt}>  Chapitre préc.</Text>
        </Pressable>
        <Pressable style={[styles.chapNavBtn, chapter >= maxCh && { opacity: 0.4 }]} disabled={chapter >= maxCh} onPress={onNextChapter}
          accessible accessibilityRole="button" accessibilityLabel="Chapitre suivant">
          <Text style={styles.chapNavTxt}>Chapitre suiv.  </Text>
          <Ionicons name="chevron-forward" size={16} color={C.inkSoft} />
        </Pressable>
      </View>

      <View style={[styles.chapNav, { marginTop: S.s3 }]}>
        <Pressable style={[styles.chapNavBtn, !prev && { opacity: 0.4 }]} disabled={!prev} onPress={onPrevBook}
          accessible accessibilityRole="button" accessibilityLabel={`Livre précédent : ${prev ? (getBookById(prev)?.name ?? prev) : 'Début'}`}>
          <Ionicons name="arrow-back" size={16} color={C.inkSoft} />
          <Text style={styles.chapNavTxt}>  {prev ? (getBookById(prev)?.name ?? prev) : 'Début'}</Text>
        </Pressable>
        <Pressable style={[styles.chapNavBtn, !next && { opacity: 0.4 }]} disabled={!next} onPress={onNextBook}
          accessible accessibilityRole="button" accessibilityLabel={`Livre suivant : ${next ? (getBookById(next)?.name ?? next) : 'Fin'}`}>
          <Text style={styles.chapNavTxt}>{next ? (getBookById(next)?.name ?? next) : 'Fin'}  </Text>
          <Ionicons name="arrow-forward" size={16} color={C.inkSoft} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chapHead: { alignItems: 'center', marginBottom: S.s8 },
  chapBook: { fontSize: 12, fontWeight: '700', letterSpacing: 2.5, color: C.accent, marginBottom: S.s4 },
  flourish: { flexDirection: 'row', alignItems: 'center', gap: S.s4 },
  flLine: { height: 1, width: 48, backgroundColor: C.lineStrong },
  chapNum: { fontSize: 64, fontWeight: '600', color: C.ink, letterSpacing: -1 },
  chapSub: { fontSize: 15, fontStyle: 'italic', color: C.inkFaint, marginTop: S.s4 },
  vn: { fontSize: 12, fontWeight: '700', color: C.accent, minWidth: 26, marginRight: S.s2, marginTop: 3 },
  vnActive: { color: C.accentDeep },
  vnMissing: { opacity: 0.3 },
  verseRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 7, paddingHorizontal: 8, borderRadius: 8, marginBottom: 2 },
  verseText: { flex: 1, color: C.ink },
  verseMissing: { fontStyle: 'italic', color: C.inkFaint, fontSize: 13 },
  chapNav: { flexDirection: 'row', justifyContent: 'space-between', gap: S.s3, marginTop: S.s12 },
  verseNav: { marginTop: S.s8 },
  chapNavBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: 14, paddingVertical: 15 },
  chapNavTxt: { fontSize: 13, fontWeight: '600', color: C.inkSoft },
  chapStrip: { flexDirection: 'row', gap: S.s2, paddingVertical: S.s2 },
  chapPill: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface },
  chapPillActive: { backgroundColor: C.accent, borderColor: C.accent },
  chapPillTxt: { fontSize: 13, fontWeight: '600', color: C.inkSoft },
  chapPillTxtActive: { color: C.paper },
});
