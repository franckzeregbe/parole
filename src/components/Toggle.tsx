import { useRef, useEffect } from 'react';
import { Pressable, Animated, Easing, StyleSheet } from 'react-native';
import { colors as C } from '../theme';

export default function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  const anim = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: on ? 1 : 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [on]);
  const left = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 24] });
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [C.lineStrong, C.accent] });
  return (
    <Pressable onPress={onPress}
      accessible accessibilityRole="switch" accessibilityLabel={on ? 'Activé' : 'Désactivé'} accessibilityState={{ checked: on }}>
      <Animated.View style={[styles.toggle, { backgroundColor: bg }]}>
        <Animated.View style={[styles.toggleKnob, { left }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: { width: 50, height: 29, borderRadius: 20, justifyContent: 'center' },
  toggleKnob: { position: 'absolute', width: 23, height: 23, borderRadius: 12, backgroundColor: '#fff', top: 3 },
});
