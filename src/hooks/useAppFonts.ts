import { useEffect, useRef, useState } from 'react';
import * as Font from 'expo-font';
import { FONT_URLS } from '../config';

const FONT_MAP = FONT_URLS;

/**
 * Charge les polices de manière non-bloquante. Au premier lancement les fonts
 * distantes peuvent mettre un peu de temps ; on utilise les polices système
 * en fallback immédiatement (pas de splash supplémentaire).
 *
 * Le timeout de sécurité est réduit à 1.5s pour ne pas pénaliser le cold start.
 */
export function useAppFonts(): { fontsLoaded: boolean; fontError: boolean } {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontError, setFontError] = useState(false);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    mountedRef.current = true;
    // Timeout de sécurité très court — on préfère les fonts système à un démarrage lent.
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setFontsLoaded(true);
        setFontError(true);
      }
    }, 1500);

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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { fontsLoaded, fontError };
}
