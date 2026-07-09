import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllBooks } from '../data/bible-data';
import { colors as C, space as S } from '../theme';
import Sheet from './Sheet';

export default function BookPicker({ onClose, onPick, downloading, onDownloadChapter, available }: {
  onClose: () => void; onPick: (id: string) => void;
  downloading: Record<string, boolean>; onDownloadChapter: (bookId: string, chapterNum: number) => void;
  available: Record<string, boolean>;
}) {
  const [dlProgress, setDlProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const prog: Record<string, number> = {};
    for (const key of Object.keys(downloading)) {
      if (downloading[key]) prog[key] = 1;
    }
    if (Object.keys(prog).length > 0) setDlProgress(prog);
  }, [downloading]);

  return (
    <Sheet onClose={onClose} title="Livres & chapitres">
      <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
        {(['Ancien Testament', 'Nouveau Testament'] as const).map((test) => (
          <View key={test}>
            <Text style={styles.pickCap}>{test.toUpperCase()}</Text>
            {getAllBooks().filter((b) => b.testament === test).map((bk) => {
              const hasSeed = available[bk.id];
              const dlKey = `${bk.id}:1`;
              const isDl = downloading[dlKey];
              return (
                <Pressable key={bk.id} style={styles.bookRow}
                  onPress={() => hasSeed ? onPick(bk.id) : onDownloadChapter(bk.id, 1)}>
                  <Text style={[styles.bookName, !hasSeed && { opacity: 0.5 }]}>{bk.name}</Text>
                  {hasSeed ? (
                    <Text style={styles.chip}>Ch. {bk.chapterCount}</Text>
                  ) : isDl ? (
                    <ActivityIndicator size="small" color={C.accent} />
                  ) : (
                    <Ionicons name="download-outline" size={15} color={C.inkFaint} />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  pickCap: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: C.inkFaint, paddingTop: S.s4, paddingBottom: S.s2, paddingHorizontal: S.s3 },
  bookRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: S.s3, borderBottomWidth: 1, borderBottomColor: C.line },
  bookName: { fontSize: 17, fontWeight: '500', color: C.ink },
  chip: { fontSize: 12, fontWeight: '600', color: C.accent, backgroundColor: C.accentTint, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 4, overflow: 'hidden' },
});
