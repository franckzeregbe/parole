import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VersionId } from '../data/bible';
import { VerseOfTheDay } from '../data/votd';
import { colors as C, space as S } from '../theme';

function formatDate(): string {
  const d = new Date();
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

type VotdData = VerseOfTheDay & { text: Record<VersionId, string> };

type BookItem = { id: string; name: string; chapterCount: number; testament: string };

function BookSection({ title, books, onOpenBook }: { title: string; books: BookItem[]; onOpenBook: (id: string) => void }) {
  if (books.length === 0) return null;
  return (
    <View style={{ marginBottom: S.s5 }}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.bookList}>
        {books.map((bk) => (
          <Pressable key={bk.id} style={styles.bookRow} onPress={() => onOpenBook(bk.id)}>
            <View style={styles.bookRowLeft}>
              <Text style={styles.bookName}>{bk.name}</Text>
              <Text style={styles.bookChapters}>{bk.chapterCount} ch.</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function BookGrid({ books, onOpenBook }: { books: BookItem[]; onOpenBook: (id: string) => void }) {
  const ot = books.filter((b) => b.testament === 'Ancien Testament');
  const nt = books.filter((b) => b.testament === 'Nouveau Testament');
  return (
    <View>
      <BookSection title="Ancien Testament" books={ot} onOpenBook={onOpenBook} />
      <BookSection title="Nouveau Testament" books={nt} onOpenBook={onOpenBook} />
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
      <Pressable style={styles.playBtn} onPress={onPlay}>
        <Ionicons name="play" size={18} color={C.surface} />
        <Text style={styles.playBtnText}>Écouter</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen({ version, votd, onOpenBook, books, onPlayVotd }: {
  version: VersionId;
  votd: VotdData | null;
  onOpenBook: (id: string) => void;
  books: BookItem[];
  onPlayVotd: () => void;
}) {
  const dateStr = useMemo(() => formatDate(), []);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>QUE LA PAIX SOIT AVEC TOI</Text>
      <Text style={styles.homeDate}>{dateStr}</Text>

      <VotdCard votd={votd} version={version} onPlay={onPlayVotd} />

      <BookGrid books={books} onOpenBook={onOpenBook} />
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
  bookRowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dlText: { fontSize: 14, color: C.inkFaint, fontWeight: '600' },
});
