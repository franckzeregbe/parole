import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { colors, darkColors, space, type as typeScale } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof colors;
  space: typeof space;
  type: typeof typeScale;
  HL_COLORS: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => {},
  colors,
  space,
  type: typeScale,
  HL_COLORS: {
    yellow: colors.hlYellow,
    green: colors.hlGreen,
    blue: colors.hlBlue,
    pink: colors.hlPink,
    peach: colors.hlPeach,
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('parole:theme');
        if (saved === 'dark') setIsDark(true);
      } catch {}
    })();
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    AsyncStorage.setItem('parole:theme', next ? 'dark' : 'light').catch(() => {});
  }, [isDark]);

  const themeColors = useMemo(() => (isDark ? darkColors : colors), [isDark]);

  const hlColors = useMemo(() => ({
    yellow: isDark ? darkColors.hlYellow : colors.hlYellow,
    green: isDark ? darkColors.hlGreen : colors.hlGreen,
    blue: isDark ? darkColors.hlBlue : colors.hlBlue,
    pink: isDark ? darkColors.hlPink : colors.hlPink,
    peach: isDark ? darkColors.hlPeach : colors.hlPeach,
  }), [isDark]);

  const value = useMemo(() => ({
    isDark,
    toggleTheme,
    colors: themeColors,
    space,
    type: typeScale,
    HL_COLORS: hlColors,
  }), [isDark, toggleTheme, themeColors, hlColors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
