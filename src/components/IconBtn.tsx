import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as C } from '../theme';

export default function IconBtn({ name, onPress, active }: { name: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, active && styles.iconBtnOn, pressed && { transform: [{ scale: 0.9 }] }]}>
      <Ionicons name={name as any} size={18} color={active ? C.paper : C.inkSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconBtn: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  iconBtnOn: { backgroundColor: C.accent, borderColor: C.accent },
});
