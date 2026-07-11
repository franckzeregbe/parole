import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { VersionId, Chapter, VLABEL } from '../data/bible';
import { colors as C, space as S, HL_COLORS } from '../theme';
import Sheet, { SheetAct } from './Sheet';
import { useToast } from './Toast';

export default function VerseSheet({ book, chapter, idx, version, chapterData, hl, isFav, onClose, onHighlight, onToggleFav, onListen }: {
  book: string; chapter: number; idx: number; version: VersionId; chapterData: Chapter | null; hl: string | undefined; isFav: boolean;
  onClose: () => void; onHighlight: (c: string) => void; onToggleFav: () => void; onListen: () => void;
}) {
  const { showToast } = useToast();
  const [compare, setCompare] = useState(false);
  const chap = chapterData;
  const quote = chapterData ? chapterData.text[version][idx] : '';
  const swatches = ['', 'yellow', 'green', 'blue', 'pink', 'peach'];

  const copyVerse = useCallback(() => {
    Clipboard.setString(quote);
    showToast('Verset copié');
  }, [quote, showToast]);

  if (!chap) return null;

  const vn = chap.verseNumbers[idx] ?? idx + 1;

  return (
    <Sheet onClose={onClose}>
      <Text style={styles.sheetRef}>{chap.name} {chap.chapter}.{vn}{compare ? ' — 3 versions' : ''}</Text>
      {compare ? (
        <View style={{ marginTop: S.s3 }}>
          {(['dar', 'lsg', 'kjv'] as VersionId[]).map((v) => (
            <View key={v} style={{ marginBottom: S.s4 }}>
              <Text style={styles.cmpLabel}>{VLABEL[v].toUpperCase()}</Text>
              <Text style={styles.cmpText}>{chap.text[v][idx]}</Text>
            </View>
          ))}
        </View>
      ) : (
        <>
          <Text style={styles.sheetQuote}>{chap.text[version][idx]}</Text>
          <View style={styles.swatchRow}>
            {swatches.map((c) => (
              <Pressable key={c || 'none'} onPress={() => onHighlight(c)}
                style={[styles.swatch, c ? { backgroundColor: HL_COLORS[c] } : styles.swatchNone, hl === c && styles.swatchSel]}>
                {!c && <Ionicons name="ban-outline" size={16} color={C.inkFaint} />}
              </Pressable>
            ))}
          </View>
          <View style={styles.sheetActions}>
            <SheetAct icon="play" label="Écouter" onPress={onListen} />
            <SheetAct icon={isFav ? 'bookmark' : 'bookmark-outline'} label={isFav ? 'Retiré' : 'Favori'} on={isFav} onPress={onToggleFav} />
            <SheetAct icon="copy-outline" label="Copier" onPress={copyVerse} />
            <SheetAct icon="layers-outline" label="Comparer" onPress={() => setCompare(true)} />
          </View>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheetRef: { fontSize: 18, fontWeight: '600', color: C.ink, marginBottom: 3 },
  sheetQuote: { fontSize: 15, color: C.inkSoft, lineHeight: 23, marginBottom: S.s5 },
  swatchRow: { flexDirection: 'row', gap: 11, marginBottom: S.s5 },
  swatch: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  swatchNone: { backgroundColor: C.surface },
  swatchSel: { borderColor: C.ink },
  sheetActions: { flexDirection: 'row', gap: 9 },
  cmpLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: C.accent, marginBottom: 5 },
  cmpText: { fontSize: 16, lineHeight: 26, color: C.ink },
});
