import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SQLiteDatabase } from 'expo-sqlite';
import { VersionId } from '../data/bible';
import { VerseOfTheDay } from '../data/votd';
import { getBookGroupsByTestament, searchBooks, getBookById } from '../data/bible-data';
import { colors as C, space as S } from '../theme';
import { formatDate, parseReference, formatGreeting, type ReadingPosition } from '../utils';

type VotdData = VerseOfTheDay & { text: Record<VersionId, string> };

type BookItem = { id: string; name: string; chapterCount: number; testament: string; category: string };

const TESTAMENTS = ['Ancien Testament', 'Nouveau Testament'] as const;

function BookRow({ bk, onOpenBook }: { bk: BookItem; onOpenBook: (id: string) => void }) {
  return (
    <Pressable style={styles.bookRow} onPress={() => onOpenBook(bk.id)}
      accessible accessibilityRole="button" accessibilityLabel={bk.name}>
      <View style={styles.bookRowLeft}>
        <Text style={styles.bookName}>{bk.name}</Text>
        <Text style={styles.bookChapters}>{bk.chapterCount} ch.</Text>
      </View>
    </Pressable>
  );
}

function BookSection({ title, books, onOpenBook }: { title: string; books: BookItem[]; onOpenBook: (id: string) => void }) {
  if (books.length === 0) return null;
  return (
    <View style={{ marginBottom: S.s5, marginLeft: S.s2 }}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.bookList}>
        {books.map((bk) => (
          <BookRow key={bk.id} bk={bk} onOpenBook={onOpenBook} />
        ))}
      </View>
    </View>
  );
}

function VotdCard({ votd, version, onPlay }: { votd: VotdData | null; version: VersionId; onPlay: () => void }) {
  if (!votd) {
    return (
      <View style={styles.votdCard}>
        <Text style={styles.votdLabel}>VERSET DU JOUR</Text>
        <Text style={styles.votdText}>Chargement…</Text>
      </View>
    );
  }
  return (
    <View style={styles.votdCard}>
      <Text style={styles.votdLabel}>VERSET DU JOUR</Text>
      <Text style={styles.votdText}>{votd.text[version]}</Text>
      <Text style={styles.votdRef}>{votd.ref}</Text>
      <Pressable style={styles.playBtn} onPress={onPlay}
        accessible accessibilityRole="button" accessibilityLabel="Écouter le verset du jour">
        <Ionicons name="play" size={18} color={C.surface} />
        <Text style={styles.playBtnText}>Écouter</Text>
      </Pressable>
    </View>
  );
}

function ContinueReadingCard({ position, onOpen }: { position: ReadingPosition; onOpen: (bookId: string, chapter: number, verse?: number) => void }) {
  const bookName = getBookById(position.bookId)?.name ?? position.bookId;
  return (
    <Pressable style={styles.continueCard} onPress={() => onOpen(position.bookId, position.chapter, position.verse)}
      accessible accessibilityRole="button" accessibilityLabel={`Continuer la lecture : ${bookName} ${position.chapter}:${position.verse}`}>
      <Ionicons name="book-outline" size={20} color={C.accent} />
      <View style={styles.continueInfo}>
        <Text style={styles.continueTitle}>Reprendre la lecture</Text>
        <Text style={styles.continueRef}>{bookName} {position.chapter}:{position.verse}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.inkFaint} />
    </Pressable>
  );
}

export default function HomeScreen({ version, votd, onOpenBook, books, onPlayVotd, onOpenChapter, db, readingPositions }: {
  version: VersionId;
  votd: VotdData | null;
  onOpenBook: (id: string, chapter?: number) => void;
  books: BookItem[];
  onPlayVotd: () => void;
  onOpenChapter: (bookId: string, chapter: number, verse?: number) => void;
  db: SQLiteDatabase | null;
  readingPositions: Record<string, ReadingPosition>;
}) {
  const [query, setQuery] = useState('');
  const [expandedTestament, setExpandedTestament] = useState<string | null>('Ancien Testament');
  const greeting = formatGreeting();
  const dateStr = formatDate();

  const results = query.trim() ? searchBooks(query) : [];
  const refMatch = parseReference(query);
  const queryActive = query.trim().length > 0;

  const toggleTestament = (test: string) => {
    setExpandedTestament((prev) => (prev === test ? null : test));
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
       <Text style={styles.greeting}>{greeting} 👋</Text>
       <Text style={styles.homeDate}>{dateStr}</Text>

        <VotdCard votd={votd} version={version} onPlay={onPlayVotd} />

        {Object.keys(readingPositions).length > 0 && (
          <View style={{ marginBottom: S.s4 }}>
            {Object.values(readingPositions)
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 1)
              .map((pos) => (
                <ContinueReadingCard key={pos.bookId} position={pos} onOpen={onOpenChapter} />
              ))}
          </View>
        )}

        {refMatch && (
         <Pressable style={styles.refBtn} onPress={() => { onOpenBook(refMatch.bookId, refMatch.chapter); }}
           accessible accessibilityRole="button" accessibilityLabel={`Aller à ${getBookById(refMatch.bookId)?.name ?? refMatch.bookId} ${refMatch.chapter}:${refMatch.verse}`}>
           <Ionicons name="compass" size={18} color={C.surface} />
           <Text style={styles.refBtnText}>Aller à {getBookById(refMatch.bookId)?.name ?? refMatch.bookId} {refMatch.chapter}:{refMatch.verse}</Text>
         </Pressable>
       )}

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
           <Pressable onPress={() => setQuery('')} hitSlop={8}
             accessible accessibilityRole="button" accessibilityLabel="Effacer la recherche">
             <Ionicons name="close-circle" size={18} color={C.inkFaint} />
           </Pressable>
         )}
       </View>

       {queryActive ? (
         results.length === 0 ? (
           <Text style={styles.empty}>Aucun livre trouvé.</Text>
         ) : (
           <View style={styles.bookList}>
             {results.map((bk) => (
               <BookRow
                 key={bk.id}
                 bk={{ id: bk.id, name: bk.name, chapterCount: bk.chapterCount, testament: bk.testament, category: bk.category }}
                 onOpenBook={onOpenBook}
               />
             ))}
           </View>
         )
       ) : (
         TESTAMENTS.map((test) => {
           const isExpanded = expandedTestament === test;
           const groups = getBookGroupsByTestament(test);
           return (
             <View key={test} style={{ marginBottom: S.s2 }}>
               <Pressable style={styles.testHeader} onPress={() => toggleTestament(test)}
                 accessible accessibilityRole="button" accessibilityState={{ expanded: isExpanded }}
                 accessibilityLabel={`${test} — ${isExpanded ? 'réduit' : 'déployé'}`}>
                 <Text style={styles.testTitle}>{test.toUpperCase()}</Text>
                 <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={C.inkFaint} />
               </Pressable>
               {isExpanded && groups.map((group) => (
                 <BookSection
                   key={group.category}
                   title={group.category}
                   books={books.filter((b) => b.testament === test && b.category === group.category)}
                   onOpenBook={onOpenBook}
                 />
               ))}
             </View>
           );
         })
       )}
     </ScrollView>
   );
}

const styles = StyleSheet.create({
  scroll: { padding: S.s5, paddingBottom: 150 },

  greeting: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: C.accent, marginBottom: 4 },
  homeDate: { fontSize: 24, fontWeight: '600', color: C.ink, letterSpacing: -0.5, marginBottom: S.s6 },

  votdCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: S.s4, marginBottom: S.s4 },
  votdLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: C.inkFaint, marginBottom: 6 },
  votdText: { fontSize: 16, fontWeight: '500', color: C.ink, lineHeight: 22, fontStyle: 'italic', marginBottom: 4 },
  votdRef: { fontSize: 12, fontWeight: '600', color: C.accentDeep, marginBottom: S.s3 },
   playBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
   playBtnText: { fontSize: 12, fontWeight: '700', color: C.surface, marginLeft: 4 },

   continueCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, paddingHorizontal: S.s4, paddingVertical: 12, marginBottom: S.s4 },
   continueInfo: { flex: 1 },
   continueTitle: { fontSize: 14, fontWeight: '600', color: C.ink },
   continueRef: { fontSize: 12, color: C.inkFaint, marginTop: 2 },

  refBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: S.s4 },
  refBtnText: { fontSize: 14, fontWeight: '600', color: C.surface },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginBottom: S.s5 },
  search: { flex: 1, fontSize: 15, color: C.ink, paddingVertical: 0 },
  empty: { fontSize: 15, color: C.inkFaint, textAlign: 'center', paddingVertical: S.s6 },

  testHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: S.s2, paddingHorizontal: S.s1 },
  testTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1, color: C.ink },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: C.inkFaint, marginBottom: S.s3, marginLeft: S.s1 },

  bookList: { marginTop: 4, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, overflow: 'hidden' },
  bookRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: S.s4, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line,
  },
  bookRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bookName: { fontSize: 14, fontWeight: '500', color: C.ink },
  bookChapters: { fontSize: 11, color: C.inkFaint },
});
