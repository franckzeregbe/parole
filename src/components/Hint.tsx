import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as C, space as S } from '../theme';

export default function Hint({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.hint}>
      <Ionicons name={icon as any} size={34} color={C.lineStrong} />
      <Text style={styles.hintTxt}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { alignItems: 'center', paddingVertical: S.s12, paddingHorizontal: S.s6 },
  hintTxt: { textAlign: 'center', color: C.inkFaint, fontSize: 14, lineHeight: 22, marginTop: S.s3 },
});
