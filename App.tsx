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
  BIBLE, ALL_BOOKS, ORDER, VERSIONS, VLABEL, VLANG, VersionId, Chapter,
} from './src/data/bible';
import {
  loadBibleDb, getChapter, getBookList, searchVerses as searchVersesDb,
} from './src/data/bible-db';
import { colors as C, space as S, type as T, HL_COLORS } from './src/theme';

type Tab = 'home' | 'read' | 'search' | 'fav' | 'settings';
const SPEEDS = [0.75, 1, 1.25, 1.5];
const vkey = (b: string, i: number) => `${b}:${i}`;

function formatDate(): string {
  const d = new Date();
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function getBook(id: string) {
  return BIBLE[id] || BIBLE['jean'];
}

function dbChapterToChapterData(bookName: string, dbChapter: any, version: VersionId): Chapter {
  return {
    name: bookName,
    chapter: dbChapter.chapter_number,
    sub: dbChapter.sub || '',
    verseStart: dbChapter.verses?.[0]?.verse_number || 1,
    text: {
      dar: dbChapter.verses?.map((v: any) => v.dar ?? '') ?? [],
      lsg: dbChapter.verses?.map((v: any) => v.lsg ?? '') ?? [],
      kjv: dbChapter.verses?.map((v: any) => v.kjv ?? '') ?? [],
    },
  };
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
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

  const dbRef = useRef<any>(null);
  useEffect(() => {
    (async () => {
      try {
        const db = await loadBibleDb();
        dbRef.current = db;
      } catch (e) { console.warn('DB init failed', e); }
    })();
  }, []);

  useEffect(() => {
    setChapterData(null);
    if (!dbRef.current) return;
    (async () => {
      try {
        const chapterNum = getBook(book).chapter;
        const c = await getChapter(dbRef.current, book, chapterNum);
        if (c) {
          const list = await getBookList(dbRef.current);
          const info = list.find((b: any) => b.id === book);
          setChapterData(dbChapterToChapterData(info?.name || book, c, version));
        }
      } catch (e) { console.warn('Failed to load chapter', e); }
    })();
  }, [book]);

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
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { idxRef.current = readIdx; }, [readIdx]);
  useEffect(() => { bookRef.current = playBook; }, [playBook]);

  const endPlayback = useCallback(() => { setPlaying(false); playingRef.current = false; Speech.stop(); }, []);

  const speakFn = useRef<(idx: number, bk: string) => void>(() => {});
  const advanceFn = useRef<() => void>(() => {});

  advanceFn.current = () => {
    const bk = bookRef.current;
    const chap = BIBLE[bk];
    if (!chap) { endPlayback(); return; }
    const arr = chap.text[version];
    if (!arr || arr.length === 0) { endPlayback(); return; }
    const cur = idxRef.current;
    if (cur < arr.length - 1) {
      const n = cur + 1; setReadIdx(n); speakFn.current(n, bk); return;
    }
    if (continuous) {
      const pos = ORDER.indexOf(bk); const next = ORDER[pos + 1];
      if (next) {
        setPlayBook(next); setBook(next); setReadIdx(0); bookRef.current = next;
        speakFn.current(0, next); return;
      }
    }
    endPlayback();
  };

  speakFn.current = (idx: number, bk: string) => {
    Speech.stop();
    const chap = BIBLE[bk];
    if (!chap) { endPlayback(); return; }
    const arr = chap.text[version];
    if (!arr || idx >= arr.length) { endPlayback(); return; }
    Speech.speak(arr[idx], {
      language: VLANG[version],
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

  const chap = chapterData || getBook(book);

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
                <Text style={styles.refTxt}>{chap.name} {chap.chapter}</Text>
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

        <View style={styles.screens}>
          {tab === 'home' && (
            <HomeScreen version={version} onOpenBook={(id: string) => { setBook(id); setTab('read'); }}
              onPlayVotd={() => { setBook('jean'); setVersion('dar'); startPlayback(0, 'jean'); setShowNow(true); }} />
          )}
          {tab === 'read' && (
            <ReaderScreen
              book={book} version={version} readSize={readSize}
              hl={hl} fav={fav} playing={playing} playBook={playBook} readIdx={readIdx}
              chapterData={chapterData} onSelectVerse={setSheetVerse}
              onPrevBook={() => { const p = ORDER[ORDER.indexOf(book) - 1]; if (p) setBook(p); }}
              onNextBook={() => { const n = ORDER[ORDER.indexOf(book) + 1]; if (n) setBook(n); }}
            />
          )}
          {tab === 'search' && (
            <SearchScreen query={query} setQuery={setQuery} version={version}
              onJump={navigateToVerse} />
          )}
          {tab === 'fav' && (
            <FavScreen fav={fav} version={version} onJump={navigateToVerse} />
          )}
          {tab === 'settings' && (
            <SettingsScreen
              sizeStep={sizeStep} setSizeStep={setSizeStep}
              version={version} continuous={continuous} setContinuous={setContinuous}
              hlCount={Object.keys(hl).length} favCount={Object.keys(fav).length} />
          )}
        </View>

        {showMini && (
          <MiniPlayer
            book={playBook} idx={readIdx} version={version} playing={playing}
            onPress={() => setShowNow(true)} onToggle={togglePlay} />
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
          />
        )}

        {pickerOpen && (
          <BookPicker onClose={() => setPickerOpen(false)}
            onPick={(id: string) => { setBook(id); setPickerOpen(false); setTab('read'); }} />
        )}

        {showNow && (
          <NowPlaying
            book={playBook} idx={readIdx} version={version} playing={playing}
            speed={SPEEDS[speedIdx]} continuous={continuous}
            onClose={() => setShowNow(false)} onStop={stopPlayback}
            onToggle={togglePlay} onPrev={prevVerse} onNext={nextVerse}
            onSpeed={cycleSpeed} onToggleCont={() => setContinuous((v) => !v)} />
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}

function IconBtn({ name, onPress, active }: { name: string; onPress: () => void; active?: boolean }) {
  return (
    <Pressable onPress={onPress}
      style={({ pressed }) => [styles.iconBtn, active && styles.iconBtnOn, pressed && { transform: [{ scale: 0.9 }] }]}>
      <Ionicons name={name as any} size={18} color={active ? C.paper : C.inkSoft} />
    </Pressable>
  );
}

function VersionSwitch({ value, onChange }: { value: VersionId; onChange: (v: VersionId) => void }) {
  const items: VersionId[] = ['dar', 'lsg', 'kjv'];
  const sub: Record<VersionId, string> = { dar: 'Français', lsg: 'Louis Segond', kjv: 'English' };
  return (
    <View style={styles.versions}>
      {items.map((v) => {
        const on = v === value;
        return (
          <Pressable key={v} style={[styles.verBtn, on && styles.verBtnOn]} onPress={() => onChange(v)}>
            <Text style={[styles.verTxt, on && styles.verTxtOn]}>{VERSIONS[v]}</Text>
            <Text style={[styles.verSub, on && styles.verSubOn]}>{sub[v]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TabBtn({ icon, label, active, onPress }: { icon: string; label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.tab} onPress={onPress}>
      <Ionicons name={icon as any} size={22} color={active ? C.accent : C.inkFaint} />
      <Text style={[styles.tabTxt, { color: active ? C.accent : C.inkFaint }]}>{label}</Text>
    </Pressable>
  );
}

function HomeScreen({ version, onOpenBook, onPlayVotd }: { version: VersionId; onOpenBook: (id: string) => void; onPlayVotd: () => void }) {
  const [votd, setVotd] = useState(BIBLE.jean.text[version][0]);
  const dateStr = useMemo(() => formatDate(), []);
  useEffect(() => {
    setVotd(BIBLE.jean.text[version][0]);
  }, [version]);
  return (
    <ScrollView contentContainerStyle={{ padding: S.s5, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>QUE LA PAIX SOIT AVEC TOI</Text>
      <Text style={styles.homeDate}>{dateStr}</Text>

      <View style={styles.votd}>
        <View style={styles.votdLabel}>
          <Ionicons name="sparkles-outline" size={13} color="#F0D9B8" />
          <Text style={styles.votdLabelTxt}>  VERSET DU JOUR</Text>
        </View>
        <Text style={styles.votdText}>{votd}</Text>
        <View style={styles.votdFoot}>
          <Text style={styles.votdRef}>Jean 3.16 · {VERSIONS[version]}</Text>
          <Pressable style={styles.votdPlay} onPress={onPlayVotd}>
            <Ionicons name="play" size={14} color={C.paper} />
            <Text style={styles.votdPlayTxt}>  Écouter</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.sectionLabel}>REPRENDRE</Text>
      <Pressable style={styles.continue} onPress={() => onOpenBook('jean')}>
        <View style={styles.contIcon}><Ionicons name="book-outline" size={21} color={C.accentDeep} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contTitle}>Jean 3</Text>
          <Text style={styles.contSub}>L'amour de Dieu · {VERSIONS[version]}</Text>
          <View style={styles.progTrack}><View style={styles.progFill} /></View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.inkFaint} />
      </Pressable>

      <Text style={styles.sectionLabel}>MES LIVRES</Text>
      <View style={styles.grid}>
        {ALL_BOOKS.map((bk) => {
          const avail = bk.chap !== null;
          return (
            <Pressable key={bk.id} style={[styles.bcard, !avail && { opacity: 0.5 }]}
              onPress={() => avail && onOpenBook(bk.id)}>
              <View style={styles.bcardTop}>
                <Text style={[styles.bcardNum, !avail && { color: C.inkFaint }]}>{avail ? bk.chap : '—'}</Text>
                <Ionicons name={avail ? 'arrow-up-outline' : 'download-outline'} size={16} color={C.inkFaint}
                  style={avail ? { transform: [{ rotate: '45deg' }] } : undefined} />
              </View>
              <Text style={styles.bcardName}>{bk.name}</Text>
              <Text style={styles.bcardSub}>{avail ? getBook(bk.id).sub : 'À télécharger'}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

function ReaderScreen({ book, version, readSize, hl, fav, playing, playBook, readIdx, chapterData, onSelectVerse, onPrevBook, onNextBook }: {
  book: string; version: VersionId; readSize: number; hl: Record<string, string>; fav: Record<string, true>;
  playing: boolean; playBook: string; readIdx: number; chapterData?: Chapter | null;
  onSelectVerse: (i: number) => void; onPrevBook: () => void; onNextBook: () => void;
}) {
  const chap = chapterData || getBook(book);
  const arr = chap.text[version];
  const scrollRef = useRef<ScrollView>(null);
  const pos = ORDER.indexOf(book);
  const prev = ORDER[pos - 1]; const next = ORDER[pos + 1];

  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [book]);

  return (
    <ScrollView ref={scrollRef} contentContainerStyle={{ padding: S.s6, paddingTop: S.s10, paddingBottom: 150 }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.chapHead}>
        <Text style={styles.chapBook}>{chap.name.toUpperCase()}</Text>
        <View style={styles.flourish}>
          <View style={styles.flLine} />
          <Text style={styles.chapNum}>{chap.chapter}</Text>
          <View style={styles.flLine} />
        </View>
        <Text style={styles.chapSub}>{chap.sub}</Text>
      </View>

      <Text style={{ fontSize: readSize, lineHeight: readSize * 1.8, color: C.ink }}>
        {arr.map((t: string, i: number) => {
          const k = vkey(book, i);
          const bg = playing && book === playBook && i === readIdx
            ? C.hlReading : hl[k] ? HL_COLORS[hl[k]] : 'transparent';
          return (
            <Text key={i} onPress={() => onSelectVerse(i)}
              style={{ backgroundColor: bg, borderRadius: 6 }}>
              <Text style={styles.vn}>{chap.verseStart + i} </Text>
              {t}
              {fav[k] ? <Text style={{ color: C.gold }}> ●</Text> : null}
              {'  '}
            </Text>
          );
        })}
      </Text>

      <View style={styles.chapNav}>
        <Pressable style={[styles.chapNavBtn, !prev && { opacity: 0.4 }]} disabled={!prev} onPress={onPrevBook}>
          <Ionicons name="arrow-back" size={16} color={C.inkSoft} />
          <Text style={styles.chapNavTxt}>  {prev ? getBook(prev).name : 'Début'}</Text>
        </Pressable>
        <Pressable style={[styles.chapNavBtn, !next && { opacity: 0.4 }]} disabled={!next} onPress={onNextBook}>
          <Text style={styles.chapNavTxt}>{next ? getBook(next).name : 'Fin'}  </Text>
          <Ionicons name="arrow-forward" size={16} color={C.inkSoft} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function SearchScreen({ query, setQuery, version, onJump }: {
  query: string; setQuery: (q: string) => void; version: VersionId; onJump: (bid: string, verseIdx?: number) => void;
}) {
  const [dbReady, setDbReady] = useState<any>(null);
  const [dbResults, setDbResults] = useState<any[] | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const db = await loadBibleDb();
        setDbReady(db);
      } catch { /* db unavailable */ }
    })();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return null;
    if (dbReady) {
      return null;
    }
    const out: any[] = [];
    ORDER.forEach((bid) => {
      const chap = BIBLE[bid];
      if (!chap) return;
      chap.text[version].forEach((t, i) => {
        if (t.toLowerCase().includes(q)) out.push({ bid, i, text: t });
      });
    });
    return out;
  }, [query, version, dbReady]);

  useEffect(() => {
    if (!dbReady || query.trim().length < 2) { setDbResults(null); return; }
    (async () => {
      try {
const res = await searchVersesDb(dbReady, query.trim(), version);
          setDbResults(res.map((r: any) => ({
            bid: r.book_id,
            text: r.text,
            bookName: r.book_name,
            chapterNum: r.chapter_number,
            verseNum: r.verse_number,
            i: r.verse_number - 1,
          })));
      } catch { setDbResults([]); }
    })();
  }, [query, version, dbReady]);

  const displayResults = dbReady ? dbResults : results;

  return (
    <ScrollView contentContainerStyle={{ padding: S.s5, paddingBottom: 150 }} keyboardShouldPersistTaps="handled">
      <View style={styles.searchField}>
        <Ionicons name="search" size={18} color={C.inkFaint} />
        <TextInput style={styles.searchInput} placeholder="Un mot, un verset…"
          placeholderTextColor={C.inkFaint} value={query} onChangeText={(t) => setQuery(t.slice(0, 200))}
          autoCapitalize="none" autoCorrect={false} maxLength={200} />
      </View>
      {displayResults === null ? (
        <Hint icon="search-outline" text={'Cherchez dans les textes téléchargés.\nEssayez « lumière », « berger », « love ».'} />
      ) : displayResults.length === 0 ? (
        <Hint icon="close-circle-outline" text={`Aucun résultat pour « ${query} ».`} />
      ) : (
        displayResults.map((r: any, idx) => {
          const c = BIBLE[r.bid];
          const bookName = r.bookName ?? c?.name ?? r.bid;
          const chapterNum = r.chapterNum ?? c?.chapter ?? 1;
          const verseIdx = r.i ?? 0;
          const verseNum = r.verseNum ?? (c ? c.verseStart + verseIdx : verseIdx + 1);
          return (
            <Pressable key={idx} style={styles.result} onPress={() => onJump(r.bid, verseIdx)}>
              <View style={styles.resultRef}>
                <Text style={styles.resultR}>{bookName} {chapterNum}.{verseNum}</Text>
                <Text style={styles.resultV}>{VERSIONS[version]}</Text>
              </View>
              <Text style={styles.resultText}>{r.text}</Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

function FavScreen({ fav, version, onJump }: {
  fav: Record<string, true>; version: VersionId; onJump: (bid: string, verseIdx?: number) => void;
}) {
  const keys = Object.keys(fav);
  const [favChapters, setFavChapters] = useState<Record<string, Chapter>>({});
  useEffect(() => {
    (async () => {
      try {
        const db = await loadBibleDb();
        const map: Record<string, Chapter> = {};
        for (const k of Object.keys(fav)) {
          const [bid] = k.split(':');
          if (!map[bid] && !BIBLE[bid]) {
            try {
              const c = await getChapter(db, bid, 1);
              if (c) {
                const list = await getBookList(db);
                const info = list.find((b: any) => b.id === bid);
                map[bid] = dbChapterToChapterData(info?.name || bid, c, version);
              }
            } catch { /* skip */ }
          }
        }
        setFavChapters(map);
      } catch { /* db unavailable */ }
    })();
  }, [fav, version]);

  return (
    <ScrollView contentContainerStyle={{ padding: S.s5, paddingBottom: 150 }}>
      {keys.length === 0 ? (
        <Hint icon="bookmark-outline" text={"Aucun favori pour l'instant.\nTouchez un verset puis « Favori »."} />
      ) : (
        keys.map((k) => {
          const [bid, iS] = k.split(':'); const i = +iS; const c = BIBLE[bid] || favChapters[bid];
          if (!c) return null;
          return (
            <Pressable key={k} style={styles.result} onPress={() => onJump(bid, i)}>
              <View style={styles.resultRef}>
                <Text style={styles.resultR}>{c.name} {c.chapter}.{c.verseStart + i}</Text>
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

function SettingsScreen({ sizeStep, setSizeStep, version, continuous, setContinuous, hlCount, favCount }: {
  sizeStep: number; setSizeStep: (v: number) => void; version: VersionId; continuous: boolean; setContinuous: (v: boolean) => void;
  hlCount: number; favCount: number;
}) {
  return (
    <ScrollView contentContainerStyle={{ padding: S.s5, paddingBottom: 150 }}>
      <Text style={styles.setCap}>LECTURE</Text>
      <View style={styles.setGroup}>
        <View style={styles.setRow}>
          <View><Text style={styles.setLbl}>Taille du texte</Text><Text style={styles.setSub}>Confort de lecture</Text></View>
          <View style={styles.sizeCtrl}>
            <Pressable style={styles.sizeBtn} onPress={() => setSizeStep(Math.max(-2, sizeStep - 1))}><Text style={{ fontSize: 14, color: C.ink }}>A</Text></Pressable>
            <View style={styles.sizeDivider} />
            <Pressable style={styles.sizeBtn} onPress={() => setSizeStep(Math.min(4, sizeStep + 1))}><Text style={{ fontSize: 19, color: C.ink }}>A</Text></Pressable>
          </View>
        </View>
        <View style={[styles.setRow, styles.setRowLast]}>
          <View><Text style={styles.setLbl}>Version par défaut</Text><Text style={styles.setSub}>{VLABEL[version]}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={C.inkFaint} />
        </View>
      </View>

      <Text style={styles.setCap}>AUDIO</Text>
      <View style={styles.setGroup}>
        <View style={styles.setRow}>
          <View style={{ flex: 1 }}><Text style={styles.setLbl}>Lecture continue</Text><Text style={styles.setSub}>Enchaîne les chapitres sans s'arrêter</Text></View>
          <Toggle on={continuous} onPress={() => setContinuous(!continuous)} />
        </View>
      </View>

      <Text style={styles.setCap}>MON ACTIVITÉ</Text>
      <View style={styles.setGroup}>
        <View style={styles.setRow}><Text style={styles.setLbl}>Versets surlignés</Text><Text style={{ fontWeight: '600', color: C.inkSoft }}>{hlCount}</Text></View>
        <View style={[styles.setRow, styles.setRowLast]}><Text style={styles.setLbl}>Versets en favoris</Text><Text style={{ fontWeight: '600', color: C.inkSoft }}>{favCount}</Text></View>
      </View>
    </ScrollView>
  );
}

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  const anim = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: on ? 1 : 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [on]);
  const left = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 24] });
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [C.lineStrong, C.accent] });
  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.toggle, { backgroundColor: bg }]}>
        <Animated.View style={[styles.toggleKnob, { left }]} />
      </Animated.View>
    </Pressable>
  );
}

function Hint({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.hint}>
      <Ionicons name={icon as any} size={34} color={C.lineStrong} />
      <Text style={styles.hintTxt}>{text}</Text>
    </View>
  );
}

function VerseSheet({ book, idx, version, hl, isFav, onClose, onHighlight, onToggleFav, onListen }: {
  book: string; idx: number; version: VersionId; hl: string | undefined; isFav: boolean;
  onClose: () => void; onHighlight: (c: string) => void; onToggleFav: () => void; onListen: () => void;
}) {
  const [compare, setCompare] = useState(false);
  const chap = getBook(book);
  const swatches = ['', 'yellow', 'green', 'blue', 'pink', 'peach'];

  const copyVerse = useCallback(() => {
    const text = `${chap.name} ${chap.chapter}.${chap.verseStart + idx} — ${chap.text[version][idx]}`;
    try { Clipboard.setString(text); } catch { /* fallback */ }
  }, [chap, version, idx]);

  return (
    <Sheet onClose={onClose}>
      <Text style={styles.sheetRef}>{chap.name} {chap.chapter}.{chap.verseStart + idx}{compare ? ' — 3 versions' : ''}</Text>
      {compare ? (
        <View style={{ marginTop: S.s3 }}>
          {(['dar', 'lsg', 'kjv'] as VersionId[]).map((v) => (
            <View key={v} style={{ marginBottom: S.s4 }}>
              <Text style={styles.cmpLabel}>{VLABEL[v].toUpperCase()}</Text>
              <Text style={styles.cmpText}>{chap.text[v][idx]}</Text>
            </View>
          ))}
        </View>
      ) : (
        <>
          <Text style={styles.sheetQuote}>{chap.text[version][idx]}</Text>
          <View style={styles.swatchRow}>
            {swatches.map((c) => (
              <Pressable key={c || 'none'} onPress={() => onHighlight(c)}
                style={[styles.swatch, c ? { backgroundColor: HL_COLORS[c] } : styles.swatchNone, hl === c && styles.swatchSel]}>
                {!c && <Ionicons name="ban-outline" size={16} color={C.inkFaint} />}
              </Pressable>
            ))}
          </View>
          <View style={styles.sheetActions}>
            <SheetAct icon="play" label="Écouter" onPress={onListen} />
            <SheetAct icon={isFav ? 'bookmark' : 'bookmark-outline'} label={isFav ? 'Retiré' : 'Favori'} on={isFav} onPress={onToggleFav} />
            <SheetAct icon="copy-outline" label="Copier" onPress={copyVerse} />
            <SheetAct icon="layers-outline" label="Comparer" onPress={() => setCompare(true)} />
          </View>
        </>
      )}
    </Sheet>
  );
}

function SheetAct({ icon, label, on, onPress }: { icon: string; label: string; on?: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.sheetAct} onPress={onPress}>
      <Ionicons name={icon as any} size={20} color={on ? C.accent : C.inkSoft} />
      <Text style={[styles.sheetActTxt, on && { color: C.accent }]}>{label}</Text>
    </Pressable>
  );
}

function BookPicker({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  return (
    <Sheet onClose={onClose} title="Livres & chapitres">
      <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
        {(['Ancien Testament', 'Nouveau Testament'] as const).map((test) => (
          <View key={test}>
            <Text style={styles.pickCap}>{test.toUpperCase()}</Text>
            {ALL_BOOKS.filter((b) => b.testament === test).map((bk) => {
              const avail = bk.chap !== null;
              return (
                <Pressable key={bk.id} style={styles.bookRow} disabled={!avail}
                  onPress={() => onPick(bk.id)}>
                  <Text style={[styles.bookName, !avail && { opacity: 0.5 }]}>{bk.name}</Text>
                  {avail ? <Text style={styles.chip}>Ch. {bk.chap}</Text>
                    : <Ionicons name="download-outline" size={15} color={C.inkFaint} />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  const y = useRef(new Animated.Value(600)).current;
  useEffect(() => {
    Animated.timing(y, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: y }] }]}>
        <View style={styles.grabber} />
        {title && <Text style={styles.pickerTitle}>{title}</Text>}
        {children}
      </Animated.View>
    </View>
  );
}

function MiniPlayer({ book, idx, version, playing, onPress, onToggle }: {
  book: string; idx: number; version: VersionId; playing: boolean; onPress: () => void; onToggle: () => void;
}) {
  const chap = getBook(book);
  return (
    <Pressable style={styles.mini} onPress={onPress}>
      <View style={styles.miniCover}><Ionicons name="musical-notes" size={19} color={C.paper} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.miniRef} numberOfLines={1}>{chap.name} {chap.chapter}.{chap.verseStart + Math.max(0, idx)}</Text>
        <Text style={styles.miniSub} numberOfLines={1}>{VERSIONS[version]} · {playing ? 'lecture en cours' : 'en pause'}</Text>
      </View>
      <Pressable style={styles.miniBtn} onPress={onToggle}>
        <Ionicons name={playing ? 'pause' : 'play'} size={19} color={C.paper} />
      </Pressable>
    </Pressable>
  );
}

function NowPlaying({ book, idx, version, playing, speed, continuous, onClose, onStop, onToggle, onPrev, onNext, onSpeed, onToggleCont }: {
  book: string; idx: number; version: VersionId; playing: boolean; speed: number; continuous: boolean;
  onClose: () => void; onStop: () => void; onToggle: () => void; onPrev: () => void; onNext: () => void;
  onSpeed: () => void; onToggleCont: () => void;
}) {
  const y = useRef(new Animated.Value(800)).current;
  useEffect(() => {
    Animated.timing(y, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  const chap = getBook(book);
  const arr = chap.text[version];
  const safeIdx = Math.max(0, idx);
  const pct = arr.length > 1 ? (safeIdx / (arr.length - 1)) * 100 : 0;

  return (
    <Animated.View style={[styles.now, { transform: [{ translateY: y }] }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.nowTop}>
          <Pressable style={styles.nowTopBtn} onPress={onClose}><Ionicons name="chevron-down" size={20} color={C.paper} /></Pressable>
          <Text style={styles.nowTopLbl}>LECTURE AUDIO</Text>
          <Pressable style={styles.nowTopBtn} onPress={onStop}><Ionicons name="close" size={20} color={C.paper} /></Pressable>
        </View>

        <View style={styles.nowArt}><Ionicons name="musical-notes" size={64} color="rgba(255,255,255,0.85)" /></View>

        <Text style={styles.nowRef}>{chap.name} {chap.chapter}.{chap.verseStart + safeIdx}</Text>
        <Text style={styles.nowVer}>{VLABEL[version]}</Text>
        <Text style={styles.nowQuote} numberOfLines={4}>{arr[safeIdx]}</Text>

        <View style={{ marginTop: 'auto' }}>
          <View style={styles.nowBar}><View style={[styles.nowFill, { width: `${pct}%` }]} /></View>
          <View style={styles.nowTimes}>
            <Text style={styles.nowTimeTxt}>Verset {safeIdx + 1}</Text>
            <Text style={styles.nowTimeTxt}>/ {arr.length}</Text>
          </View>

          <View style={styles.nowCtrls}>
            <Pressable style={styles.nbtn} onPress={onPrev}><Ionicons name="play-skip-back" size={26} color={C.paper} /></Pressable>
            <Pressable style={styles.nbtnPlay} onPress={onToggle}><Ionicons name={playing ? 'pause' : 'play'} size={32} color={C.ink} /></Pressable>
            <Pressable style={styles.nbtn} onPress={onNext}><Ionicons name="play-skip-forward" size={26} color={C.paper} /></Pressable>
          </View>

          <View style={styles.nowOpts}>
            <Pressable style={styles.nowOpt} onPress={onToggleCont}>
              <Ionicons name="infinite" size={20} color={continuous ? C.gold : 'rgba(255,255,255,0.8)'} />
              <Text style={[styles.nowOptTxt, continuous && { color: C.gold }]}>Continu</Text>
            </Pressable>
            <Pressable style={styles.nowOpt} onPress={onSpeed}>
              <Text style={[styles.nowOptTxt, { fontSize: 15, fontWeight: '800' }]}>{speed}×</Text>
              <Text style={styles.nowOptTxt}>Vitesse</Text>
            </Pressable>
            <Pressable style={styles.nowOpt} onPress={onClose}>
              <Ionicons name="book-outline" size={20} color="rgba(255,255,255,0.8)" />
              <Text style={styles.nowOptTxt}>Texte</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
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
  iconBtn: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  iconBtnOn: { backgroundColor: C.accent, borderColor: C.accent },

  versions: { flexDirection: 'row', backgroundColor: C.paper3, borderRadius: 14, padding: 3 },
  verBtn: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center' },
  verBtnOn: { backgroundColor: C.accent },
  verTxt: { fontSize: 13, fontWeight: '600', color: C.inkSoft },
  verTxtOn: { color: C.paper },
  verSub: { fontSize: 10, fontWeight: '500', color: C.inkFaint, marginTop: 2 },
  verSubOn: { color: '#EAD9C8' },

  screens: { flex: 1, backgroundColor: C.paper },

  greeting: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: C.accent, marginBottom: 6 },
  homeDate: { fontSize: 29, fontWeight: '600', color: C.ink, letterSpacing: -0.5, marginBottom: S.s6 },
  votd: { backgroundColor: C.accentDeep, borderRadius: 24, padding: S.s6, marginBottom: S.s8 },
  votdLabel: { flexDirection: 'row', alignItems: 'center', marginBottom: S.s4 },
  votdLabelTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: '#F0D9B8' },
  votdText: { fontSize: 21, fontWeight: '500', lineHeight: 30, color: C.paper, marginBottom: S.s5 },
  votdFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  votdRef: { fontSize: 13, fontWeight: '600', color: '#F3E4D3' },
  votdPlay: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 },
  votdPlayTxt: { color: C.paper, fontSize: 13, fontWeight: '600' },

  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: C.inkFaint, marginBottom: S.s4 },
  continue: { flexDirection: 'row', alignItems: 'center', gap: S.s4, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: S.s4, marginBottom: S.s8 },
  contIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.accentTint, alignItems: 'center', justifyContent: 'center' },
  contTitle: { fontSize: 17, fontWeight: '600', color: C.ink },
  contSub: { fontSize: 12, color: C.inkFaint, marginTop: 2 },
  progTrack: { height: 5, borderRadius: 3, backgroundColor: C.paper3, marginTop: 10, overflow: 'hidden' },
  progFill: { height: '100%', width: '58%', backgroundColor: C.accent, borderRadius: 3 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.s3 },
  bcard: { width: '48%', backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: S.s4 },
  bcardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: S.s8 },
  bcardNum: { fontSize: 27, fontWeight: '600', color: C.accent },
  bcardName: { fontSize: 17, fontWeight: '600', color: C.ink },
  bcardSub: { fontSize: 12, color: C.inkFaint, marginTop: 2 },

  chapHead: { alignItems: 'center', marginBottom: S.s10 },
  chapBook: { fontSize: 12, fontWeight: '700', letterSpacing: 2.5, color: C.accent, marginBottom: S.s4 },
  flourish: { flexDirection: 'row', alignItems: 'center', gap: S.s4 },
  flLine: { height: 1, width: 48, backgroundColor: C.lineStrong },
  chapNum: { fontSize: 64, fontWeight: '600', color: C.ink, letterSpacing: -1 },
  chapSub: { fontSize: 15, fontStyle: 'italic', color: C.inkFaint, marginTop: S.s4 },
  vn: { fontSize: 11, fontWeight: '700', color: C.accent },

  chapNav: { flexDirection: 'row', justifyContent: 'space-between', gap: S.s3, marginTop: S.s12 },
  chapNavBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line, backgroundColor: C.surface, borderRadius: 14, paddingVertical: 15 },
  chapNavTxt: { fontSize: 13, fontWeight: '600', color: C.inkSoft },

  searchField: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: C.surface, borderWidth: 1, borderColor: C.lineStrong, borderRadius: 15, paddingHorizontal: S.s4, paddingVertical: 14, marginBottom: S.s6 },
  searchInput: { flex: 1, fontSize: 15, color: C.ink },
  result: { paddingVertical: S.s4, borderBottomWidth: 1, borderBottomColor: C.line },
  resultRef: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  resultR: { fontSize: 12, fontWeight: '700', color: C.accent, letterSpacing: 0.3 },
  resultV: { fontSize: 10, fontWeight: '600', color: C.inkFaint, backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  resultText: { fontSize: 16, lineHeight: 25, color: C.inkSoft },

  hint: { alignItems: 'center', paddingVertical: S.s12, paddingHorizontal: S.s6 },
  hintTxt: { textAlign: 'center', color: C.inkFaint, fontSize: 14, lineHeight: 22, marginTop: S.s3 },

  setCap: { fontSize: 12, fontWeight: '700', letterSpacing: 1, color: C.inkFaint, marginBottom: S.s3, marginLeft: S.s1 },
  setGroup: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 18, overflow: 'hidden', marginBottom: S.s5 },
  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.s4, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.line, gap: S.s4 },
  setRowLast: { borderBottomWidth: 0 },
  setLbl: { fontSize: 15, fontWeight: '500', color: C.ink },
  setSub: { fontSize: 12, color: C.inkFaint, marginTop: 3 },
  sizeCtrl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 12, overflow: 'hidden' },
  sizeBtn: { width: 42, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface },
  sizeDivider: { width: 1, height: '100%', backgroundColor: C.line },

  toggle: { width: 50, height: 29, borderRadius: 20, justifyContent: 'center' },
  toggleKnob: { position: 'absolute', width: 23, height: 23, borderRadius: 12, backgroundColor: '#fff', top: 3 },

  tabbar: { flexDirection: 'row', backgroundColor: C.paper, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 8 },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 },
  tabTxt: { fontSize: 11, fontWeight: '600' },

  mini: { position: 'absolute', left: 10, right: 10, bottom: Platform.OS === 'ios' ? 92 : 74, backgroundColor: C.ink, borderRadius: 18, padding: 9, paddingLeft: S.s3, flexDirection: 'row', alignItems: 'center', gap: S.s3, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  miniCover: { width: 40, height: 40, borderRadius: 11, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  miniRef: { fontSize: 15, fontWeight: '600', color: C.paper },
  miniSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  miniBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },

  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(60,52,44,0.42)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: S.s5, paddingTop: S.s3, paddingBottom: 40 },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.lineStrong, alignSelf: 'center', marginBottom: S.s5 },
  pickerTitle: { fontSize: 19, fontWeight: '600', color: C.ink, textAlign: 'center', marginBottom: S.s4 },
  sheetRef: { fontSize: 18, fontWeight: '600', color: C.ink, marginBottom: 3 },
  sheetQuote: { fontSize: 15, color: C.inkSoft, lineHeight: 23, marginBottom: S.s5 },
  swatchRow: { flexDirection: 'row', gap: 11, marginBottom: S.s5 },
  swatch: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  swatchNone: { backgroundColor: C.surface },
  swatchSel: { borderColor: C.ink },
  sheetActions: { flexDirection: 'row', gap: 9 },
  sheetAct: { flex: 1, alignItems: 'center', gap: 7, backgroundColor: C.paper2, borderWidth: 1, borderColor: C.line, borderRadius: 15, paddingVertical: 14 },
  sheetActTxt: { fontSize: 11, fontWeight: '600', color: C.inkSoft },
  cmpLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: C.accent, marginBottom: 5 },
  cmpText: { fontSize: 16, lineHeight: 26, color: C.ink },

  pickCap: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: C.inkFaint, paddingTop: S.s4, paddingBottom: S.s2, paddingHorizontal: S.s3 },
  bookRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: S.s3, borderBottomWidth: 1, borderBottomColor: C.line },
  bookName: { fontSize: 17, fontWeight: '500', color: C.ink },
  chip: { fontSize: 12, fontWeight: '600', color: C.accent, backgroundColor: C.accentTint, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 4, overflow: 'hidden' },

  now: { ...StyleSheet.absoluteFillObject, backgroundColor: C.nowMid, paddingHorizontal: S.s6 },
  nowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.s2, marginBottom: S.s6 },
  nowTopBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  nowTopLbl: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(255,255,255,0.85)' },
  nowArt: { width: 240, height: 240, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: S.s6, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 40, shadowOffset: { width: 0, height: 30 } },
  nowRef: { fontSize: 30, fontWeight: '600', color: C.paper, textAlign: 'center', letterSpacing: -0.5 },
  nowVer: { fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 5 },
  nowQuote: { fontSize: 16, lineHeight: 26, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: S.s6 },
  nowBar: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' },
  nowFill: { height: '100%', backgroundColor: C.paper, borderRadius: 3 },
  nowTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  nowTimeTxt: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  nowCtrls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.s6, marginTop: S.s6 },
  nbtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  nbtnPlay: { width: 74, height: 74, borderRadius: 37, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  nowOpts: { flexDirection: 'row', justifyContent: 'center', gap: S.s8, marginTop: S.s8, marginBottom: S.s6 },
  nowOpt: { alignItems: 'center', gap: 5 },
  nowOptTxt: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
});
