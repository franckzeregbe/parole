import { Pressable, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as C } from '../theme';

export default function TabBtn({ icon, label, active, onPress }: { icon: string; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.tab} onPress={onPress}
      accessible accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: !!active }}>
      <Ionicons name={icon as any} size={22} color={active ? C.accent : C.inkFaint} />
      <Text style={[styles.tabTxt, { color: active ? C.accent : C.inkFaint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 },
  tabTxt: { fontSize: 11, fontWeight: '600' },
});
