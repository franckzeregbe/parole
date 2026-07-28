import { Pressable, View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VersionId, Chapter, VERSIONS } from '../data/bible';
import { colors as C, space as S } from '../theme';
import { chapArr } from '../utils';

export default function MiniPlayer({ book, chapter, idx, version, playing, onPress, onToggle, chapterCache }: {
  book: string; chapter: number; idx: number; version: VersionId; playing: boolean; onPress: () => void; onToggle: () => void;
  chapterCache: Record<string, Chapter>;
}) {
  const chap = chapterCache[`${book}:${chapter}`];
  if (!chap) return null;
  const arr = chapArr(chap, version);
  const vn = arr[Math.max(0, idx)]?.v ?? Math.max(0, idx) + 1;
  const verseText = arr[Math.max(0, idx)]?.t ?? '';
  const displayText = verseText.length > 60 ? verseText.slice(0, 57).trimEnd() + '…' : verseText;
  return (
    <Pressable style={styles.mini} onPress={onPress}>
      <View style={styles.miniCover} />
      <View style={{ flex: 1 }}>
        <Text style={styles.miniRef} numberOfLines={1}>{chap.name} {chap.chapter}.{vn}</Text>
        <Text style={styles.miniVerse} numberOfLines={1}>{displayText}</Text>
        <Text style={styles.miniSub} numberOfLines={1}>{VERSIONS[version]} · {playing ? 'lecture en cours' : 'en pause'}</Text>
      </View>
      <Pressable style={styles.miniBtn} onPress={onToggle}
        accessible accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Lecture'}>
        <Ionicons name={playing ? 'pause' : 'play'} size={19} color={C.paper} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mini: { position: 'absolute', left: 10, right: 10, bottom: Platform.OS === 'ios' ? 92 : 74, backgroundColor: C.ink, borderRadius: 18, padding: 9, paddingLeft: S.s3, flexDirection: 'row', alignItems: 'flex-start', gap: S.s2, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  miniCover: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.accent, marginTop: 2, flexShrink: 0 },
  miniRef: { fontSize: 14, fontWeight: '600', color: C.paper },
  miniVerse: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic', marginTop: 1 },
  miniSub: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  miniBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
});
