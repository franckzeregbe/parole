import { View, Pressable, Text, StyleSheet } from 'react-native';
import { VersionId, VERSIONS } from '../data/bible';
import { colors as C } from '../theme';

export default function VersionSwitch({ value, onChange }: { value: VersionId; onChange: (v: VersionId) => void }) {
  const items: VersionId[] = ['dar', 'lsg', 'kjv'];
  const sub: Record<VersionId, string> = { dar: 'Français', lsg: 'Louis Segond', kjv: 'English' };
  return (
    <View style={styles.versions}>
      {items.map((v) => {
        const on = v === value;
        return (
          <Pressable key={v} style={[styles.verBtn, on && styles.verBtnOn]} onPress={() => onChange(v)}
            accessible accessibilityRole="button" accessibilityLabel={VERSIONS[v]} accessibilityState={{ selected: on }}>
            <Text style={[styles.verTxt, on && styles.verTxtOn]}>{VERSIONS[v]}</Text>
            <Text style={[styles.verSub, on && styles.verSubOn]}>{sub[v]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  versions: { flexDirection: 'row', backgroundColor: C.paper3, borderRadius: 14, padding: 3 },
  verBtn: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  verBtnOn: { backgroundColor: C.accent },
  verTxt: { fontSize: 13, fontWeight: '600', color: C.inkSoft },
  verTxtOn: { color: C.paper },
  verSub: { fontSize: 10, fontWeight: '500', color: C.inkFaint, marginTop: 2 },
  verSubOn: { color: '#EAD9C8' },
});
