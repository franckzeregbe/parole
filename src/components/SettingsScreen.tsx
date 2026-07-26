import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { VersionId } from '../data/bible';
import { useTheme } from './ThemeContext';
import Toggle from './Toggle';

export default function SettingsScreen({ sizeStep, setSizeStep, version, continuous, setContinuous, hlCount, favCount }: {
  sizeStep: number; setSizeStep: (v: number) => void; version: VersionId; continuous: boolean; setContinuous: (v: boolean) => void;
  hlCount: number; favCount: number;
}) {
  const { colors: C, space: S, isDark, toggleTheme } = useTheme();

  const styles = StyleSheet.create({
    setCap: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: C.inkFaint, marginBottom: S.s3, marginLeft: S.s1 },
    setGroup: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 18, overflow: 'hidden', marginBottom: S.s5 },
    setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.s4, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.line, gap: S.s4 },
    setRowLast: { borderBottomWidth: 0 },
    setRowInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.s4, paddingVertical: 14, gap: S.s4 },
    setLbl: { fontSize: 15, fontWeight: '500', color: C.ink },
    setSub: { fontSize: 12, color: C.inkFaint, marginTop: 3 },
    sizeCtrl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 12, overflow: 'hidden' },
    sizeBtn: { width: 42, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface },
    sizeDivider: { width: 1, height: '100%', backgroundColor: C.line },
  });

  return (
    <ScrollView contentContainerStyle={{ padding: S.s5, paddingBottom: 150 }}>
      <Text style={styles.setCap}>AFFICHAGE</Text>
      <View style={styles.setGroup}>
        <View style={styles.setRow}>
          <View><Text style={styles.setLbl}>Mode sombre</Text><Text style={styles.setSub}>Réduit la luminosité de l'écran</Text></View>
          <Toggle on={isDark} onPress={toggleTheme} />
        </View>
      </View>

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
        <View style={styles.setRowInfo}><Text style={styles.setLbl}>Bible</Text><Text style={styles.setSub}>66 livres · 3 versions</Text></View>
      </View>
    </ScrollView>
  );
}
