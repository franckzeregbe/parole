import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SQLiteDatabase } from 'expo-sqlite';
import { VersionId, VERSIONS } from '../data/bible';
import { searchVerses as searchVersesDb } from '../data/bible-db';
import { getBookById } from '../data/bible-data';
import { colors as C, space as S } from '../theme';
import Hint from './Hint';
import { parseReference } from '../utils';

interface SearchResult {
  bid: string; text: string; bookName: string; chapterNum: number; verseNum: number;
}

export default function SearchScreen({ query, setQuery, version, onJump, db }: {
  query: string; setQuery: (q: string) => void; version: VersionId; onJump: (bookId: string, chapter: number, verse: number) => void;
  db: SQLiteDatabase | null;
}) {
  const [dbResults, setDbResults] = useState<SearchResult[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!db || query.trim().length < 2) { setDbResults(null); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await searchVersesDb(db, query.trim(), version);
        setDbResults(res.map((r) => ({
          bid: r.book_id,
          text: r.text,
          bookName: r.book_name,
          chapterNum: r.chapter_number,
          verseNum: r.verse_number,
        })));
      } catch { setDbResults([]); }
    }, 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, version, db]);

  const hasQuery = query.trim().length >= 2;
  const refMatch = parseReference(query);

  return (
    <ScrollView contentContainerStyle={{ padding: S.s5, paddingBottom: 150 }} keyboardShouldPersistTaps="handled">
      <View style={styles.searchField}>
        <Ionicons name="search" size={18} color={C.inkFaint} />
        <TextInput style={styles.searchInput} placeholder="Un mot, un verset…"
          placeholderTextColor={C.inkFaint} value={query} onChangeText={(t) => setQuery(t.slice(0, 200))}
          autoCapitalize="none" autoCorrect={false} maxLength={200} />
      </View>
      {refMatch && (
        <Pressable style={styles.refResult} onPress={() => onJump(refMatch.bookId, refMatch.chapter, refMatch.verse)}>
          <View style={styles.refResultInner}>
            <Ionicons name="compass" size={18} color={C.accent} />
            <Text style={styles.refResultText}>
              Aller à {getBookById(refMatch.bookId)?.name ?? refMatch.bookId} {refMatch.chapter}:{refMatch.verse}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={C.inkFaint} />
        </Pressable>
      )}
      {!db ? (
        <Hint icon="hourglass-outline" text="Initialisation de la base de données…" />
      ) : !hasQuery ? (
        <Hint icon="search-outline" text={'Cherchez dans les textes téléchargés.\nEssayez « lumière », « berger », « love ».'} />
      ) : dbResults === null ? (
        <Hint icon="hourglass-outline" text="Recherche en cours…" />
      ) : dbResults.length === 0 ? (
        <Hint icon="close-circle-outline" text={`Aucun résultat pour « ${query} ».`} />
      ) : (
        dbResults.map((r, idx) => {
          return (
            <Pressable key={idx} style={styles.result} onPress={() => onJump(r.bid, r.chapterNum, r.verseNum)}
              accessible accessibilityRole="button" accessibilityLabel={`${r.bookName} ${r.chapterNum}.${r.verseNum}`}>
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
  refResult: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.accentTint, borderWidth: 1, borderColor: C.accent, borderRadius: 14, paddingHorizontal: S.s4, paddingVertical: 14, marginBottom: S.s3 },
  refResultInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  refResultText: { fontSize: 15, fontWeight: '600', color: C.accent },
  result: { paddingVertical: S.s4, borderBottomWidth: 1, borderBottomColor: C.line },
  resultRef: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  resultR: { fontSize: 12, fontWeight: '700', color: C.accent, letterSpacing: 0.3 },
  resultV: { fontSize: 10, fontWeight: '600', color: C.inkFaint, backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  resultText: { fontSize: 16, lineHeight: 25, color: C.inkSoft },
});
