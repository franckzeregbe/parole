import { useRef, useEffect } from 'react';
import { View, Pressable, Text, Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as C, space as S } from '../theme';

export function SheetAct({ icon, label, on, onPress }: { icon: string; label: string; on?: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.sheetAct} onPress={onPress}>
      <Ionicons name={icon as any} size={20} color={on ? C.accent : C.inkSoft} />
      <Text style={[styles.sheetActTxt, on && { color: C.accent }]}>{label}</Text>
    </Pressable>
  );
}

export default function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  const y = useRef(new Animated.Value(600)).current;
  useEffect(() => {
    Animated.timing(y, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: y }] }]}>
        <View style={styles.grabber} />
        {title && <Text style={styles.pickerTitle}>{title}</Text>}
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(60,52,44,0.42)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: S.s5, paddingTop: S.s3, paddingBottom: 40 },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.lineStrong, alignSelf: 'center', marginBottom: S.s5 },
  pickerTitle: { fontSize: 19, fontWeight: '600', color: C.ink, textAlign: 'center', marginBottom: S.s4 },
  sheetAct: { flex: 1, alignItems: 'center', gap: 7, backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, borderRadius: 15, paddingVertical: 14 },
  sheetActTxt: { fontSize: 11, fontWeight: '600', color: C.inkSoft },
});
