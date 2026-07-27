import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { VersionId, VERSIONS } from '../data/bible';
import { getVerse } from '../data/bible-db';
import { getBookById } from '../data/bible-data';
import { colors as C, space as S } from '../theme';
import Hint from './Hint';

export default function FavScreen({ fav, version, onJump, db }: {
  fav: Record<string, true>; version: VersionId; onJump: (bookId: string, chapter: number, verse: number) => void;
  db: SQLiteDatabase | null;
}) {
  const keys = Object.keys(fav);
  const [favItems, setFavItems] = useState<{ book: string; chapter: number; verse: number; bookName: string; text: string }[]>([]);

  useEffect(() => {
    if (!db) { setFavItems([]); return; }
    (async () => {
      try {
        const items = keys.map((k) => {
          const [book, ch, vs] = k.split(':');
          return { book, chapter: Number(ch), verse: Number(vs), bookName: getBookById(book)?.name ?? book, text: '' };
        });
        const updated = await Promise.allSettled(
          items.map(async (item) => {
            const row = await getVerse(db, item.book, item.chapter, item.verse, version);
            return { ...item, text: row ? row.verse_text : '' };
          })
        );
        setFavItems(updated.filter((r): r is PromiseFulfilledResult<{ book: string; chapter: number; verse: number; bookName: string; text: string }> => r.status === 'fulfilled').map((r) => r.value as { book: string; chapter: number; verse: number; bookName: string; text: string }));
      } catch { setFavItems([]); }
    })();
  }, [fav, version, db]);

  return (
    <ScrollView contentContainerStyle={{ padding: S.s5, paddingBottom: 150 }}>
      {favItems.length === 0 ? (
        <Hint icon="bookmark-outline" text={"Aucun favori pour l'instant.\nTouchez un verset puis « Favori »."} />
      ) : (
        favItems.map((item) => {
          return (
            <Pressable key={`${item.book}:${item.chapter}:${item.verse}`} style={styles.result} onPress={() => onJump(item.book, item.chapter, item.verse)}
              accessible accessibilityRole="button" accessibilityLabel={`${item.bookName} ${item.chapter}:${item.verse}`}>
              <View style={styles.resultRef}>
                <Text style={styles.resultR}>{item.bookName} {item.chapter}:{item.verse}</Text>
                <Text style={styles.resultV}>{VERSIONS[version]}</Text>
              </View>
              <Text style={styles.resultText}>{item.text}</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  result: { paddingVertical: S.s4, borderBottomWidth: 1, borderBottomColor: C.line },
  resultRef: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  resultR: { fontSize: 12, fontWeight: '700', color: C.accent, letterSpacing: 0.3 },
  resultV: { fontSize: 10, fontWeight: '600', color: C.inkFaint, backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  resultText: { fontSize: 16, lineHeight: 25, color: C.inkSoft },
});
