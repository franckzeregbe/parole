import { useRef, useEffect } from 'react';
import { View, Text, Pressable, SafeAreaView, Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VersionId, Chapter, VLABEL } from '../data/bible';
import { colors as C, space as S } from '../theme';

export default function NowPlaying({ book, idx, version, playing, speed, continuous, onClose, onStop, onToggle, onPrev, onNext, onSpeed, onToggleCont, chapterCache }: {
  book: string; idx: number; version: VersionId; playing: boolean; speed: number; continuous: boolean;
  onClose: () => void; onStop: () => void; onToggle: () => void; onPrev: () => void; onNext: () => void;
  onSpeed: () => void; onToggleCont: () => void;
  chapterCache: Record<string, Chapter>;
}) {
  const y = useRef(new Animated.Value(800)).current;
  useEffect(() => {
    Animated.timing(y, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  const chap = chapterCache[book];
  if (!chap) return null;
  const arr = chap.text[version];
  const safeIdx = Math.max(0, idx);
  const pct = arr.length > 1 ? (safeIdx / (arr.length - 1)) * 100 : 0;
  const vn = chap.verseNumbers[safeIdx] ?? safeIdx + 1;

  return (
    <Animated.View style={[styles.now, { transform: [{ translateY: y }] }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.nowTop}>
          <Pressable style={styles.nowTopBtn} onPress={onClose}><Ionicons name="chevron-down" size={20} color={C.paper} /></Pressable>
          <Text style={styles.nowTopLbl}>LECTURE AUDIO</Text>
          <Pressable style={styles.nowTopBtn} onPress={onStop}><Ionicons name="close" size={20} color={C.paper} /></Pressable>
        </View>

        <View style={styles.nowArt}><Ionicons name="musical-notes" size={64} color="rgba(255,255,255,0.85)" /></View>

        <Text style={styles.nowRef}>{chap.name} {chap.chapter}.{vn}</Text>
        <Text style={styles.nowVer}>{VLABEL[version]}</Text>
        <Text style={styles.nowQuote} numberOfLines={4}>{arr[safeIdx]}</Text>

        <View style={{ marginTop: 'auto' }}>
          <View style={styles.nowBar}><View style={[styles.nowFill, { width: `${pct}%` }]} /></View>
          <View style={styles.nowTimes}>
            <Text style={styles.nowTimeTxt}>Verset {safeIdx + 1}</Text>
            <Text style={styles.nowTimeTxt}>/ {arr.length}</Text>
          </View>

          <View style={styles.nowCtrls}>
            <Pressable style={styles.nbtn} onPress={onPrev}><Ionicons name="play-skip-back" size={26} color={C.paper} /></Pressable>
            <Pressable style={styles.nbtnPlay} onPress={onToggle}><Ionicons name={playing ? 'pause' : 'play'} size={32} color={C.ink} /></Pressable>
            <Pressable style={styles.nbtn} onPress={onNext}><Ionicons name="play-skip-forward" size={26} color={C.paper} /></Pressable>
          </View>

          <View style={styles.nowOpts}>
            <Pressable style={styles.nowOpt} onPress={onToggleCont}>
              <Ionicons name="infinite" size={20} color={continuous ? C.gold : 'rgba(255,255,255,0.8)'} />
              <Text style={[styles.nowOptTxt, continuous && { color: C.gold }]}>Continu</Text>
            </Pressable>
            <Pressable style={styles.nowOpt} onPress={onSpeed}>
              <Text style={[styles.nowOptTxt, { fontSize: 15, fontWeight: '800' }]}>{speed}×</Text>
              <Text style={styles.nowOptTxt}>Vitesse</Text>
            </Pressable>
            <Pressable style={styles.nowOpt} onPress={onClose}>
              <Ionicons name="book-outline" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.nowOptTxt}>Texte</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  now: { ...StyleSheet.absoluteFillObject, backgroundColor: C.nowMid, paddingHorizontal: S.s6, zIndex: 100 },
  nowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.s2, marginBottom: S.s6 },
  nowTopBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  nowTopLbl: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(255,255,255,0.85)' },
  nowArt: { width: 240, height: 240, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: S.s6, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 40, shadowOffset: { width: 0, height: 30 } },
  nowRef: { fontSize: 30, fontWeight: '600', color: C.paper, textAlign: 'center', letterSpacing: -0.5 },
  nowVer: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 5 },
  nowQuote: { fontSize: 16, lineHeight: 26, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: S.s6 },
  nowBar: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' },
  nowFill: { height: '100%', backgroundColor: C.paper, borderRadius: 3 },
  nowTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  nowTimeTxt: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  nowCtrls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.s6, marginTop: S.s6 },
  nbtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  nbtnPlay: { width: 74, height: 74, borderRadius: 37, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  nowOpts: { flexDirection: 'row', justifyContent: 'center', gap: S.s8, marginTop: S.s8, marginBottom: S.s6 },
  nowOpt: { alignItems: 'center', gap: 5 },
  nowOptTxt: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
});
