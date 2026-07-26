// config.ts — Centralized external resource configuration.
// All hardcoded CDN / API URLs used across the app live here so they can be
// reviewed, updated, or swapped (e.g. self-hosted) from a single place.

const CDN = {
  /** Fontsource assets served through the jsDelivr CDN. */
  fontsource: 'https://cdn.jsdelivr.net/npm/@fontsource',
} as const;

/** Remote font files loaded by expo-font, keyed by the registered font name. */
export const FONT_URLS = {
  Fraunces_600SemiBold: `${CDN.fontsource}/fraunces/files/fraunces-latin-600-normal.woff2`,
  Literata_400Regular: `${CDN.fontsource}/literata/files/literata-latin-400-normal.woff2`,
  Literata_400Regular_Italic: `${CDN.fontsource}/literata/files/literata-latin-400-italic.woff2`,
} as const;

/** Storage keys used with AsyncStorage. */
export const STORAGE_KEYS = {
  appState: 'parole:v1',
} as const;

export const EXTERNAL = {
  CDN,
} as const;

export type FontUrlMap = Record<keyof typeof FONT_URLS, string>;
