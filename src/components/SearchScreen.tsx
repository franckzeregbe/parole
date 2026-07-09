import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VersionId, VERSIONS } from '../data/bible';
import { searchVerses as searchVersesDb } from '../data/bible-db';
import { colors as C, space as S } from '../theme';
import Hint from './Hint';

export default function SearchScreen({ query, setQuery, version, onJump, db }: {
  query: string; setQuery: (q: string) => void; version: VersionId; onJump: (bid: string) => void;
  db: any;
}) {
  const [dbResults, setDbResults] = useState<any[] | null>(null);

  useEffect(() => {
    if (!db || query.trim().length < 2) { setDbResults(null); return; }
    (async () => {
      try {
        const res = await searchVersesDb(db, query.trim(), version);
        setDbResults(res.map((r: any) => ({
          bid: r.book_id,
          text: r.text,
          bookName: r.book_name,
          chapterNum: r.chapter_number,
          verseNum: r.verse_number,
        })));
      } catch { setDbResults([]); }
    })();
  }, [query, version, db]);

  const hasQuery = query.trim().length >= 2;

  return (
    <ScrollView contentContainerStyle={{ padding: S.s5, paddingBottom: 150 }} keyboardShouldPersistTaps="handled">
      <View style={styles.searchField}>
        <Ionicons name="search" size={18} color={C.inkFaint} />
        <TextInput style={styles.searchInput} placeholder="Un mot, un verset…"
          placeholderTextColor={C.inkFaint} value={query} onChangeText={(t) => setQuery(t.slice(0, 200))}
          autoCapitalize="none" autoCorrect={false} maxLength={200} />
      </View>
      {!db ? (
        <Hint icon="hourglass-outline" text="Initialisation de la base de données…" />
      ) : !hasQuery ? (
        <Hint icon="search-outline" text={'Cherchez dans les textes téléchargés.\nEssayez « lumière », « berger », « love ».'} />
      ) : dbResults === null ? (
        <Hint icon="hourglass-outline" text="Recherche en cours…" />
      ) : dbResults.length === 0 ? (
        <Hint icon="close-circle-outline" text={`Aucun résultat pour « ${query} ».`} />
      ) : (
        dbResults.map((r: any, idx) => {
          return (
            <Pressable key={idx} style={styles.result} onPress={() => onJump(r.bid)}>
              <View style={styles.resultRef}>
                <Text style={styles.resultR}>{r.bookName} {r.chapterNum}.{r.verseNum}</Text>
                <Text style={styles.resultV}>{VERSIONS[version]}</Text>
              </View>
              <Text style={styles.resultText}>{r.text}</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  searchField: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: C.surface, borderWidth: 1, borderColor: C.lineStrong, borderRadius: 15, paddingHorizontal: S.s4, paddingVertical: 14, marginBottom: S.s6 },
  searchInput: { flex: 1, fontSize: 15, color: C.ink },
  result: { paddingVertical: S.s4, borderBottomWidth: 1, borderBottomColor: C.line },
  resultRef: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  resultR: { fontSize: 12, fontWeight: '700', color: C.accent, letterSpacing: 0.3 },
  resultV: { fontSize: 10, fontWeight: '600', color: C.inkFaint, backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  resultText: { fontSize: 16, lineHeight: 25, color: C.inkSoft },
});
