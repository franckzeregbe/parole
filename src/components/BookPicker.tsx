import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBookGroupsByTestament, searchBooks, getBookById } from '../data/bible-data';
import { colors as C, space as S } from '../theme';
import Sheet from './Sheet';

const TESTAMENTS = ['Ancien Testament', 'Nouveau Testament'] as const;

export default function BookPicker({ onClose, onPickChapter }: {
  onClose: () => void; onPickChapter: (bookId: string, chapter: number) => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [expandedTestament, setExpandedTestament] = useState<string | null>('Ancien Testament');

  const results = query.trim() ? searchBooks(query) : [];

  const toggleTestament = (test: string) => {
    setExpandedTestament((prev) => (prev === test ? null : test));
  };

  return (
    <Sheet onClose={onClose} title={sel ? undefined : "Livres & chapitres"}>
      {sel === null ? (
        <View>
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={17} color={C.inkFaint} />
            <TextInput
              style={styles.search}
              placeholder="Rechercher un livre…"
              placeholderTextColor={C.inkFaint}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={C.inkFaint} />
              </Pressable>
            )}
          </View>

          <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
            {query.trim() ? (
              results.length === 0 ? (
                <Text style={styles.empty}>Aucun livre trouvé.</Text>
              ) : (
                results.map((bk) => (
                  <Pressable key={bk.id} style={styles.bookRow} onPress={() => setSel(bk.id)}
                    accessible accessibilityRole="button" accessibilityLabel={bk.name}>
                    <Text style={styles.bookName}>{bk.name}</Text>
                    <Text style={styles.metaCap}>{bk.category}</Text>
                  </Pressable>
                ))
              )
            ) : (
              TESTAMENTS.map((test) => {
                const isExpanded = expandedTestament === test;
                const groups = getBookGroupsByTestament(test);
                return (
                  <View key={test} style={{ marginBottom: S.s1 }}>
                    <Pressable style={styles.testHeader} onPress={() => toggleTestament(test)}
                      accessible accessibilityRole="button" accessibilityState={{ expanded: isExpanded }}
                      accessibilityLabel={`${test} — ${isExpanded ? 'réduit' : 'déployé'}`}>
                      <Text style={styles.testTitle}>{test.toUpperCase()}</Text>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={C.inkFaint} />
                    </Pressable>
                    {isExpanded && groups.map((group) => (
                      <View key={group.category}>
                        <Text style={styles.catCap}>{group.category}</Text>
                        {group.books.map((bk) => (
                          <Pressable key={bk.id} style={styles.bookRow} onPress={() => setSel(bk.id)}
                            accessible accessibilityRole="button" accessibilityLabel={bk.name}>
                            <Text style={styles.bookName}>{bk.name}</Text>
                            <Text style={styles.chip}>Ch. {bk.chapterCount}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ))}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      ) : (
        <View style={{ padding: S.s3 }}>
          <View style={styles.chapterHeader}>
            <Pressable onPress={() => setSel(null)} style={styles.backBtn}
              accessible accessibilityRole="button" accessibilityLabel="Retour à la liste des livres">
              <Text style={styles.backText}>← Retour</Text>
            </Pressable>
            <Text style={styles.chapterTitle}>
              {getBookById(sel)?.name}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.chapterScroll}>
            {Array.from({ length: getBookById(sel)?.chapterCount ?? 0 }, (_, i) => i + 1).map((ch) => (
              <Pressable key={ch} style={styles.chapterPill} onPress={() => onPickChapter(sel, ch)}
              accessible accessibilityRole="button" accessibilityLabel={`Chapitre ${ch}`}>
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
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginBottom: S.s2 },
  search: { flex: 1, fontSize: 15, color: C.ink, paddingVertical: 0 },
  pickCap: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: C.inkFaint, paddingTop: S.s4, paddingBottom: S.s1, paddingHorizontal: S.s3 },
  catCap: { fontSize: 12, fontWeight: '600', color: C.accentDeep, paddingTop: S.s3, paddingBottom: S.s1, paddingHorizontal: S.s3 },
  bookRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: S.s3, borderBottomWidth: 1, borderBottomColor: C.line },
  bookName: { fontSize: 17, fontWeight: '500', color: C.ink },
  chip: { fontSize: 12, fontWeight: '600', color: C.accent, backgroundColor: C.accentTint, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 4, overflow: 'hidden' },
  metaCap: { fontSize: 12, fontWeight: '500', color: C.inkFaint },
  empty: { fontSize: 15, color: C.inkFaint, textAlign: 'center', paddingVertical: S.s6 },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.s2, paddingHorizontal: S.s3, marginBottom: S.s3 },
  backBtn: { marginRight: S.s2 },
  backText: { fontSize: 15, color: C.accent, fontWeight: '500' },
  chapterTitle: { fontSize: 18, fontWeight: '600', color: C.ink },
  chapterScroll: { paddingHorizontal: S.s3, paddingBottom: S.s3 },
  chapterPill: { justifyContent: 'center', alignItems: 'center', width: 48, height: 48, borderRadius: 24, backgroundColor: C.accentTint, marginRight: S.s2 },
  chapterPillText: { fontSize: 16, fontWeight: '600', color: C.accent },
  testHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: S.s2, paddingHorizontal: S.s1 },
  testTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1, color: C.ink },
});
