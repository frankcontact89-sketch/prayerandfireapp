import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Search, Star, ChevronRight, BookOpen, Globe, Sun, Moon, Play, Pause, Type, StickyNote, Save, Trash2, Copy, Share2, X, Check, Headphones, Menu, Highlighter, Link2, BookMarked } from "lucide-react";
import { getLocalizedBookName, BIBLE_BOOK_NAMES } from "@/data/bible/book-names";
import { translations } from "@/config/translations";

const normalize = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// All searchable names (EN/ES/PT + data name + abbrev) for a given book abbrev.
function bookAliases(abbrev: string, dataName: string): string[] {
  const entry = BIBLE_BOOK_NAMES[(abbrev || "").toLowerCase()];
  const list = [dataName, abbrev];
  if (entry) list.push(entry.en, entry.es, entry.pt);
  if (entry?.en === "Psalms") list.push("Psalm", "Salmo", "Salmos");
  return list.filter(Boolean).map(normalize);
}

// Splits "Romans 8:28" / "1 Juan 3" into { name, chapter, verse }
function parseQuery(raw: string) {
  const q = raw.trim();
  const m = q.match(/^(.*?)[\s.]*(\d+)?\s*(?::\s*(\d+))?\s*$/);
  if (!m) return { name: normalize(q), chapter: null as number | null, verse: null as number | null };
  const name = normalize(m[1] || "");
  return {
    name,
    chapter: m[2] ? Number(m[2]) : null,
    verse: m[3] ? Number(m[3]) : null,
  };
}

type Book = { name: string; abbrev: string; chapters: string[][] };
type Translation = { code: string; label: string; loader: () => Promise<Book[]> };

const TRANSLATIONS: Translation[] = [
  {
    code: "kjv",
    label: "English | KJV",
    loader: () => import("@/data/bible/kjv.json").then((m) => m.default as Book[]),
  },
  {
    code: "rvr",
    label: "Español | Reina-Valera 1960",
    loader: () => import("@/data/bible/rvr.json").then((m) => m.default as Book[]),
  },
  {
    code: "aa",
    label: "Português | Almeida",
    loader: () => import("@/data/bible/aa.json").then((m) => m.default as Book[]),
  },
];

const FAV_KEY = "pf_bible_favorites";
const NOTES_KEY = "pf_bible_notes";
const HIGHLIGHT_KEY = "pf_bible_highlights";
const LANG_KEY = "pf_bible_lang";
const APP_LANG_KEY = "pf_bible_last_app_lang";
const MODE_KEY = "pf_bible_mode";
const BOOK_KEY = "pf_bible_book";
const CHAPTER_KEY = "pf_bible_chapter";
const VIEW_KEY = "pf_bible_view";
const FONT_SIZE_KEY = "pf_bible_font_size";
const LINE_HEIGHT_KEY = "pf_bible_line_height";
const FONT_KEY = "pf_bible_font";
const VERSE_KEY = "pf_bible_verse";
const RATE_KEY = "pf_bible_audio_rate";

// Heuristic gender detection from voice names across platforms/locales.
const FEMALE_NAME_HINTS = [
  "female", "mujer", "femen", "femin", "feminina",
  "samantha", "victoria", "karen", "moira", "tessa", "fiona", "veena", "susan", "allison", "ava", "serena",
  "monica", "paulina", "marisol", "esperanza", "soledad", "angelica", "rosa", "lucia", "sofia", "valentina", "isabela", "luciana",
  "joana", "raquel", "ines", "catarina", "amelie", "audrey", "marie",
  "google.*female", "microsoft zira", "microsoft hazel", "microsoft helena", "microsoft sabina", "microsoft elsa",
  "microsoft maria", "microsoft helia", "microsoft francisca",
];
const MALE_NAME_HINTS = [
  "male", "hombre", "masc", "masculino",
  "alex", "daniel", "fred", "tom", "oliver", "aaron", "arthur", "gordon", "lee", "rishi",
  "diego", "jorge", "juan", "pablo", "carlos", "miguel", "javier",
  "joaquim", "duarte", "felipe",
  "google.*male", "microsoft david", "microsoft mark", "microsoft george", "microsoft pablo",
  "microsoft jorge", "microsoft antonio", "microsoft duarte",
];

function voiceGenderScore(name: string, hints: string[]): boolean {
  const lower = name.toLowerCase();
  return hints.some((h) => new RegExp(`(^|[^a-z])${h}([^a-z]|$)`, "i").test(lower));
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const synth = window.speechSynthesis;
  if (!synth) return null;
  const all = synth.getVoices();
  if (!all.length) return null;
  const langPrefix = lang.split("-")[0];
  const matches = all.filter((v) => v.lang?.toLowerCase().startsWith(langPrefix));
  const pool = matches.length ? matches : all;

  const preferred = pool.find((v) => voiceGenderScore(v.name, FEMALE_NAME_HINTS));
  if (preferred) return preferred;
  // Avoid clearly male voices; otherwise just take first match.
  const neutral = pool.find((v) => !voiceGenderScore(v.name, MALE_NAME_HINTS));
  return neutral || pool[0] || null;
}

const VERSE_TICK_MS = 350; // ~ approximated time-step for skip back/forward

type Favorite = {
  translation: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
};

function loadFavorites(): Favorite[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveFavorites(favorites: Favorite[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
}

function loadNotes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveNotes(notes: Record<string, string>) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function loadHighlights(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(HIGHLIGHT_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveHighlights(h: Record<string, boolean>) {
  localStorage.setItem(HIGHLIGHT_KEY, JSON.stringify(h));
}

const APP_LANG_TO_BIBLE: Record<string, string> = { en: "kjv", es: "rvr", pt: "aa" };
const BIBLE_TO_BOOK_LANG: Record<string, "en" | "es" | "pt"> = { kjv: "en", rvr: "es", aa: "pt" };

interface BibleScreenProps {
  t?: (key: any) => string;
  language?: string;
  initialRef?: { abbrev: string; chapter: number; verse: number; nonce: number } | null;
  onInitialRefApplied?: () => void;
  onExitToOrigin?: () => void;
}

export function BibleScreen({ t, language, initialRef, onInitialRefApplied, onExitToOrigin, onReadingChange }: BibleScreenProps & { onReadingChange?: (reading: boolean) => void } = {}) {
  const [translation, setTranslation] = useState(() => {
    const stored = localStorage.getItem(LANG_KEY);
    const lastAppLanguage = localStorage.getItem(APP_LANG_KEY);
    const appTranslation = language ? APP_LANG_TO_BIBLE[language] : null;
    if (appTranslation && lastAppLanguage !== language) return appTranslation;
    if (stored && TRANSLATIONS.some((x) => x.code === stored)) return stored;
    return appTranslation || "kjv";
  });

  // Book names follow the selected Bible translation, independently from the
  // interface language (for example, Spanish RVR while the app is in English).
  const bibleBookLanguage = BIBLE_TO_BOOK_LANG[translation] || "en";
  const bookName = (book: Book) => getLocalizedBookName(book.abbrev, book.name, bibleBookLanguage);

  const previousReadingLabel =
    bibleBookLanguage === "es"
      ? "Volver a la lectura"
      : bibleBookLanguage === "pt"
        ? "Voltar à leitura"
        : "Return to reading";

  // All Bible-screen labels follow the selected Bible translation language,
  // so switching the Bible to English/Portuguese also switches its UI text.
  const tr = (k: string, fallback: string) => {
    const dict = translations[bibleBookLanguage];
    const v = dict?.[k];
    if (v) return v;
    if (!t) return fallback;
    const appValue = t(k as any);
    return appValue && appValue !== k ? appValue : fallback;
  };

  const [mode, setMode] = useState<"day" | "night">(
    () => (localStorage.getItem(MODE_KEY) as "day" | "night") || "night",
  );

  const [books, setBooks] = useState<Book[] | null>(null);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"books" | "chapters" | "verses" | "search" | "favorites">(
    () => (localStorage.getItem(VIEW_KEY) as any) || "books",
  );

  // Tell the app shell to hide the global hamburger while reading a chapter.
  useEffect(() => {
    onReadingChange?.(view === "verses");
    return () => onReadingChange?.(false);
  }, [view, onReadingChange]);

  const [bookIdx, setBookIdx] = useState(() => Number(localStorage.getItem(BOOK_KEY) || 0));
  const [chapterIdx, setChapterIdx] = useState(() => Number(localStorage.getItem(CHAPTER_KEY) || 0));
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Favorite[]>(loadFavorites);
  const [notes, setNotes] = useState<Record<string, string>>(loadNotes);
  const [openNoteKey, setOpenNoteKey] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showReaderSettings, setShowReaderSettings] = useState(false);
  const [showBibleMenu, setShowBibleMenu] = useState(false);
  const [highlights, setHighlights] = useState<Record<string, boolean>>(loadHighlights);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem(FONT_SIZE_KEY) || 20));
  const [lineHeight, setLineHeight] = useState(() => Number(localStorage.getItem(LINE_HEIGHT_KEY) || 1.85));
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem(FONT_KEY) || "system");

  const [verseIdx, setVerseIdx] = useState(() => Number(localStorage.getItem(VERSE_KEY) || 0));
  const [audioRate, setAudioRate] = useState<number>(() => Number(localStorage.getItem(RATE_KEY) || 1));
  const speakingRef = React.useRef(false);
  const verseRefsRef = useRef<Record<number, HTMLDivElement | null>>({});
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const [actionVerse, setActionVerse] = useState<number | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [arrivedViaRef, setArrivedViaRef] = useState(false);

  const isDay = mode === "day";

  useEffect(() => {
    setLoading(true);
    const selected = TRANSLATIONS.find((item) => item.code === translation) || TRANSLATIONS[0];

    selected.loader().then((data) => {
      setBooks(data);
      setBookIdx((prev) => Math.min(prev, data.length - 1));
      setLoading(false);
    });

    localStorage.setItem(LANG_KEY, translation);
  }, [translation]);

  useEffect(() => {
    const appTranslation = language ? APP_LANG_TO_BIBLE[language] : null;
    const previousAppLanguage = localStorage.getItem(APP_LANG_KEY);
    if (appTranslation && previousAppLanguage !== language) {
      setTranslation(appTranslation);
      localStorage.setItem(APP_LANG_KEY, language);
    }
    // React only to a real app-language change. A manually selected Bible
    // translation remains selected while the interface language is unchanged.
  }, [language]);

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
    localStorage.setItem(BOOK_KEY, String(bookIdx));
    localStorage.setItem(CHAPTER_KEY, String(chapterIdx));
    localStorage.setItem(VIEW_KEY, view);
    localStorage.setItem(FONT_SIZE_KEY, String(fontSize));
    localStorage.setItem(LINE_HEIGHT_KEY, String(lineHeight));
    localStorage.setItem(FONT_KEY, fontFamily);
    localStorage.setItem(VERSE_KEY, String(verseIdx));
    localStorage.setItem(RATE_KEY, String(audioRate));
  }, [mode, bookIdx, chapterIdx, view, fontSize, lineHeight, fontFamily, verseIdx, audioRate]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      speakingRef.current = false;
    };
  }, []);

  // Pre-load voices (Chrome populates them asynchronously).
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const handler = () => {/* trigger re-render via state if needed */};
    window.speechSynthesis.onvoiceschanged = handler;
    window.speechSynthesis.getVoices();
  }, []);

  const currentBook = books?.[bookIdx];
  const currentVerses = currentBook?.chapters?.[chapterIdx] || [];

  // When an external Bible reference is requested (e.g. tapping a link
  // inside an article), jump to that book/chapter/verse using the current
  // translation.
  const appliedRefNonceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!initialRef || !books) return;
    if (appliedRefNonceRef.current === initialRef.nonce) return;
    const idx = books.findIndex(
      (b) => b.abbrev?.toLowerCase() === initialRef.abbrev.toLowerCase(),
    );
    if (idx < 0) return;
    const targetBook = books[idx];
    const cIdx = Math.max(0, Math.min(initialRef.chapter - 1, targetBook.chapters.length - 1));
    const chapterLen = targetBook.chapters[cIdx]?.length || 1;
    const vIdx = Math.max(0, Math.min(initialRef.verse - 1, chapterLen - 1));
    try { window.speechSynthesis?.cancel(); } catch {}
    setBookIdx(idx);
    setChapterIdx(cIdx);
    setVerseIdx(vIdx);
    setView("verses");
    appliedRefNonceRef.current = initialRef.nonce;
    setArrivedViaRef(true);
    setShowResumeBanner(false);
    onInitialRefApplied?.();
    // Scroll to verse after render
    setTimeout(() => {
      const el = verseRefsRef.current[vIdx];
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }, [initialRef, books, onInitialRefApplied]);

  const speechLang =
    translation === "rvr" ? "es-ES" : translation === "aa" ? "pt-BR" : "en-US";

  type SearchResult =
    | { kind: "book"; book: Book; bIdx: number }
    | { kind: "ref"; book: Book; bIdx: number; cIdx: number; vIdx: number | null; text?: string }
    | { kind: "verse"; book: Book; bIdx: number; cIdx: number; vIdx: number; text: string };

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!query.trim() || !books) return [];

    const { name, chapter, verse } = parseQuery(query);
    const results: SearchResult[] = [];

    // 1 & 2 — book name / reference matches
    if (name) {
      const exact: number[] = [];
      const starts: number[] = [];
      const contains: number[] = [];

      books.forEach((book, b) => {
        const aliases = bookAliases(book.abbrev, book.name);
        if (aliases.some((a) => a === name)) exact.push(b);
        else if (aliases.some((a) => a.startsWith(name))) starts.push(b);
        else if (name.length >= 3 && aliases.some((a) => a.includes(name))) contains.push(b);
      });

      const matched = [...exact, ...starts, ...contains].slice(0, 12);

      for (const b of matched) {
        const book = books[b];
        if (chapter) {
          const cIdx = Math.min(Math.max(chapter - 1, 0), book.chapters.length - 1);
          const chapterVerses = book.chapters[cIdx] || [];
          const vIdx =
            verse != null ? Math.min(Math.max(verse - 1, 0), chapterVerses.length - 1) : null;
          results.push({
            kind: "ref",
            book,
            bIdx: b,
            cIdx,
            vIdx,
            text: vIdx != null ? chapterVerses[vIdx] : undefined,
          });
        } else {
          results.push({ kind: "book", book, bIdx: b });
        }
      }
    }

    // 3 — verse text search (lowest priority)
    const q = normalize(query);
    if (q.length >= 3) {
      const limit = results.length ? 40 : 60;
      let count = 0;
      for (let b = 0; b < books.length && count < limit; b++) {
        const book = books[b];
        for (let c = 0; c < book.chapters.length && count < limit; c++) {
          const chapterVerses = book.chapters[c];
          for (let v = 0; v < chapterVerses.length && count < limit; v++) {
            const verseText = chapterVerses[v];
            if (normalize(verseText).includes(q)) {
              results.push({ kind: "verse", book, bIdx: b, cIdx: c, vIdx: v, text: verseText });
              count++;
            }
          }
        }
      }
    }

    return results;
  }, [query, books]);

  const toggleFavorite = (verse: Favorite) => {
    const exists = favorites.find(
      (item) =>
        item.translation === verse.translation &&
        item.book === verse.book &&
        item.chapter === verse.chapter &&
        item.verse === verse.verse,
    );

    const next = exists ? favorites.filter((item) => item !== exists) : [verse, ...favorites];
    setFavorites(next);
    saveFavorites(next);
  };

  const isFav = (book: string, chapter: number, verse: number) =>
    favorites.some(
      (item) =>
        item.translation === translation && item.book === book && item.chapter === chapter && item.verse === verse,
    );

  const noteKeyFor = (book: string, chapter: number, verse: number) =>
    `${translation}|${book}|${chapter}|${verse}`;

  const openNoteFor = (book: string, chapter: number, verse: number) => {
    const key = noteKeyFor(book, chapter, verse);
    setOpenNoteKey(key);
    setNoteDraft(notes[key] || "");
  };

  const saveCurrentNote = () => {
    if (!openNoteKey) return;
    const next = { ...notes };
    if (noteDraft.trim()) next[openNoteKey] = noteDraft.trim();
    else delete next[openNoteKey];
    setNotes(next);
    saveNotes(next);
    setOpenNoteKey(null);
  };

  const deleteCurrentNote = () => {
    if (!openNoteKey) return;
    const next = { ...notes };
    delete next[openNoteKey];
    setNotes(next);
    saveNotes(next);
    setOpenNoteKey(null);
  };

  const toggleHighlight = (book: string, chapter: number, verse: number) => {
    const key = noteKeyFor(book, chapter, verse);
    const next = { ...highlights };
    if (next[key]) delete next[key];
    else next[key] = true;
    setHighlights(next);
    saveHighlights(next);
  };
  const isHighlighted = (book: string, chapter: number, verse: number) =>
    !!highlights[noteKeyFor(book, chapter, verse)];

  const copyReference = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref);
      setCopiedKey(ref);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {}
  };

  const updateMediaSession = (bIdx: number, cIdx: number, vIdx: number) => {
    if (!("mediaSession" in navigator) || !books) return;
    const book = books[bIdx];
    if (!book) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${bookName(book)} ${cIdx + 1}:${vIdx + 1}`,
        artist: "Prayer & Fire — Holy Bible",
        album: TRANSLATIONS.find((t) => t.code === translation)?.label || "",
      });
    } catch {}
  };

  const speakVerseAt = (bIdx: number, cIdx: number, vIdx: number) => {
    if (!books) return;
    const book = books[bIdx];
    if (!book) return;
    const verses = book.chapters?.[cIdx];
    if (!verses || !verses.length) return;

    // Out of range -> auto advance chapter / book.
    if (vIdx >= verses.length) {
      let nextBook = bIdx;
      let nextChapter = cIdx + 1;
      if (nextChapter >= book.chapters.length) {
        nextBook = bIdx + 1;
        nextChapter = 0;
      }
      if (nextBook >= books.length) {
        speakingRef.current = false;
        setIsSpeaking(false);
        return;
      }
      setBookIdx(nextBook);
      setChapterIdx(nextChapter);
      setVerseIdx(0);
      setTimeout(() => speakVerseAt(nextBook, nextChapter, 0), 250);
      return;
    }

    setBookIdx(bIdx);
    setChapterIdx(cIdx);
    setVerseIdx(vIdx);

    const text = verses[vIdx];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = audioRate;
    utterance.pitch = 1;
    const voice = pickVoice(speechLang);
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (!speakingRef.current) return;
      speakVerseAt(bIdx, cIdx, vIdx + 1);
    };
    utterance.onerror = () => {
      speakingRef.current = false;
      setIsSpeaking(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    speakingRef.current = true;
    setIsSpeaking(true);
    updateMediaSession(bIdx, cIdx, vIdx);
  };

  const playChapter = () => {
    if (!currentBook || !currentVerses.length) return;
    if (isSpeaking) {
      speakingRef.current = false;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const startVerse = verseIdx < currentVerses.length ? verseIdx : 0;
    speakVerseAt(bookIdx, chapterIdx, startVerse);
  };

  const pauseAudio = () => {
    speakingRef.current = false;
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const resumeAudio = () => {
    if (!currentBook || !currentVerses.length) return;
    const startVerse = verseIdx < currentVerses.length ? verseIdx : 0;
    speakVerseAt(bookIdx, chapterIdx, startVerse);
  };

  // Skip ±2 verses (≈10s of narration) and continue playback state.
  const skipVerses = (delta: number) => {
    if (!books || !currentBook) return;
    let nb = bookIdx;
    let nc = chapterIdx;
    let nv = verseIdx + delta;
    while (nv < 0) {
      nc -= 1;
      if (nc < 0) {
        nb -= 1;
        if (nb < 0) { nb = 0; nc = 0; nv = 0; break; }
        nc = books[nb].chapters.length - 1;
      }
      nv += books[nb].chapters[nc].length;
    }
    while (nv >= (books[nb]?.chapters[nc]?.length || 0)) {
      nv -= books[nb].chapters[nc].length;
      nc += 1;
      if (nc >= books[nb].chapters.length) {
        nb += 1; nc = 0;
        if (nb >= books.length) {
          nb = books.length - 1;
          nc = books[nb].chapters.length - 1;
          nv = books[nb].chapters[nc].length - 1;
          break;
        }
      }
    }
    if (isSpeaking) {
      speakingRef.current = false;
      window.speechSynthesis.cancel();
      setTimeout(() => speakVerseAt(nb, nc, nv), 100);
    } else {
      setBookIdx(nb); setChapterIdx(nc); setVerseIdx(nv);
      updateMediaSession(nb, nc, nv);
    }
  };

  // If rate changes while playing, restart current verse with new settings.
  useEffect(() => {
    if (!isSpeaking) return;
    speakingRef.current = false;
    window.speechSynthesis.cancel();
    setTimeout(() => speakVerseAt(bookIdx, chapterIdx, verseIdx), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRate]);

  // Wire up Media Session lock-screen / hardware controls when supported.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("play", () => resumeAudio());
      navigator.mediaSession.setActionHandler("pause", () => pauseAudio());
      navigator.mediaSession.setActionHandler("seekbackward", () => skipVerses(-1));
      navigator.mediaSession.setActionHandler("seekforward", () => skipVerses(1));
      navigator.mediaSession.setActionHandler("previoustrack", () => skipVerses(-1));
      navigator.mediaSession.setActionHandler("nexttrack", () => skipVerses(1));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books, bookIdx, chapterIdx, verseIdx, isSpeaking, audioRate]);

  // Keep verseIdx valid when chapter/book change manually.
  useEffect(() => {
    if (!books) return;
    const len = books[bookIdx]?.chapters[chapterIdx]?.length || 0;
    if (verseIdx >= len) setVerseIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookIdx, chapterIdx, books]);

  // Auto-scroll active verse into view while audio plays.
  useEffect(() => {
    if (!isSpeaking || view !== "verses") return;
    const el = verseRefsRef.current[verseIdx];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [verseIdx, isSpeaking, view]);

  // Offer "resume from where you left off" when re-entering verses view.
  useEffect(() => {
    if (view === "verses" && verseIdx > 0 && !isSpeaking) {
      setShowResumeBanner(true);
    } else if (view !== "verses") {
      setShowResumeBanner(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const playFromVerse = (idx: number) => {
    speakingRef.current = false;
    window.speechSynthesis?.cancel();
    setShowResumeBanner(false);
    setTimeout(() => speakVerseAt(bookIdx, chapterIdx, idx), 60);
  };

  const startLongPress = (idx: number) => {
    longPressFiredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      longPressFiredRef.current = true;
      setSelectedVerses((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) next.delete(idx); else next.add(idx);
        return next;
      });
      if (navigator.vibrate) try { navigator.vibrate(15); } catch {}
    }, 450);
  };

  const toggleSelectVerse = (idx: number) => {
    setSelectedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };
  const clearSelection = () => setSelectedVerses(new Set());

  // Clear selection when chapter/book/translation changes.
  useEffect(() => {
    setSelectedVerses(new Set());
  }, [bookIdx, chapterIdx, translation]);
  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const copyVerse = async (text: string, ref: string) => {
    const payload = `"${text}" — ${ref}`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopiedKey(ref);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {}
  };

  const shareVerseImage = async (text: string, ref: string) => {
    const shareText = `"${text}" — ${ref}\n\nPrayer & Fire`;
    try {
      const canvas = document.createElement("canvas");
      const W = 1080, H = 1080;
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "#0a0a0a");
        grad.addColorStop(1, "#1f0a00");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "#ff6a00";
        ctx.lineWidth = 6;
        ctx.strokeRect(50, 50, W - 100, H - 100);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "italic 44px Georgia, serif";
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let line = "";
        const maxW = 880;
        for (const w of words) {
          const test = line ? line + " " + w : w;
          if (ctx.measureText(test).width > maxW) { lines.push(line); line = w; }
          else line = test;
        }
        if (line) lines.push(line);
        const lineH = 60;
        const startY = H / 2 - (lines.length * lineH) / 2;
        lines.forEach((l, i) => ctx.fillText(l, W / 2, startY + i * lineH));
        ctx.fillStyle = "#ff6a00";
        ctx.font = "bold 40px sans-serif";
        ctx.fillText(ref, W / 2, H - 170);
        ctx.fillStyle = "#999999";
        ctx.font = "bold 22px sans-serif";
        ctx.fillText("PRAYER & FIRE", W / 2, H - 110);
        const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        if (blob) {
          const file = new File([blob], `${ref.replace(/[^\w]+/g, "_")}.png`, { type: "image/png" });
          const nav = navigator as any;
          if (nav.canShare && nav.canShare({ files: [file] })) {
            try { await nav.share({ files: [file], title: ref, text: shareText }); return; } catch {}
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${ref.replace(/[^\w]+/g, "_")}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          return;
        }
      }
    } catch {}
    try {
      if ((navigator as any).share) await (navigator as any).share({ title: ref, text: shareText });
      else await navigator.clipboard.writeText(shareText);
    } catch {}
  };

  const pageBg = isDay ? "bg-[#f8f5ef] text-zinc-950" : "bg-black text-white";
  const card = isDay ? "bg-white border-zinc-200 text-zinc-950" : "bg-zinc-950 border-zinc-900 text-white";

  const fontClass = fontFamily === "serif" ? "font-serif" : fontFamily === "mono" ? "font-mono" : "font-sans";

  const Header = ({ title, onBack }: { title: string; onBack?: () => void }) => (
    <div
      className={`sticky top-0 z-40 isolate overflow-hidden border-b ${
        isDay ? "bg-white border-zinc-200" : "bg-black border-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-2 gap-3 min-h-[48px]">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button onClick={onBack} className="text-orange-500 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <h2 className="text-[18px] sm:text-[20px] font-semibold truncate">{title}</h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {view === "verses" && (
            <>
              <button
                onClick={() => setView("search")}
                aria-label="Search"
                className="text-orange-500 min-w-[44px] min-h-[44px] flex items-center justify-center -m-2"
              >
                <Search className="w-5 h-5" />
              </button>
            </>
          )}

          <button onClick={() => setShowReaderSettings(true)} className="text-orange-500">
            <Type className="w-5 h-5" />
          </button>

          <button onClick={() => setMode(isDay ? "night" : "day")} className="text-orange-500">
            {isDay ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowLangPicker(true)}
            className="text-orange-500 shrink-0 flex items-center gap-1.5 text-sm"
          >
            <Globe className="w-4 h-4" />
            <span className="uppercase tracking-wider text-xs font-semibold">{translation}</span>
          </button>

          {view === "verses" && (
            <button
              onClick={() => setShowReaderSettings(true)}
              aria-label="Audio"
              className="text-orange-500"
            >
              <Headphones className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading || !books) {
    return (
      <div className={`${pageBg} min-h-[60vh] flex items-center justify-center`}>
        <div className="text-orange-500">{tr("bible_loading", "Loading Bible…")}</div>
      </div>
    );
  }

  return (
    <div className={`${pageBg}`}>
      <div>
        {view === "books" && (
          <>
            <Header title={tr("holy_bible", "Holy Bible")} />

            <div className="px-4 sm:px-5 pt-3 pb-8 max-w-[720px] mx-auto">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setView("search")}
                  className={`flex-1 flex items-center gap-2 border rounded-xl px-4 py-3 text-sm ${card}`}
                >
                  <Search className="w-4 h-4" />
                  {tr("bible_search", "Search the Bible")}
                </button>

                <button
                  onClick={() => setView("favorites")}
                  className={`border rounded-xl px-4 py-3 text-orange-500 ${card}`}
                >
                  <Star className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 landscape:grid-cols-2 gap-2">
                {books.map((book, index) => (
                  <button
                    key={book.abbrev}
                    onClick={() => {
                      setBookIdx(index);
                      setChapterIdx(0);
                      setView("chapters");
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border ${card}`}
                  >
                    <span className="text-base font-medium">{bookName(book)}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {view === "chapters" && currentBook && (
          <>
            <Header title={bookName(currentBook)} onBack={() => setView("books")} />

            <div className="px-4 sm:px-5 pt-3 pb-6 max-w-[720px] mx-auto">
              <div className="grid grid-cols-5 sm:grid-cols-6 landscape:grid-cols-8 gap-2">
                {currentBook.chapters.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setChapterIdx(index);
                      setView("verses");
                    }}
                    className={`aspect-square rounded-xl border font-semibold ${card}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {view === "verses" && currentBook && (
          <>
            {/* Unified sticky top bar: title row + integrated audio row */}
            <div
              className={`sticky top-0 z-40 border-b ${
                isDay ? "bg-white border-zinc-200" : "bg-black border-zinc-800"
              }`}
            >
              {/* Minimal top row: back + book/chapter + menu */}
              <div className="flex items-center px-4 pt-1.5 pb-1.5 gap-2">
                <button
                  onClick={() => {
                    if (onExitToOrigin) {
                      setArrivedViaRef(false);
                      onExitToOrigin();
                    } else {
                      setView("chapters");
                    }
                  }}
                  className="text-orange-500 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-[17px] sm:text-[19px] font-semibold truncate flex-1 text-center">
                  {`${bookName(currentBook)} ${chapterIdx + 1}`}
                </h2>
                <button
                  onClick={() => setShowBibleMenu(true)}
                  className="text-orange-500 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2"
                  aria-label="Menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
              {arrivedViaRef && onExitToOrigin && (
                <div className="px-4 pb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setArrivedViaRef(false);
                      onExitToOrigin();
                    }}
                    className={`w-full min-h-[44px] rounded-lg border px-3 text-sm font-semibold flex items-center justify-center gap-2 ${
                      isDay
                        ? "bg-orange-50 border-orange-200 text-orange-700"
                        : "bg-orange-500/10 border-orange-500/30 text-orange-400"
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {previousReadingLabel}
                  </button>
                </div>
              )}
            </div>

            <div className="px-4 pt-3 pb-10 max-w-[680px] mx-auto">
              {/* Chapter drop-cap */}
              <div
                className={`${fontClass} font-normal`}
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.85,
                  wordSpacing: "0.02em",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                <span
                  aria-hidden
                  className="float-left mr-3 font-serif"
                  style={{
                    fontSize: `${fontSize * 3.8}px`,
                    lineHeight: 0.9,
                    color: "#B23A1A",
                    fontWeight: 700,
                    marginTop: "4px",
                  }}
                >
                  {chapterIdx + 1}
                </span>

                {currentVerses.map((text, index) => {
                  const verseNumber = index + 1;
                  const chapterNumber = chapterIdx + 1;
                  const isActive = verseIdx === index;
                  const hl = isHighlighted(currentBook.name, chapterNumber, verseNumber);
                  const noteKey = noteKeyFor(currentBook.name, chapterNumber, verseNumber);
                  const hasNote = !!notes[noteKey];
                  const isSelected = selectedVerses.has(index);
                  return (
                    <p
                      key={index}
                      ref={(el) => { verseRefsRef.current[index] = el as any; }}
                      onTouchStart={() => startLongPress(index)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      onTouchCancel={cancelLongPress}
                      onContextMenu={(e) => { e.preventDefault(); toggleSelectVerse(index); }}
                      onClick={() => {
                        if (longPressFiredRef.current) { longPressFiredRef.current = false; return; }
                        if (selectedVerses.size > 0) {
                          toggleSelectVerse(index);
                          return;
                        }
                        setVerseIdx(index);
                        updateMediaSession(bookIdx, chapterIdx, index);
                      }}
                      className={`cursor-pointer select-none transition-colors rounded-md px-1 -mx-1 ${
                        index === 0 ? "mb-4" : "my-4"
                      } ${
                        isSelected
                          ? (isDay ? "bg-orange-300/60 ring-2 ring-orange-500" : "bg-orange-500/30 ring-2 ring-orange-500")
                          : hl
                            ? (isDay ? "bg-orange-200/60" : "bg-orange-500/25")
                            : isActive
                              ? (isDay ? "bg-orange-100" : "bg-orange-500/15")
                              : ""
                      }`}
                    >
                      <sup
                        onClick={(e) => { e.stopPropagation(); toggleSelectVerse(index); }}
                        className="mr-1 align-super cursor-pointer"
                        style={{ fontSize: "12px", fontWeight: 700, color: "#F97316", lineHeight: 1 }}
                      >
                        {verseNumber}
                        {hasNote && <span className="ml-0.5 text-orange-500">•</span>}
                      </sup>
                      {text}
                    </p>
                  );
                })}
                <div className="clear-both" />
              </div>

              <div className="flex justify-between pt-2">
                <button
                  disabled={chapterIdx === 0}
                  onClick={() => setChapterIdx((current) => Math.max(0, current - 1))}
                  className={`px-4 py-2.5 rounded-xl border text-sm disabled:opacity-30 ${card}`}
                >
                  ← {tr("previous", "Previous")}
                </button>

                <button
                  disabled={chapterIdx >= currentBook.chapters.length - 1}
                  onClick={() => setChapterIdx((current) => Math.min(currentBook.chapters.length - 1, current + 1))}
                  className={`px-4 py-2.5 rounded-xl border text-sm disabled:opacity-30 ${card}`}
                >
                  {tr("next", "Next")} →
                </button>
              </div>
            </div>
          </>
        )}

        {view === "search" && (
          <>
            <Header title={tr("search", "Search")} onBack={() => setView("books")} />

            <div className="px-4 sm:px-5 pt-4 pb-8 max-w-[720px] mx-auto">
              <div className={`flex items-center gap-2 border rounded-xl px-4 py-3 mb-4 ${card}`}>
                <Search className="w-4 h-4 text-zinc-500" />

                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={tr(
                    "bible_search_placeholder",
                    language === "es"
                      ? "Libro, referencia o texto…"
                      : language === "pt"
                        ? "Livro, referência ou texto…"
                        : "Book, reference or text…",
                  )}
                  className="bg-transparent outline-none flex-1 text-base"
                />
              </div>

              <div className="space-y-2">
                {searchResults.map((result, index) => {
                  const open = () => {
                    setBookIdx(result.bIdx);
                    if (result.kind === "book") {
                      setChapterIdx(0);
                      setView("chapters");
                      return;
                    }
                    setChapterIdx(result.cIdx);
                    const v = result.kind === "verse" ? result.vIdx : result.vIdx ?? 0;
                    setVerseIdx(v ?? 0);
                    setView("verses");
                    setTimeout(() => {
                      verseRefsRef.current[v ?? 0]?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 150);
                  };

                  return (
                    <button
                      key={index}
                      onClick={open}
                      className={`w-full text-left rounded-xl border p-3.5 ${card}`}
                    >
                      {result.kind === "book" ? (
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{bookName(result.book)}</span>
                          <span className="text-xs text-zinc-500">
                            {result.book.chapters.length}{" "}
                            {language === "es" ? "capítulos" : language === "pt" ? "capítulos" : "chapters"}
                          </span>
                        </div>
                      ) : (
                        <>
                          <p className="text-orange-500 text-xs font-bold mb-1">
                            {bookName(result.book)} {result.cIdx + 1}
                            {result.vIdx != null ? `:${result.vIdx + 1}` : ""}
                          </p>
                          {result.text && <p className="text-sm leading-relaxed">{result.text}</p>}
                        </>
                      )}
                    </button>
                  );
                })}

                {query && searchResults.length === 0 && (
                  <p className="text-zinc-500 text-center text-sm pt-6">{tr("no_results", "No results")}</p>
                )}
              </div>
            </div>
          </>
        )}

        {view === "favorites" && (
          <>
            <Header title={tr("favorites", "Favorites")} onBack={() => setView("books")} />

            <div className="px-4 sm:px-5 pt-4 pb-8 max-w-[720px] mx-auto space-y-2">
              {favorites.length === 0 && (
                <div className="text-center pt-12">
                  <Star className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">{tr("bible_favorites_empty", "Tap the star on any verse to save it here.")}</p>
                </div>
              )}

              {favorites.map((favorite, index) => (
                <div key={index} className={`rounded-xl border p-4 ${card}`}>
                  <p className="text-orange-500 text-xs font-bold mb-1.5">
                    {favorite.book} {favorite.chapter}:{favorite.verse} · {favorite.translation.toUpperCase()}
                  </p>

                  <p className="text-[15px] leading-relaxed">{favorite.text}</p>

                  <div className="flex items-center justify-end gap-4 mt-3">
                    <button onClick={() => toggleFavorite(favorite)} className="text-orange-500">
                      <Star className="w-5 h-5" fill="currentColor" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

        {showLangPicker && (
        <div
          className="fixed inset-x-0 top-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-[70] bg-black/70 flex items-end"
          onClick={() => setShowLangPicker(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className={`w-full rounded-t-2xl p-4 max-h-full overflow-y-auto overscroll-contain ${
              isDay ? "bg-white text-zinc-950" : "bg-zinc-950 text-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-orange-500" />
              <h3 className="text-[18px] font-semibold">{tr("bible_translation", "Bible Translation")}</h3>
            </div>

            <div className="space-y-2">
              {TRANSLATIONS.map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    setTranslation(item.code);
                    setShowLangPicker(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border ${
                    translation === item.code
                      ? "border-orange-500 bg-orange-500/10"
                      : isDay
                        ? "border-zinc-200 bg-zinc-50"
                        : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <span className="text-base font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showReaderSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setShowReaderSettings(false)}>
          <div
            onClick={(event) => event.stopPropagation()}
            className={`w-full rounded-t-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] ${
              isDay ? "bg-white text-zinc-950" : "bg-zinc-950 text-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-orange-500" />
              <h3 className="text-[18px] font-semibold">{tr("bible_reading_settings", "Reading Settings")}</h3>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm mb-2">{tr("font", "Font")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["system", tr("font_default", "Default")],
                    ["serif", tr("font_serif", "Serif")],
                    ["mono", tr("font_mono", "Mono")],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setFontFamily(value)}
                      className={`rounded-xl border px-3 py-2 ${
                        fontFamily === value ? "border-orange-500 bg-orange-500/10" : "border-zinc-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm mb-2">{tr("font_size", "Font size")}: {fontSize}px</p>
                <input
                  type="range"
                  min="14"
                  max="28"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <p className="text-sm mb-2">{tr("line_spacing", "Line spacing")}: {lineHeight}</p>
                <input
                  type="range"
                  min="1.2"
                  max="2.4"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <button
                onClick={playChapter}
                className="w-full rounded-xl bg-orange-500 text-white font-semibold py-3 flex items-center justify-center gap-2"
              >
                {isSpeaking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isSpeaking ? tr("stop_audio", "Stop Audio") : tr("play_chapter", "Play Current Chapter")}
              </button>

              <div>
                <p className="text-sm mb-2">{tr("audio_speed", "Speed")}: {audioRate}x</p>
                <div className="grid grid-cols-5 gap-2">
                  {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                    <button
                      key={r}
                      onClick={() => setAudioRate(r)}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        audioRate === r ? "border-orange-500 bg-orange-500/10" : "border-zinc-700"
                      }`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBibleMenu && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setShowBibleMenu(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+20px)] ${
              isDay ? "bg-white text-zinc-950" : "bg-zinc-950 text-white"
            }`}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-500/40" />
            <div className="grid grid-cols-1 gap-1">
              {[
                {
                  icon: <Search className="w-5 h-5" />,
                  label: tr("bible_search", "Search the Bible"),
                  onClick: () => { setShowBibleMenu(false); setView("search"); },
                },
                {
                  icon: <Headphones className="w-5 h-5" />,
                  label: tr("bible_audio", "Audio Bible"),
                  onClick: () => { setShowBibleMenu(false); setShowReaderSettings(true); },
                },
                {
                  icon: <Globe className="w-5 h-5" />,
                  label: `${tr("bible_translation", "Bible Translation")} · ${translation.toUpperCase()}`,
                  onClick: () => { setShowBibleMenu(false); setShowLangPicker(true); },
                },
                {
                  icon: <Type className="w-5 h-5" />,
                  label: tr("font_size", "Font size"),
                  onClick: () => { setShowBibleMenu(false); setShowReaderSettings(true); },
                },
                {
                  icon: isDay ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />,
                  label: isDay ? tr("dark_mode", "Dark Mode") : tr("light_mode", "Light Mode"),
                  onClick: () => { setMode(isDay ? "night" : "day"); setShowBibleMenu(false); },
                },
                {
                  icon: <BookMarked className="w-5 h-5" />,
                  label: tr("bible_go_to", "Go to book / chapter"),
                  onClick: () => { setShowBibleMenu(false); setView("books"); },
                },
                {
                  icon: <Star className="w-5 h-5" />,
                  label: tr("favorites", "Favorites"),
                  onClick: () => { setShowBibleMenu(false); setView("favorites"); },
                },
                {
                  icon: <Type className="w-5 h-5" />,
                  label: tr("bible_reading_settings", "Reading Settings"),
                  onClick: () => { setShowBibleMenu(false); setShowReaderSettings(true); },
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left min-h-[48px] ${
                    isDay ? "hover:bg-zinc-100" : "hover:bg-zinc-900"
                  }`}
                >
                  <span className="text-orange-500">{item.icon}</span>
                  <span className="text-[15px] font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {openNoteKey && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center p-4 overflow-y-auto"
          style={{ paddingTop: `calc(env(safe-area-inset-top) + 24px)` }}
          onClick={() => setOpenNoteKey(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl p-4 flex flex-col gap-3 ${
              isDay ? "bg-white text-zinc-950" : "bg-zinc-950 text-white"
            }`}
            style={{ maxHeight: "70vh" }}
          >
            <div className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-orange-500" />
              <h3 className="text-[18px] font-semibold">{tr("bible_note", "Note")}</h3>
            </div>

            <textarea
              autoFocus
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder={tr("bible_note_placeholder", "Write your personal note for this verse…")}
              rows={4}
              className={`w-full flex-1 min-h-[120px] rounded-xl border p-3 bg-transparent outline-none resize-none text-[15px] ${
                isDay ? "border-zinc-200" : "border-zinc-800"
              }`}
            />

            <div className="flex items-center gap-2">
              <button
                onClick={deleteCurrentNote}
                className={`px-4 py-2.5 rounded-xl border text-sm flex items-center gap-2 ${
                  isDay ? "border-zinc-200" : "border-zinc-800"
                } text-zinc-500`}
              >
                <Trash2 className="w-4 h-4" />
                {tr("delete", "Delete")}
              </button>

              <button
                onClick={saveCurrentNote}
                className="flex-1 rounded-xl bg-orange-500 text-white font-semibold py-3 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {tr("save", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}


      {selectedVerses.size > 0 && currentBook && (
        <div
          className="fixed inset-x-0 z-50 pointer-events-none"
          style={{ bottom: `calc(env(safe-area-inset-bottom) + 88px)` }}
        >
          <div className="pointer-events-auto mx-auto max-w-[720px] px-3">
            <div
              className={`rounded-2xl shadow-2xl border ${
                isDay ? "bg-white border-zinc-200 text-zinc-900" : "bg-zinc-950 border-zinc-800 text-white"
              }`}
            >
              <div className="flex items-center justify-between px-4 pt-3">
                <p className="text-sm font-semibold">
                  {selectedVerses.size}{" "}
                  {selectedVerses.size === 1
                    ? tr("bible_verse_selected_one", "verse selected")
                    : tr("bible_verse_selected_many", "verses selected")}
                </p>
                <button
                  onClick={clearSelection}
                  className="text-orange-500 min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-end"
                  aria-label="Clear selection"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-1 px-2 pb-3">
                {(() => {
                  const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
                  const chapterN = chapterIdx + 1;
                  const bookLabel = bookName(currentBook);
                  const collectRef = () => {
                    // Build compact reference like "Book 3:1,3-5"
                    const parts: string[] = [];
                    let i = 0;
                    while (i < sorted.length) {
                      let j = i;
                      while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
                      parts.push(i === j ? `${sorted[i] + 1}` : `${sorted[i] + 1}-${sorted[j] + 1}`);
                      i = j + 1;
                    }
                    return `${bookLabel} ${chapterN}:${parts.join(",")}`;
                  };
                  const collectText = () =>
                    sorted
                      .map((idx) => `${idx + 1} ${currentVerses[idx]}`)
                      .join(" ");
                  const applyAll = (fn: (idx: number) => void) => {
                    sorted.forEach(fn);
                  };
                  const isSingle = sorted.length === 1;
                  const singleIdx = sorted[0];
                  return [
                    {
                      icon: <Copy className="w-5 h-5" />,
                      label: tr("copy", "Copy"),
                      onClick: () => { copyVerse(collectText(), collectRef()); clearSelection(); },
                    },
                    {
                      icon: <Highlighter className="w-5 h-5" />,
                      label: tr("bible_highlight", "Highlight"),
                      onClick: () => {
                        applyAll((idx) => toggleHighlight(currentBook.name, chapterN, idx + 1));
                        clearSelection();
                      },
                    },
                    {
                      icon: <Star className="w-5 h-5" />,
                      label: tr("favorite", "Favorite"),
                      onClick: () => {
                        applyAll((idx) =>
                          toggleFavorite({
                            translation,
                            book: currentBook.name,
                            chapter: chapterN,
                            verse: idx + 1,
                            text: currentVerses[idx],
                          }),
                        );
                        clearSelection();
                      },
                    },
                    {
                      icon: <Share2 className="w-5 h-5" />,
                      label: tr("share", "Share"),
                      onClick: () => { shareVerseImage(collectText(), collectRef()); clearSelection(); },
                    },
                    {
                      icon: <StickyNote className="w-5 h-5" />,
                      label: tr("bible_add_note", "Note"),
                      onClick: () => {
                        if (!isSingle) return;
                        openNoteFor(currentBook.name, chapterN, singleIdx + 1);
                        clearSelection();
                      },
                      disabled: !isSingle,
                    },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={item.onClick}
                      disabled={(item as any).disabled}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl min-h-[56px] ${
                        (item as any).disabled ? "opacity-30" : isDay ? "hover:bg-zinc-100" : "hover:bg-zinc-900"
                      }`}
                    >
                      <span className="text-orange-500">{item.icon}</span>
                      <span className="text-[11px] font-medium">{item.label}</span>
                    </button>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {actionVerse !== null && currentBook && currentVerses[actionVerse] !== undefined && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setActionVerse(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+20px)] ${
              isDay ? "bg-white text-zinc-950" : "bg-zinc-950 text-white"
            }`}
          >
            <p className="text-orange-500 text-xs font-bold uppercase tracking-wider mb-1">
              {bookName(currentBook)} {chapterIdx + 1}:{actionVerse + 1}
            </p>
            <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{currentVerses[actionVerse]}</p>
            <div className="grid grid-cols-1 gap-1">
              {[
                {
                  icon: <Play className="w-5 h-5" />,
                  label: tr("bible_start_audio_here", "Start Audio Here"),
                  onClick: () => { const i = actionVerse!; setActionVerse(null); playFromVerse(i); },
                },
                {
                  icon: <Copy className="w-5 h-5" />,
                  label: tr("copy", "Copy"),
                  onClick: () => { copyVerse(currentVerses[actionVerse!], `${bookName(currentBook)} ${chapterIdx + 1}:${actionVerse! + 1}`); setActionVerse(null); },
                },
                {
                  icon: <Star className="w-5 h-5" fill={isFav(currentBook.name, chapterIdx + 1, actionVerse + 1) ? "currentColor" : "none"} />,
                  label: tr("favorite", "Favorite"),
                  onClick: () => {
                    toggleFavorite({
                      translation,
                      book: currentBook.name,
                      chapter: chapterIdx + 1,
                      verse: actionVerse! + 1,
                      text: currentVerses[actionVerse!],
                    });
                    setActionVerse(null);
                  },
                },
                {
                  icon: <Share2 className="w-5 h-5" />,
                  label: tr("share", "Share"),
                  onClick: () => { shareVerseImage(currentVerses[actionVerse!], `${bookName(currentBook)} ${chapterIdx + 1}:${actionVerse! + 1}`); setActionVerse(null); },
                },
                {
                  icon: <StickyNote className="w-5 h-5" />,
                  label: tr("bible_add_note", "Add Note"),
                  onClick: () => { openNoteFor(currentBook.name, chapterIdx + 1, actionVerse! + 1); setActionVerse(null); },
                },
                {
                  icon: <Highlighter className="w-5 h-5" />,
                  label: isHighlighted(currentBook.name, chapterIdx + 1, actionVerse + 1)
                    ? tr("bible_remove_highlight", "Remove Highlight")
                    : tr("bible_highlight", "Highlight"),
                  onClick: () => { toggleHighlight(currentBook.name, chapterIdx + 1, actionVerse! + 1); setActionVerse(null); },
                },
                {
                  icon: <Link2 className="w-5 h-5" />,
                  label: tr("bible_copy_reference", "Copy Reference"),
                  onClick: () => { copyReference(`${bookName(currentBook)} ${chapterIdx + 1}:${actionVerse! + 1}`); setActionVerse(null); },
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-left min-h-[48px] ${
                    isDay ? "hover:bg-zinc-100" : "hover:bg-zinc-900"
                  }`}
                >
                  <span className="text-orange-500">{item.icon}</span>
                  <span className="text-[15px] font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
