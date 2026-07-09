import React, { Component, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet,
  SafeAreaView, StatusBar, Animated, Easing, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VERSIONS, VLABEL, VLANG, VersionId, Chapter,
} from './src/data/bible';
import {
  loadBibleDb, getChapter, getBookList, searchVerses as searchVersesDb,
  downloadChapterFromApi,
} from './src/data/bible-db';
import { getAllBooks, CANONICAL_ORDER, getBookById } from './src/data/bible-data';
import { colors as C, space as S, type as T, HL_COLORS } from './src/theme';

import ErrorBoundary from './src/components/ErrorBoundary';
import IconBtn from './src/components/IconBtn';
import VersionSwitch from './src/components/VersionSwitch';
import TabBtn from './src/components/TabBtn';
import Toggle from './src/components/Toggle';
import Hint from './src/components/Hint';
import Sheet from './src/components/Sheet';
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
const vkey = (b: string, i: number) => `${b}:${i}`;
const DEFAULT_CHAPTERS: Record<string, number> = { gen: 1, ps: 23, jean: 3 };

function formatDate(): string {
  const d = new Date();
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

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

export default function App() {
  const [tab, setTab] = useState<Tab>('read');
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
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [available, setAvailable] = useState<Record<string, boolean>>({});
  const [dbReady, setDbReady] = useState<any>(null);
  const [votd, setVotd] = useState('Car Dieu a tant aimé le monde, qu\'il a donné son Fils unique, afin que quiconque croit en lui ne périsse pas, mais qu\'il ait la vie éternelle.');

  const tabAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    tabAnim.setValue(0);
    Animated.timing(tabAnim, { toValue: 1, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.cubic) }).start();
  }, [tab]);

  const dbRef = useRef<any>(null);
  const chapterCache = useRef<Record<string, Chapter>>({});

  useEffect(() => {
    (async () => {
      try {
        const db = await loadBibleDb();
        dbRef.current = db;
        setDbReady(db);

        const avail: Record<string, boolean> = {};
        const chapterRows = await db.getAllAsync('SELECT DISTINCT book_id FROM chapters');
        for (const row of chapterRows) {
          avail[row.book_id] = true;
        }
        setAvailable(avail);

        const list = await getBookList(db);
        const loadChapterIntoCache = async (bid: string) => {
          const chapterNum = DEFAULT_CHAPTERS[bid] || 1;
          const c = await getChapter(db, bid, chapterNum);
          if (c) {
            const info = list.find((b: any) => b.id === bid);
            chapterCache.current[bid] = dbChapterToChapterData(info?.name || bid, c);
          }
        };

        await Promise.all(['gen', 'ps', 'jean'].map(loadChapterIntoCache));

        if (chapterCache.current['jean']) {
          setVotd(chapterCache.current['jean'].text[version][0]);
        }

        const initial = chapterCache.current['jean'] || await (async () => {
          const c = await getChapter(db, 'jean', 3);
          if (c) {
            const info = list.find((b: any) => b.id === 'jean');
            const chap = dbChapterToChapterData(info?.name || 'jean', c);
            chapterCache.current['jean'] = chap;
            return chap;
          }
          return null;
        })();
        if (initial) setChapterData(initial);
      } catch (e) { console.warn('DB init failed', e); }
    })();
  }, []);

  useEffect(() => {
    setChapterData(null);
    if (!dbRef.current) return;
    (async () => {
      try {
        const chapterNum = DEFAULT_CHAPTERS[book] || 1;
        const dbChap = await getChapter(dbRef.current, book, chapterNum);
        if (dbChap) {
          const list = await getBookList(dbRef.current);
          const info = list.find((b: any) => b.id === book);
          const chap = dbChapterToChapterData(info?.name || book, dbChap);
          chapterCache.current[book] = chap;
          setChapterData(chap);
        }
      } catch (e) { console.warn('Failed to load chapter', e); }
    })();
  }, [book]);

  useEffect(() => {
    const c = chapterCache.current['jean'];
    if (c?.text?.[version]?.[0]) {
      setVotd(c.text[version][0]);
    }
  }, [version, chapterData]);

  const downloadChapter = async (bookId: string, chapterNum: number) => {
    const key = `${bookId}:${chapterNum}`;
    if (downloading[key]) return;
    setDownloading(p => ({ ...p, [key]: true }));
    try {
      if (!dbRef.current) {
        dbRef.current = await loadBibleDb();
      }
      const result = await downloadChapterFromApi(dbRef.current, bookId, chapterNum);
      if (result.success) {
        setAvailable(p => ({ ...p, [bookId]: true }));
        if (book === bookId) {
          const c = await getChapter(dbRef.current, bookId, chapterNum);
          if (c) {
            const list = await getBookList(dbRef.current);
            const info = list.find((b: any) => b.id === bookId);
            const chap = dbChapterToChapterData(info?.name || bookId, c);
            chapterCache.current[bookId] = chap;
            setChapterData(chap);
          }
        }
      }
    } catch (e) {
      console.warn('Download failed', e);
    } finally {
      setDownloading(p => ({ ...p, [key]: false }));
    }
  };

  const readSize = T.base + 4 + sizeStep * 1.4;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('parole:v1');
        if (raw) {
          const s = JSON.parse(raw);
          if (s.hl && typeof s.hl === 'object') setHl(s.hl);
          if (s.fav && typeof s.fav === 'object') setFav(s.fav);
          if (typeof s.sizeStep === 'number') setSizeStep(s.sizeStep);
          if (s.version && ['dar', 'lsg', 'kjv'].includes(s.version)) setVersion(s.version);
        }
      } catch { /* first launch */ }
    })();
  }, []);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      AsyncStorage.setItem('parole:v1', JSON.stringify({ hl, fav, sizeStep, version })).catch(() => {});
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
  useEffect(() => { versionRef.current = version; }, [version]);
  useEffect(() => { continuousRef.current = continuous; }, [continuous]);

  const endPlayback = useCallback(() => { setPlaying(false); playingRef.current = false; Speech.stop(); }, []);

  const speakFn = useRef<(idx: number, bk: string) => void>(() => {});
  const advanceFn = useRef<() => void>(() => {});

  advanceFn.current = async () => {
    if (!playingRef.current) { endPlayback(); return; }
    const bk = bookRef.current;
    const v = versionRef.current;
    const chap = chapterCache.current[bk];
    if (!chap) { endPlayback(); return; }
    const arr = chap.text[v];
    if (!arr || arr.length === 0) { endPlayback(); return; }
    const cur = idxRef.current;
    if (cur < arr.length - 1) {
      const n = cur + 1; setReadIdx(n); speakFn.current(n, bk); return;
    }
    if (continuousRef.current) {
      const pos = CANONICAL_ORDER.indexOf(bk);
      const next = CANONICAL_ORDER[pos + 1];
      if (next) {
        if (!chapterCache.current[next]) {
          try {
            if (dbRef.current) {
              const c = await getChapter(dbRef.current, next, DEFAULT_CHAPTERS[next] || 1);
              if (c) {
                const list = await getBookList(dbRef.current);
                const info = list.find((b: any) => b.id === next);
                chapterCache.current[next] = dbChapterToChapterData(info?.name || next, c);
              }
            }
          } catch {}
        }
        if (chapterCache.current[next]) {
          setPlayBook(next); setBook(next); setReadIdx(0); bookRef.current = next;
          speakFn.current(0, next); return;
        }
      }
    }
    endPlayback();
  };

  speakFn.current = (idx: number, bk: string) => {
    Speech.stop();
    const v = versionRef.current;
    const chap = chapterCache.current[bk];
    if (!chap) { endPlayback(); return; }
    const arr = chap.text[v];
    if (!arr || idx >= arr.length) { endPlayback(); return; }
    Speech.speak(arr[idx], {
      language: VLANG[v],
      rate: SPEEDS[speedIdx],
      onDone: () => { if (playingRef.current) advanceFn.current(); },
      onError: () => { endPlayback(); },
    });
  };

  const startPlayback = (idx: number, bk = book) => {
    setPlayBook(bk); bookRef.current = bk;
    setReadIdx(idx); idxRef.current = idx;
    setPlaying(true); playingRef.current = true;
    setShowMini(true); setTab('read');
    speakFn.current(idx, bk);
  };
  const stopPlayback = () => { endPlayback(); setShowMini(false); setShowNow(false); setReadIdx(-1); };
  const togglePlay = () => {
    if (playingRef.current) { setPlaying(false); playingRef.current = false; Speech.stop(); }
    else { setPlaying(true); playingRef.current = true; speakFn.current(idxRef.current, bookRef.current); }
  };
  const nextVerse = () => { Speech.stop(); advanceFn.current(); };
  const prevVerse = () => {
    Speech.stop();
    const n = Math.max(0, idxRef.current - 1);
    setReadIdx(n); idxRef.current = n; setPlaying(true); playingRef.current = true;
    speakFn.current(n, bookRef.current);
  };
  const cycleSpeed = () => setSpeedIdx((i) => (i + 1) % SPEEDS.length);
  useEffect(() => { if (playingRef.current) speakFn.current(idxRef.current, bookRef.current); }, [speedIdx]);
  useEffect(() => () => { Speech.stop(); }, []);

  const chap = chapterData;

  const setHighlight = (i: number, c: string) => {
    const k = vkey(book, i);
    setHl((prev) => { const n = { ...prev }; if (c) n[k] = c; else delete n[k]; return n; });
  };
  const toggleFav = (i: number) => {
    const k = vkey(book, i);
    setFav((prev) => { const n = { ...prev }; if (n[k]) delete n[k]; else n[k] = true; return n; });
  };
  const navigateToVerse = (bid: string) => {
    setBook(bid);
    setTab('read');
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.app}>
        <StatusBar barStyle="dark-content" />

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
            <HomeScreen version={version} votd={votd} onOpenBook={(id: string) => { setBook(id); setTab('read'); }}
              onPlayVotd={() => { setBook('jean'); setVersion('dar'); startPlayback(0, 'jean'); setShowNow(true); }}
              downloading={downloading} onDownloadChapter={downloadChapter} available={available} />
          )}
          {tab === 'read' && (
            <ReaderScreen
              book={book} version={version} readSize={readSize}
              hl={hl} fav={fav} playing={playing} playBook={playBook} readIdx={readIdx}
              chapterData={chapterData} onSelectVerse={setSheetVerse}
              onPrevBook={() => { const p = CANONICAL_ORDER[CANONICAL_ORDER.indexOf(book) - 1]; if (p) setBook(p); }}
              onNextBook={() => { const n = CANONICAL_ORDER[CANONICAL_ORDER.indexOf(book) + 1]; if (n) setBook(n); }}
              downloading={downloading} onDownloadChapter={downloadChapter}
            />
          )}
          {tab === 'search' && (
            <SearchScreen query={query} setQuery={setQuery} version={version}
              onJump={navigateToVerse} db={dbReady} />
          )}
          {tab === 'fav' && (
            <FavScreen fav={fav} version={version} onJump={navigateToVerse} db={dbReady} chapterCache={chapterCache.current} />
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
            book={playBook} idx={readIdx} version={version} playing={playing}
            onPress={() => setShowNow(true)} onToggle={togglePlay} chapterCache={chapterCache.current} />
        )}

        <View style={styles.tabbar}>
          <TabBtn icon="home-outline" label="Accueil" active={tab === 'home'} onPress={() => setTab('home')} />
          <TabBtn icon="book-outline" label="Lire" active={tab === 'read'} onPress={() => setTab('read')} />
          <TabBtn icon="search-outline" label="Recherche" active={tab === 'search'} onPress={() => setTab('search')} />
          <TabBtn icon="bookmark-outline" label="Favoris" active={tab === 'fav'} onPress={() => setTab('fav')} />
          <TabBtn icon="options-outline" label="Réglages" active={tab === 'settings'} onPress={() => setTab('settings')} />
        </View>

        {sheetVerse !== null && (
          <VerseSheet
            book={book} idx={sheetVerse} version={version}
            hl={hl[vkey(book, sheetVerse)]} isFav={!!fav[vkey(book, sheetVerse)]}
            onClose={() => setSheetVerse(null)}
            onHighlight={(c: string) => setHighlight(sheetVerse, c)}
            onToggleFav={() => toggleFav(sheetVerse)}
            onListen={() => { setSheetVerse(null); startPlayback(sheetVerse, book); }}
            chapterCache={chapterCache.current}
          />
        )}

        {pickerOpen && (
          <BookPicker onClose={() => setPickerOpen(false)}
            onPick={(id: string) => { setBook(id); setPickerOpen(false); setTab('read'); }}
            downloading={downloading} onDownloadChapter={downloadChapter} available={available} />
        )}

        {showNow && (
          <NowPlaying
            book={playBook} idx={readIdx} version={version} playing={playing}
            speed={SPEEDS[speedIdx]} continuous={continuous}
            onClose={() => setShowNow(false)} onStop={stopPlayback}
            onToggle={togglePlay} onPrev={prevVerse} onNext={nextVerse}
            onSpeed={cycleSpeed} onToggleCont={() => setContinuous((v) => !v)}
            chapterCache={chapterCache.current} />
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}

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
