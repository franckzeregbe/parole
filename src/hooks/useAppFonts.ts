import { useEffect, useRef, useState } from 'react';
import * as Font from 'expo-font';

const FONT_MAP = {
  Fraunces_600SemiBold: 'https://cdn.jsdelivr.net/npm/@fontsource/fraunces/files/fraunces-latin-600-normal.woff2',
  Literata_400Regular: 'https://cdn.jsdelivr.net/npm/@fontsource/literata/files/literata-latin-400-normal.woff2',
  Literata_400Regular_Italic: 'https://cdn.jsdelivr.net/npm/@fontsource/literata/files/literata-latin-400-italic.woff2',
};

export function useAppFonts(): { fontsLoaded: boolean; fontError: boolean } {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState(false);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    mountedRef.current = true;
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setFontsLoaded(true);
        setFontError(true);
      }
    }, 4000);

    async function load() {
      try {
        await Font.loadAsync(FONT_MAP);
        if (mountedRef.current) {
          setFontsLoaded(true);
          setFontError(false);
        }
      } catch {
        if (mountedRef.current) {
          setFontsLoaded(true);
          setFontError(true);
        }
      }
    }
    load();

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { fontsLoaded, fontError };
}
