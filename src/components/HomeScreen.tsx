import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VersionId, VERSIONS } from '../data/bible';
import { getAllBooks } from '../data/bible-data';
import { colors as C, space as S } from '../theme';

function formatDate(): string {
  const d = new Date();
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

export default function HomeScreen({ version, votd, onOpenBook, onPlayVotd, downloading, onDownloadChapter, available }: {
  version: VersionId; votd: string; onOpenBook: (id: string) => void; onPlayVotd: () => void;
  downloading: Record<string, boolean>; onDownloadChapter: (bookId: string, chapterNum: number) => void;
  available: Record<string, boolean>;
}) {
  const dateStr = useMemo(() => formatDate(), []);

  return (
    <ScrollView contentContainerStyle={{ padding: S.s5, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>QUE LA PAIX SOIT AVEC TOI</Text>
      <Text style={styles.homeDate}>{dateStr}</Text>

      <View style={styles.votd}>
        <View style={styles.votdLabel}>
          <Ionicons name="sparkles-outline" size={13} color="#F0D9B8" />
          <Text style={styles.votdLabelTxt}>  VERSET DU JOUR</Text>
        </View>
        <Text style={styles.votdText}>{votd}</Text>
        <View style={styles.votdFoot}>
          <Text style={styles.votdRef}>Jean 3.16 · {VERSIONS[version]}</Text>
          <Pressable style={styles.votdPlay} onPress={onPlayVotd}>
            <Ionicons name="play" size={14} color={C.paper} />
            <Text style={styles.votdPlayTxt}>  Écouter</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.sectionLabel}>REPRENDRE</Text>
      <Pressable style={styles.continue} onPress={() => onOpenBook('jean')}>
        <View style={styles.contIcon}><Ionicons name="book-outline" size={21} color={C.accentDeep} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contTitle}>Jean 3</Text>
          <Text style={styles.contSub}>L'amour de Dieu · {VERSIONS[version]}</Text>
          <View style={styles.progTrack}><View style={styles.progFill} /></View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.inkFaint} />
      </Pressable>

      <Text style={styles.sectionLabel}>MES LIVRES</Text>
      <View style={styles.grid}>
        {getAllBooks().map((bk) => {
          const hasSeed = available[bk.id];
          const dlKey = `${bk.id}:1`;
          const isDl = downloading[dlKey];
          return (
            <Pressable key={bk.id} style={[styles.bcard, !hasSeed && { opacity: 0.5 }]}
              onPress={() => hasSeed ? onOpenBook(bk.id) : onDownloadChapter(bk.id, 1)}>
              <View style={styles.bcardTop}>
                <Text style={[styles.bcardNum, !hasSeed && { color: C.inkFaint }]}>{bk.chapterCount}</Text>
                <Ionicons name={hasSeed ? 'arrow-up-outline' : 'download-outline'} size={16} color={C.inkFaint}
                  style={hasSeed ? { transform: [{ rotate: '45deg' }] } : undefined} />
              </View>
              <Text style={styles.bcardName}>{bk.name}</Text>
              {hasSeed ? (
                <Text style={styles.bcardSub}>{bk.name}</Text>
              ) : (
                <Text style={styles.bcardSub}>{isDl ? 'Téléchargement…' : 'Télécharger'}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: C.accent, marginBottom: 6 },
  homeDate: { fontSize: 29, fontWeight: '600', color: C.ink, letterSpacing: -0.5, marginBottom: S.s6 },
  votd: { backgroundColor: C.accentDeep, borderRadius: 24, padding: S.s6, marginBottom: S.s8 },
  votdLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: S.s4 },
  votdLabelTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: '#F0D9B8' },
  votdText: { fontSize: 21, fontWeight: '500', lineHeight: 30, color: C.paper, marginBottom: S.s5 },
  votdFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  votdRef: { fontSize: 13, fontWeight: '600', color: '#F3E4D3' },
  votdPlay: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  votdPlayTxt: { color: C.paper, fontSize: 13, fontWeight: '600' },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: C.inkFaint, marginBottom: S.s4 },
  continue: { flexDirection: 'row', alignItems: 'center', gap: S.s4, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: S.s4, marginBottom: S.s8 },
  contIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.accentTint, alignItems: 'center', justifyContent: 'center' },
  contTitle: { fontSize: 17, fontWeight: '600', color: C.ink },
  contSub: { fontSize: 12, color: C.inkFaint, marginTop: 2 },
  progTrack: { height: 5, borderRadius: 3, backgroundColor: C.paper3, marginTop: 10, overflow: 'hidden' },
  progFill: { height: '100%', width: '58%', backgroundColor: C.accent, borderRadius: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.s3 },
  bcard: { width: '48%', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: S.s4 },
  bcardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: S.s8 },
  bcardNum: { fontSize: 27, fontWeight: '600', color: C.accent },
  bcardName: { fontSize: 17, fontWeight: '600', color: C.ink },
  bcardSub: { fontSize: 12, color: C.inkFaint, marginTop: 2 },
});
