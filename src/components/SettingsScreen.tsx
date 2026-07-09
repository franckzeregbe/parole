import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VersionId, VLABEL } from '../data/bible';
import { colors as C, space as S } from '../theme';
import Toggle from './Toggle';

export default function SettingsScreen({ sizeStep, setSizeStep, version, continuous, setContinuous, hlCount, favCount }: {
  sizeStep: number; setSizeStep: (v: number) => void; version: VersionId; continuous: boolean; setContinuous: (v: boolean) => void;
  hlCount: number; favCount: number;
}) {
  return (
    <ScrollView contentContainerStyle={{ padding: S.s5, paddingBottom: 150 }}>
      <Text style={styles.setCap}>LECTURE</Text>
      <View style={styles.setGroup}>
        <View style={styles.setRow}>
          <View><Text style={styles.setLbl}>Taille du texte</Text><Text style={styles.setSub}>Confort de lecture</Text></View>
          <View style={styles.sizeCtrl}>
            <Pressable style={styles.sizeBtn} onPress={() => setSizeStep(Math.max(-2, sizeStep - 1))}><Text style={{ fontSize: 14, color: C.ink }}>A</Text></Pressable>
            <View style={styles.sizeDivider} />
            <Pressable style={styles.sizeBtn} onPress={() => setSizeStep(Math.min(4, sizeStep + 1))}><Text style={{ fontSize: 19, color: C.ink }}>A</Text></Pressable>
          </View>
        </View>
        <View style={[styles.setRow, styles.setRowLast]}>
          <View><Text style={styles.setLbl}>Version par défaut</Text><Text style={styles.setSub}>{VLABEL[version]}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={C.inkFaint} />
        </View>
      </View>

      <Text style={styles.setCap}>AUDIO</Text>
      <View style={styles.setGroup}>
        <View style={styles.setRow}>
          <View style={{ flex: 1 }}><Text style={styles.setLbl}>Lecture continue</Text><Text style={styles.setSub}>Enchaîne les chapitres sans s'arrêter</Text></View>
          <Toggle on={continuous} onPress={() => setContinuous(!continuous)} />
        </View>
      </View>

      <Text style={styles.setCap}>MON ACTIVITÉ</Text>
      <View style={styles.setGroup}>
        <View style={styles.setRow}><Text style={styles.setLbl}>Versets surlignés</Text><Text style={{ fontWeight: '600', color: C.inkSoft }}>{hlCount}</Text></View>
        <View style={[styles.setRow, styles.setRowLast]}><Text style={styles.setLbl}>Versets en favoris</Text><Text style={{ fontWeight: '600', color: C.inkSoft }}>{favCount}</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  setCap: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: C.inkFaint, marginBottom: S.s3, marginLeft: S.s1 },
  setGroup: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 18, overflow: 'hidden', marginBottom: S.s5 },
  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.s4, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.line, gap: S.s4 },
  setRowLast: { borderBottomWidth: 0 },
  setLbl: { fontSize: 15, fontWeight: '500', color: C.ink },
  setSub: { fontSize: 12, color: C.inkFaint, marginTop: 3 },
  sizeCtrl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 12, overflow: 'hidden' },
  sizeBtn: { width: 42, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface },
  sizeDivider: { width: 1, height: '100%', backgroundColor: C.line },
});
