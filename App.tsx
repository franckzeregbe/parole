import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet,
  SafeAreaView, StatusBar, Animated, Easing, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VLANG, VersionId, Chapter,
} from './src/data/bible';
import {
  loadBibleDb, getChapter, getVerse,
} from './src/data/bible-db';
import type { SQLiteDatabase } from 'expo-sqlite';
import { CANONICAL_ORDER, getBookById, getAllBooks } from './src/data/bible-data';
import { type as T } from './src/theme';
import { useAppFonts } from './src/hooks/useAppFonts';
import { ToastProvider } from './src/components/Toast';
import { getVerseOfTheDay } from './src/data/votd';
import { STORAGE_KEYS } from './src/config';
import {
  separateLegacyKeys, resolveLegacyRecords,
} from './src/data/legacyMigration';
import { ThemeProvider, useTheme } from './src/components/ThemeContext';
import { formatDate, vkey, chapArr, saveReadingPosition, getReadingPositions, type ReadingPosition } from './src/utils';

import ErrorBoundary from './src/components/ErrorBoundary';
import IconBtn from './src/components/IconBtn';
import VersionSwitch from './src/components/VersionSwitch';
import TabBtn from './src/components/TabBtn';
import MiniPlayer from './src/components/MiniPlayer';
import NowPlaying from './src/components/NowPlaying';
import BookPicker from './src/components/BookPicker';
import VerseSheet from './src/components/VerseSheet';
import HomeScreen from './src/components/HomeScreen';
import ReaderScreen from './src/components/ReaderScreen';
import SearchScreen from './src/components/SearchScreen';
import FavScreen from './src/components/FavScreen';
import SettingsScreen from './src/components/SettingsScreen';

type Tab = 'home' | 'read' | 'search' | 'fav' | 'settings';
const SPEEDS = [0.75, 1, 1.25, 1.5];

function AppInner() {
  const { isDark, toggleTheme } = useTheme();
  const [tab, setTab] = useState<Tab>('home');
  const [book, setBook] = useState('jean');
  const [version, setVersion] = useState<VersionId>('dar');
  const [hl, setHl] = useState<Record<string, string>>({});
  const [fav, setFav] = useState<Record<string, true>>({});
  const [sizeStep, setSizeStep] = useState(0);
  const [continuous, setContinuous] = useState(true);

  const [playing, setPlaying] = useState(false);
  const [readIdx, setReadIdx] = useState(-1);
  const [playBook, setPlayBook] = useState('jean');
  const [speedIdx, setSpeedIdx] = useState(1);
  const [showMini, setShowMini] = useState(false);
  const [showNow, setShowNow] = useState(false);

  const [sheetVerse, setSheetVerse] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chapter, setChapter] = useState(1);
  const [playChapter, setPlayChapter] = useState(1);
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [dbReady, setDbReady] = useState<SQLiteDatabase | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const retryDb = useCallback(async () => {
    setDbError(null);
    try {
      const db = await loadBibleDb();
      dbRef.current = db;
      setDbReady(db);
      const v = getVerseOfTheDay();
      const dar = (await getVerse(db, v.bookId, v.chapter, v.verse, 'dar'))?.verse_text ?? '';
      const lsg = (await getVerse(db, v.bookId, v.chapter, v.verse, 'lsg'))?.verse_text ?? '';
      const kjv = (await getVerse(db, v.bookId, v.chapter, v.verse, 'kjv'))?.verse_text ?? '';
      setVotd({ ref: v.ref, bookId: v.bookId, chapter: v.chapter, verse: v.verse, text: { dar, lsg, kjv } });
      const positions = await getReadingPositions(db);
      setReadingPositions(positions);
      await migrateLegacyKeys(db);
    } catch (e) { setDbError(e instanceof Error ? e.message : 'Erreur inconnue'); }
  }, []);
  const [votd, setVotd] = useState<{ ref: string; bookId: string; chapter: number; verse: number; text: Record<VersionId, string> } | null>(null);
  const [readingPositions, setReadingPositions] = useState<Record<string, ReadingPosition>>({});
  const tabAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    tabAnim.setValue(0);
    Animated.timing(tabAnim, { toValue: 1, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.cubic) }).start();
  }, [tab]);

  const dbRef = useRef<SQLiteDatabase | null>(null);
  const chapterCache = useRef<Record<string, Chapter>>({});
  const chapterRef = useRef(1);
  const hlRef = useRef<Record<string, string>>({});
  const favRef = useRef<Record<string, true>>({});
  useEffect(() => { hlRef.current = hl; }, [hl]);
  useEffect(() => { favRef.current = fav; }, [fav]);

  // Holds legacy-format favorites/highlights recovered during AsyncStorage
  // restoration, pending resolution once the database is available.
  const legacyPending = useRef<{ hl: Record<string, string>; fav: Record<string, true> }>({ hl: {}, fav: {} });
  const legacyMigrated = useRef(false);

  // Resolve any legacy `book:verseIndex` keys into the current
  // `book:chapter:verse` format using the database's verse layout.
  const migrateLegacyKeys = useCallback(async (db: SQLiteDatabase) => {
    if (legacyMigrated.current) return;
    const { hl, fav } = legacyPending.current;
    if (Object.keys(hl).length === 0 && Object.keys(fav).length === 0) {
      legacyMigrated.current = true;
      return;
    }
    try {
      const [newHl, newFav] = await Promise.all([
        resolveLegacyRecords(db, hlRef.current, hl),
        resolveLegacyRecords(db, favRef.current, fav),
      ]);
      legacyPending.current = { hl: {}, fav: {} };
      legacyMigrated.current = true;
      setHl(newHl);
      setFav(newFav);
    } catch (e) { console.warn('Legacy migration failed', e); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const db = await loadBibleDb();
        dbRef.current = db;
        setDbReady(db);
        const v = getVerseOfTheDay();
        const dar = (await getVerse(db, v.bookId, v.chapter, v.verse, 'dar'))?.verse_text ?? '';
        const lsg = (await getVerse(db, v.bookId, v.chapter, v.verse, 'lsg'))?.verse_text ?? '';
        const kjv = (await getVerse(db, v.bookId, v.chapter, v.verse, 'kjv'))?.verse_text ?? '';
        setVotd({ ref: v.ref, bookId: v.bookId, chapter: v.chapter, verse: v.verse, text: { dar, lsg, kjv } });
        const positions = await getReadingPositions(db);
        setReadingPositions(positions);
        await migrateLegacyKeys(db);
      } catch (e) { setDbError(e instanceof Error ? e.message : 'Erreur inconnue'); }
    })();
  }, []);

  useEffect(() => {
    setChapterData(null);
    const d = dbRef.current;
    if (!d) return;
    (async () => {
      try {
          const dbChap = await getChapter(d, book, chapter);
          if (dbChap) {
            const name = getBookById(book)?.name ?? book;
            const chap: Chapter = {
              name,
              chapter: dbChap.chapter_number,
              sub: dbChap.sub || '',
              dar: dbChap.dar,
              lsg: dbChap.lsg,
              kjv: dbChap.kjv,
            };
            chapterCache.current[`${book}:${chapter}`] = chap;
            setChapterData(chap);
          }
      } catch (e) { console.warn('Failed to load chapter', e); }
    })();
  }, [book, chapter]);

  useEffect(() => { setChapter(1); }, [book]);

  // Save reading position whenever the user opens a book/chapter.
  useEffect(() => {
    const db = dbRef.current;
    if (!db) return;
    (async () => {
      try {
        await saveReadingPosition(db, { bookId: book, chapter, verse: 1, timestamp: Date.now() });
        const positions = await getReadingPositions(db);
        setReadingPositions(positions);
      } catch {}
    })();
  }, [book, chapter]);

  const readSize = T.base + 4 + sizeStep * 1.4;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.appState);
        if (raw) {
          const s = JSON.parse(raw);
          const hlParsed = separateLegacyKeys<Record<string, string>>(s.hl);
          const favParsed = separateLegacyKeys<Record<string, true>>(s.fav);
          // Keep current-format records immediately.
          if (hlParsed.current && Object.keys(hlParsed.current).length) setHl(hlParsed.current);
          if (favParsed.current && Object.keys(favParsed.current).length) setFav(favParsed.current);
          // Stash legacy-format records for DB-backed resolution.
          legacyPending.current = { hl: hlParsed.legacy, fav: favParsed.legacy };
          // If the DB is already available (e.g. fast path), migrate now.
          if (dbRef.current) await migrateLegacyKeys(dbRef.current);

          if (typeof s.sizeStep === 'number') setSizeStep(s.sizeStep);
          if (s.version && ['dar', 'lsg', 'kjv'].includes(s.version)) setVersion(s.version);
          if (typeof s.continuous === 'boolean') setContinuous(s.continuous);
        }
      } catch { /* first launch */ }
    })();
  }, []);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEYS.appState, JSON.stringify({ hl, fav, sizeStep, version, continuous })).catch(() => {});
    }, 500);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [hl, fav, sizeStep, version]);

  const playingRef = useRef(false);
  const idxRef = useRef(-1);
  const bookRef = useRef('jean');
  const versionRef = useRef<VersionId>('dar');
  const continuousRef = useRef(true);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { idxRef.current = readIdx; }, [readIdx]);
  useEffect(() => { bookRef.current = playBook; }, [playBook]);
  useEffect(() => { chapterRef.current = playChapter; }, [playChapter]);
  useEffect(() => { versionRef.current = version; }, [version]);
  useEffect(() => { continuousRef.current = continuous; }, [continuous]);

  const endPlayback = useCallback(() => { setPlaying(false); playingRef.current = false; Speech.stop(); }, []);

  const speakFn = useRef<(idx: number, bk: string, ch: number) => void>(() => {});
  const advanceFn = useRef<() => void>(() => {});

  const cacheChapter = async (bk: string, ch: number): Promise<Chapter | null> => {
    const key = `${bk}:${ch}`;
    if (chapterCache.current[key]) return chapterCache.current[key];
    if (!dbRef.current) return null;
    try {
      const d = await getChapter(dbRef.current, bk, ch);
      if (!d) return null;
      const name = getBookById(bk)?.name ?? bk;
      const chap: Chapter = {
        name,
        chapter: d.chapter_number,
        sub: d.sub || '',
        dar: d.dar,
        lsg: d.lsg,
        kjv: d.kjv,
      };
      chapterCache.current[`${bk}:${ch}`] = chap;
      return chap;
    } catch { return null; }
  };

  advanceFn.current = async () => {
    if (!playingRef.current) { endPlayback(); return; }
    const bk = bookRef.current;
    const ch = chapterRef.current;
    const v = versionRef.current;
    const chap = chapterCache.current[`${bk}:${ch}`];
    if (!chap) { endPlayback(); return; }
    const arr = chap[v];
    if (!arr || arr.length === 0) { endPlayback(); return; }
    const cur = idxRef.current;
    if (cur < arr.length - 1) {
      const n = cur + 1; setReadIdx(n); speakFn.current(n, bk, ch); return;
    }
    const maxCh = getBookById(bk)?.chapterCount ?? 0;
    if (ch < maxCh) {
      const nc = ch + 1;
      const c = await cacheChapter(bk, nc);
      if (c) {
        setChapter(nc); setChapterData(c); setPlayChapter(nc); chapterRef.current = nc;
        setReadIdx(0); speakFn.current(0, bk, nc); return;
      }
    }
    if (continuousRef.current) {
      const pos = CANONICAL_ORDER.indexOf(bk);
      const next = CANONICAL_ORDER[pos + 1];
      if (next) {
        const c = await cacheChapter(next, 1);
        if (c) {
          setBook(next); setPlayBook(next); bookRef.current = next;
          setChapter(1); setChapterData(c); setPlayChapter(1); chapterRef.current = 1;
          setReadIdx(0); speakFn.current(0, next, 1); return;
        }
      }
    }
    endPlayback();
  };

  speakFn.current = (idx: number, bk: string, ch: number) => {
    Speech.stop();
    const v = versionRef.current;
    const chap = chapterCache.current[`${bk}:${ch}`];
    if (!chap) { endPlayback(); return; }
    const arr = chap[v];
    if (!arr || idx >= arr.length) { endPlayback(); return; }
    Speech.speak(arr[idx].t, {
      language: VLANG[v],
      rate: SPEEDS[speedIdx],
      onDone: () => { if (playingRef.current) advanceFn.current(); },
      onError: () => { endPlayback(); },
    });
  };

  const startPlayback = (idx: number, bk = book, ch = chapter) => {
    setPlayBook(bk); bookRef.current = bk;
    setPlayChapter(ch); chapterRef.current = ch;
    setReadIdx(idx); idxRef.current = idx;
    setPlaying(true); playingRef.current = true;
    setShowMini(true); setTab('read');
    speakFn.current(idx, bk, ch);
  };
  const stopPlayback = () => { endPlayback(); setShowMini(false); setShowNow(false); setReadIdx(-1); };
  const togglePlay = () => {
    if (playingRef.current) { setPlaying(false); playingRef.current = false; Speech.stop(); }
    else { setPlaying(true); playingRef.current = true; speakFn.current(idxRef.current, bookRef.current, chapterRef.current); }
  };
  const nextVerse = () => { Speech.stop(); advanceFn.current(); };
  const prevVerse = () => {
    Speech.stop();
    const bk = bookRef.current; const ch = chapterRef.current; const cur = idxRef.current;
    if (cur > 0) {
      const n = cur - 1; setReadIdx(n); idxRef.current = n; setPlaying(true); playingRef.current = true;
      speakFn.current(n, bk, ch);
    } else if (ch > 1) {
      (async () => {
        const c = await cacheChapter(bk, ch - 1);
        if (c) {
          const pc = ch - 1;
          setChapter(pc); setChapterData(c); setPlayChapter(pc); chapterRef.current = pc;
          const n = chapArr(c, versionRef.current).length - 1;
          setReadIdx(n); idxRef.current = n; setPlaying(true); playingRef.current = true;
          speakFn.current(n, bk, pc);
        }
      })();
    } else {
      setPlaying(false); playingRef.current = false; Speech.stop();
    }
  };

  // Silent (non-audio) verse stepping used for in-reader navigation.
  const stepReadVerse = useCallback((delta: number) => {
    if (playingRef.current) { delta > 0 ? nextVerse() : prevVerse(); return; }
    const bk = bookRef.current; const ch = chapterRef.current; const cur = idxRef.current;
    const chap = chapterCache.current[`${bk}:${ch}`];
    if (!chap) return;
    const curArr = chap[versionRef.current];
    if (!curArr) return;
    const total = curArr.length;
    const n = cur + delta;
    if (n >= 0 && n < total) { setReadIdx(n); idxRef.current = n; return; }
    if (delta > 0) {
      const maxCh = getBookById(bk)?.chapterCount ?? 0;
      if (ch < maxCh) {
        const nc = ch + 1;
        (async () => {
          const c = await cacheChapter(bk, nc);
          if (c) { setChapter(nc); setChapterData(c); setPlayChapter(nc); chapterRef.current = nc; setReadIdx(0); idxRef.current = 0; }
        })();
      } else {
        const nb = CANONICAL_ORDER[CANONICAL_ORDER.indexOf(bk) + 1];
        if (nb) {
          (async () => {
            const c = await cacheChapter(nb, 1);
            if (c) { setBook(nb); setPlayBook(nb); bookRef.current = nb; setChapter(1); setChapterData(c); setPlayChapter(1); chapterRef.current = 1; setReadIdx(0); idxRef.current = 0; }
          })();
        }
      }
    } else {
      if (ch > 1) {
        const pc = ch - 1;
        (async () => {
          const c = await cacheChapter(bk, pc);
          if (c) { setChapter(pc); setChapterData(c); setPlayChapter(pc); chapterRef.current = pc; const last = chapArr(c, versionRef.current).length - 1; setReadIdx(last); idxRef.current = last; }
        })();
      } else {
        const pb = CANONICAL_ORDER[CANONICAL_ORDER.indexOf(bk) - 1];
        if (pb) {
          const pc = getBookById(pb)?.chapterCount ?? 1;
          (async () => {
            const c = await cacheChapter(pb, pc);
            if (c) { setBook(pb); setPlayBook(pb); bookRef.current = pb; setChapter(pc); setChapterData(c); setPlayChapter(pc); chapterRef.current = pc; const last = chapArr(c, versionRef.current).length - 1; setReadIdx(last); idxRef.current = last; }
          })();
        }
      }
    }
  }, [cacheChapter, nextVerse, prevVerse]);
  const cycleSpeed = () => setSpeedIdx((i) => (i + 1) % SPEEDS.length);
  useEffect(() => { if (playingRef.current) speakFn.current(idxRef.current, bookRef.current, chapterRef.current); }, [speedIdx]);
  useEffect(() => () => { Speech.stop(); }, []);

  const chap = chapterData;

  const setHighlight = (i: number, c: string) => {
    const cur = chapterData ? chapArr(chapterData, version)[i] : null;
    if (!cur) return;
    const k = vkey(book, chapter, cur.v);
    setHl((prev) => { const n = { ...prev }; if (c) n[k] = c; else delete n[k]; return n; });
  };
  const toggleFav = (i: number) => {
    const cur = chapterData ? chapArr(chapterData, version)[i] : null;
    if (!cur) return;
    const k = vkey(book, chapter, cur.v);
    setFav((prev) => { const n = { ...prev }; if (n[k]) delete n[k]; else n[k] = true; return n; });
  };
  const navigateToVerse = async (bid: string, ch = 1, vs?: number) => {
    setBook(bid);
    setChapter(ch);
    setTab('read');
    if (dbRef.current) {
      await saveReadingPosition(dbRef.current, { bookId: bid, chapter: ch, verse: vs ?? 1, timestamp: Date.now() });
      const positions = await getReadingPositions(dbRef.current);
      setReadingPositions(positions);
    }
  };

  const { colors: C, space: S } = useTheme();

  const styles = StyleSheet.create({
    app: { flex: 1, backgroundColor: C.paper },
    offline: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: C.ink, paddingVertical: 6 },
    offlineTxt: { color: C.paper, fontSize: 12, fontWeight: '500' },

    topbar: { paddingHorizontal: S.s5, paddingTop: S.s3, paddingBottom: S.s4, backgroundColor: C.paper, borderBottomWidth: 1, borderBottomColor: C.line, gap: S.s4 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
    refBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    refTxt: { fontSize: 23, fontWeight: '600', color: C.ink, letterSpacing: -0.3 },
    pageTitle: { fontSize: 23, fontWeight: '600', color: C.ink, letterSpacing: -0.3 },
    barActions: { flexDirection: 'row', gap: 8 },

    screens: { flex: 1, backgroundColor: C.paper },

    tabbar: { flexDirection: 'row', backgroundColor: C.paper, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 8 },
  });

  // Fonts load in the background and swap in once ready (system fallback is
  // used until then), so only the database gates the first paint. This keeps
  // app launch instant instead of waiting on a remote font download.
  useAppFonts();
  if (!dbReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.paper }}>
        <Text style={{ fontSize: 40, fontWeight: '700', color: C.accent, letterSpacing: 1 }}>PAROLE</Text>
        <Text style={{ fontSize: 14, color: C.inkFaint, marginTop: 10 }}>Préparation de la Bible…</Text>
      </View>
    );
  }

  if (dbError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.paper, padding: S.s5 }}>
        <Text style={{ fontSize: 50, marginBottom: S.s4 }}>⚠️</Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: C.ink, marginBottom: S.s3 }}>Erreur de chargement</Text>
        <Text style={{ fontSize: 14, color: C.inkSoft, textAlign: 'center', marginBottom: S.s5 }}>{dbError}</Text>
        <Pressable style={{ backgroundColor: C.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
          onPress={retryDb}
          accessible accessibilityRole="button" accessibilityLabel="Réessayer">
          <Text style={{ color: C.surface, fontWeight: '600' }}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
      <SafeAreaView style={styles.app}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        <View style={styles.topbar}>
          <View style={styles.topRow}>
            {tab === 'read' ? (
              <Pressable style={styles.refBtn} onPress={() => setPickerOpen(true)}>
                <Text style={styles.refTxt}>{chap?.name ?? getBookById(book)?.name ?? book} {chap?.chapter ?? ''}</Text>
                <Ionicons name="chevron-down" size={16} color={C.inkFaint} />
              </Pressable>
            ) : (
              <Text style={styles.pageTitle}>
                {tab === 'search' ? 'Recherche' : tab === 'fav' ? 'Favoris' : tab === 'settings' ? 'Réglages' : ''}
              </Text>
            )}
            <View style={styles.barActions}>
              <IconBtn name="headset-outline" active={showMini}
                onPress={() => (showMini ? stopPlayback() : startPlayback(0))} />
              <IconBtn name="search-outline" onPress={() => setTab('search')} />
            </View>
          </View>

          {(tab === 'read' || tab === 'search' || tab === 'fav') && (
            <VersionSwitch value={version} onChange={setVersion} />
          )}
        </View>

        <Animated.View style={[styles.screens, { opacity: tabAnim }]}>
          {tab === 'home' && (
            <HomeScreen version={version} votd={votd}
              onOpenBook={(id: string, ch?: number) => { setBook(id); if (ch) setChapter(ch); setTab('read'); }}
              onOpenChapter={navigateToVerse}
              books={getAllBooks().map((b) => ({ id: b.id, name: b.name, chapterCount: b.chapterCount, testament: b.testament, category: b.category }))}
              onPlayVotd={() => {
                if (votd && chapterData) {
                  const arr = chapArr(chapterData, version);
                  const idx = arr.findIndex((x) => x.v === votd.verse);
                  setBook(votd.bookId); setChapter(votd.chapter);
                  startPlayback(Math.max(0, idx), votd.bookId, votd.chapter);
                }
              }}
              db={dbReady}
              readingPositions={readingPositions} />
          )}
          {tab === 'read' && (
            <ReaderScreen
              book={book} chapter={chapter} version={version} readSize={readSize}
              hl={hl} fav={fav} playing={playing} playBook={playBook} playChapter={playChapter} readIdx={readIdx}
              chapterData={chapterData} onSelectVerse={setSheetVerse}
              onPrevBook={() => { const p = CANONICAL_ORDER[CANONICAL_ORDER.indexOf(book) - 1]; if (p) setBook(p); }}
              onNextBook={() => { const n = CANONICAL_ORDER[CANONICAL_ORDER.indexOf(book) + 1]; if (n) setBook(n); }}
              onPrevChapter={() => { if (chapter > 1) setChapter(chapter - 1); }}
              onNextChapter={() => { const max = getBookById(book)?.chapterCount ?? 0; if (chapter < max) setChapter(chapter + 1); }}
              onGoToChapter={(ch: number) => setChapter(ch)}
              onPrevVerse={() => stepReadVerse(-1)}
              onNextVerse={() => stepReadVerse(1)}
            />
          )}
          {tab === 'search' && (
            <SearchScreen query={query} setQuery={setQuery} version={version}
              onJump={navigateToVerse} db={dbReady} />
          )}
          {tab === 'fav' && (
            <FavScreen fav={fav} version={version} onJump={navigateToVerse} db={dbReady} />
          )}
          {tab === 'settings' && (
            <SettingsScreen
              sizeStep={sizeStep} setSizeStep={setSizeStep}
              version={version} continuous={continuous} setContinuous={setContinuous}
              hlCount={Object.keys(hl).length} favCount={Object.keys(fav).length} />
          )}
        </Animated.View>

        {showMini && (
          <MiniPlayer
            book={playBook} chapter={playChapter} idx={readIdx} version={version} playing={playing}
            onPress={() => setShowNow(true)} onToggle={togglePlay} chapterCache={chapterCache.current} />
        )}

        <View style={styles.tabbar}>
          <TabBtn icon="home-outline" label="Accueil" active={tab === 'home'} onPress={() => setTab('home')} />
          <TabBtn icon="book-outline" label="Lire" active={tab === 'read'} onPress={() => setTab('read')} />
          <TabBtn icon="search-outline" label="Recherche" active={tab === 'search'} onPress={() => setTab('search')} />
          <TabBtn icon="bookmark-outline" label="Favoris" active={tab === 'fav'} onPress={() => setTab('fav')} />
          <TabBtn icon="options-outline" label="Réglages" active={tab === 'settings'} onPress={() => setTab('settings')} />
        </View>

        {sheetVerse !== null && chapterData && (
          <VerseSheet
            book={book} chapter={chapter} idx={sheetVerse} version={version}
            chapterData={chapterData}
            hl={(() => { const v = chapArr(chapterData, version)[sheetVerse]; return v ? hl[vkey(book, chapter, v.v)] : undefined; })()}
            isFav={(() => { const v = chapArr(chapterData, version)[sheetVerse]; return v ? !!fav[vkey(book, chapter, v.v)] : false; })()}
            onClose={() => setSheetVerse(null)}
            onHighlight={(c: string) => setHighlight(sheetVerse, c)}
            onToggleFav={() => toggleFav(sheetVerse)}
            onListen={() => { setSheetVerse(null); startPlayback(sheetVerse, book, chapter); }}
          />
        )}

        {pickerOpen && (
          <BookPicker onClose={() => setPickerOpen(false)}
            onPickChapter={(id: string, ch: number) => { setBook(id); setChapter(ch); setPickerOpen(false); setTab('read'); }}
          />
        )}

        {showNow && (
          <NowPlaying
            book={playBook} chapter={playChapter} idx={readIdx} version={version} playing={playing}
            speed={SPEEDS[speedIdx]} continuous={continuous}
            onClose={() => setShowNow(false)} onStop={stopPlayback}
            onToggle={togglePlay} onPrev={prevVerse} onNext={nextVerse}
            onSpeed={cycleSpeed} onToggleCont={() => setContinuous((v) => !v)}
            chapterCache={chapterCache.current} />
        )}
      </SafeAreaView>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
