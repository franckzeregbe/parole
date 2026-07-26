export type VersionId = 'dar' | 'lsg' | 'kjv';

export const VERSIONS: Record<VersionId, string> = {
  dar: 'Darby',
  lsg: 'Segond',
  kjv: 'KJV',
};

export const VLABEL: Record<VersionId, string> = {
  dar: 'Darby (Français)',
  lsg: 'Louis Segond (Français)',
  kjv: 'King James (English)',
};

export const VLANG: Record<VersionId, string> = {
  dar: 'fr-FR',
  lsg: 'fr-FR',
  kjv: 'en-US',
};

export interface Chapter {
  name: string;
  chapter: number;
  sub: string;
  dar: { v: number; t: string }[];
  lsg: { v: number; t: string }[];
  kjv: { v: number; t: string }[];
}

export interface BookMeta {
  id: string;
  name: string;
  chap: number | null;
  testament: 'Ancien Testament' | 'Nouveau Testament';
}
