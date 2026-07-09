import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { VersionId, Chapter, VERSIONS } from '../data/bible';
import { getChapter, getBookList } from '../data/bible-db';
import { colors as C, space as S } from '../theme';
import Hint from './Hint';

const DEFAULT_CHAPTERS: Record<string, number> = { gen: 1, ps: 23, jean: 3 };

function dbChapterToChapterData(bookName: string, dbChapter: any): Chapter {
  const verses = dbChapter.verses ?? [];
  return {
    name: bookName,
    chapter: dbChapter.chapter_number,
    sub: dbChapter.sub || '',
    verseNumbers: verses.map((v: any) => v.verse_number),
    text: {
      dar: verses.map((v: any) => v.dar ?? ''),
      lsg: verses.map((v: any) => v.lsg ?? ''),
      kjv: verses.map((v: any) => v.kjv ?? ''),
    },
  };
}

export default function FavScreen({ fav, version, onJump, db, chapterCache }: {
  fav: Record<string, true>; version: VersionId; onJump: (bid: string, verseIdx?: number) => void;
  db: any; chapterCache: Record<string, Chapter>;
}) {
  const keys = Object.keys(fav);
  const [favChapters, setFavChapters] = useState<Record<string, Chapter>>({});
  const loadedBid = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!db) return;
    (async () => {
      try {
        const map: Record<string, Chapter> = {};
        for (const k of keys) {
          const [bid] = k.split(':');
          if (map[bid] || chapterCache[bid] || loadedBid.current.has(bid)) continue;
          loadedBid.current.add(bid);
          try {
            const c = await getChapter(db, bid, DEFAULT_CHAPTERS[bid] || 1);
            if (c) {
              const list = await getBookList(db);
              const info = list.find((b: any) => b.id === bid);
              map[bid] = dbChapterToChapterData(info?.name || bid, c);
            }
          } catch { /* skip */ }
        }
        setFavChapters(prev => ({ ...prev, ...map }));
      } catch { /* db unavailable */ }
    })();
  }, [fav, db, chapterCache]);

  return (
    <ScrollView contentContainerStyle={{ padding: S.s5, paddingBottom: 150 }}>
      {keys.length === 0 ? (
        <Hint icon="bookmark-outline" text={"Aucun favori pour l'instant.\nTouchez un verset puis « Favori »."} />
      ) : (
        keys.map((k) => {
          const [bid, iS] = k.split(':'); const i = +iS; const c = chapterCache[bid] || favChapters[bid];
          if (!c) return null;
          const vn = c.verseNumbers[i] ?? i + 1;
          return (
            <Pressable key={k} style={styles.result} onPress={() => onJump(bid, i)}>
              <View style={styles.resultRef}>
                <Text style={styles.resultR}>{c.name} {c.chapter}.{vn}</Text>
                <Text style={styles.resultV}>{VERSIONS[version]}</Text>
              </View>
              <Text style={styles.resultText}>{c.text[version][i]}</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  result: { paddingVertical: S.s4, borderBottomWidth: 1, borderBottomColor: C.line },
  resultRef: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  resultR: { fontSize: 12, fontWeight: '700', color: C.accent, letterSpacing: 0.3 },
  resultV: { fontSize: 10, fontWeight: '600', color: C.inkFaint, backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  resultText: { fontSize: 16, lineHeight: 25, color: C.inkSoft },
});
