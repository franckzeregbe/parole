import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { getAllBooks } from '../data/bible-data';
import { colors as C, space as S } from '../theme';
import Sheet from './Sheet';

export default function BookPicker({ onClose, onPickChapter }: {
  onClose: () => void; onPickChapter: (bookId: string, chapter: number) => void;
}) {
  const [sel, setSel] = useState<string | null>(null);

  return (
    <Sheet onClose={onClose} title={sel ? undefined : "Livres & chapitres"}>
      {sel === null ? (
        <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
          {(['Ancien Testament', 'Nouveau Testament'] as const).map((test) => (
            <View key={test}>
              <Text style={styles.pickCap}>{test.toUpperCase()}</Text>
              {getAllBooks().filter((b) => b.testament === test).map((bk) => (
                <Pressable key={bk.id} style={styles.bookRow} onPress={() => setSel(bk.id)}>
                  <Text style={styles.bookName}>{bk.name}</Text>
                  <Text style={styles.chip}>Ch. {bk.chapterCount}</Text>
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={{ padding: S.s3 }}>
          <View style={styles.chapterHeader}>
            <Pressable onPress={() => setSel(null)} style={styles.backBtn}>
              <Text style={styles.backText}>← Retour</Text>
            </Pressable>
            <Text style={styles.chapterTitle}>
              {getAllBooks().find((b) => b.id === sel)?.name}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.chapterScroll}>
            {Array.from({ length: getAllBooks().find((b) => b.id === sel)?.chapterCount ?? 0 }, (_, i) => i + 1).map((ch) => (
              <Pressable key={ch} style={styles.chapterPill} onPress={() => onPickChapter(sel, ch)}>
                <Text style={styles.chapterPillText}>{ch}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  pickCap: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: C.inkFaint, paddingTop: S.s4, paddingBottom: S.s2, paddingHorizontal: S.s3 },
  bookRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: S.s3, borderBottomWidth: 1, borderBottomColor: C.line },
  bookName: { fontSize: 17, fontWeight: '500', color: C.ink },
  chip: { fontSize: 12, fontWeight: '600', color: C.accent, backgroundColor: C.accentTint, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 4, overflow: 'hidden' },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.s2, paddingHorizontal: S.s3, marginBottom: S.s3 },
  backBtn: { marginRight: S.s2 },
  backText: { fontSize: 15, color: C.accent, fontWeight: '500' },
  chapterTitle: { fontSize: 18, fontWeight: '600', color: C.ink },
  chapterScroll: { paddingHorizontal: S.s3, paddingBottom: S.s3 },
  chapterPill: { justifyContent: 'center', alignItems: 'center', width: 48, height: 48, borderRadius: 24, backgroundColor: C.accentTint, marginRight: S.s2 },
  chapterPillText: { fontSize: 16, fontWeight: '600', color: C.accent },
});
