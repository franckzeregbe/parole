import { Component } from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as C, space as S } from '../theme';

export default class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.paper, padding: S.s6 }}>
          <Ionicons name="warning-outline" size={48} color={C.accent} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: C.ink, marginTop: S.s4, textAlign: 'center' }}>
            Une erreur inattendue s'est produite.
          </Text>
          <Text style={{ fontSize: 14, color: C.inkSoft, marginTop: S.s2, textAlign: 'center' }}>
            Veuillez relancer l'application.
          </Text>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}
