import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Search, Star, ChevronRight, ChevronDown, BookOpen, Globe, Sun, Moon, Play, Pause, Type, StickyNote, Save, Trash2, Rewind, FastForward, Mic, Copy, Share2, X, Check, SkipBack, SkipForward } from "lucide-react";
import { getLocalizedBookName } from "@/data/bible/book-names";

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
    label: "Español | Reina-Valera",
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
const LANG_KEY = "pf_bible_lang";
const MODE_KEY = "pf_bible_mode";
const BOOK_KEY = "pf_bible_book";
const CHAPTER_KEY = "pf_bible_chapter";
const VIEW_KEY = "pf_bible_view";
const FONT_SIZE_KEY = "pf_bible_font_size";
const LINE_HEIGHT_KEY = "pf_bible_line_height";
const FONT_KEY = "pf_bible_font";
const VERSE_KEY = "pf_bible_verse";
const RATE_KEY = "pf_bible_audio_rate";
const VOICE_GENDER_KEY = "pf_bible_voice_gender";

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

function pickVoice(lang: string, gender: "female" | "male"): SpeechSynthesisVoice | null {
  const synth = window.speechSynthesis;
  if (!synth) return null;
  const all = synth.getVoices();
  if (!all.length) return null;
  const langPrefix = lang.split("-")[0];
  const matches = all.filter((v) => v.lang?.toLowerCase().startsWith(langPrefix));
  const pool = matches.length ? matches : all;

  const primary = gender === "female" ? FEMALE_NAME_HINTS : MALE_NAME_HINTS;
  const secondary = gender === "female" ? MALE_NAME_HINTS : FEMALE_NAME_HINTS;

  const preferred = pool.find((v) => voiceGenderScore(v.name, primary));
  if (preferred) return preferred;
  // Avoid clearly opposite-gender voices; otherwise just take first match.
  const neutral = pool.find((v) => !voiceGenderScore(v.name, secondary));
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

const APP_LANG_TO_BIBLE: Record<string, string> = { en: "kjv", es: "rvr", pt: "aa" };

interface BibleScreenProps {
  t?: (key: any) => string;
  language?: string;
}

export function BibleScreen({ t, language }: BibleScreenProps = {}) {
  const tr = (k: string, fallback: string) => {
    if (!t) return fallback;
    const v = t(k as any);
    return v && v !== k ? v : fallback;
  };

  const bookName = (book: Book) => getLocalizedBookName(book.abbrev, book.name, language);

  const [translation, setTranslation] = useState(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && TRANSLATIONS.some((x) => x.code === stored)) return stored;
    return (language && APP_LANG_TO_BIBLE[language]) || "kjv";
  });

  const [mode, setMode] = useState<"day" | "night">(
    () => (localStorage.getItem(MODE_KEY) as "day" | "night") || "night",
  );

  const [books, setBooks] = useState<Book[] | null>(null);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<"books" | "chapters" | "verses" | "search" | "favorites">(
    () => (localStorage.getItem(VIEW_KEY) as any) || "books",
  );

  const [bookIdx, setBookIdx] = useState(() => Number(localStorage.getItem(BOOK_KEY) || 0));
  const [chapterIdx, setChapterIdx] = useState(() => Number(localStorage.getItem(CHAPTER_KEY) || 0));
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Favorite[]>(loadFavorites);
  const [notes, setNotes] = useState<Record<string, string>>(loadNotes);
  const [openNoteKey, setOpenNoteKey] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showReaderSettings, setShowReaderSettings] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem(FONT_SIZE_KEY) || 17));
  const [lineHeight, setLineHeight] = useState(() => Number(localStorage.getItem(LINE_HEIGHT_KEY) || 1.7));
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem(FONT_KEY) || "system");

  const [verseIdx, setVerseIdx] = useState(() => Number(localStorage.getItem(VERSE_KEY) || 0));
  const [audioRate, setAudioRate] = useState<number>(() => Number(localStorage.getItem(RATE_KEY) || 1));
  const [voiceGender, setVoiceGender] = useState<"female" | "male">(
    () => (localStorage.getItem(VOICE_GENDER_KEY) as "female" | "male") || "female",
  );
  const speakingRef = React.useRef(false);
  const verseRefsRef = useRef<Record<number, HTMLDivElement | null>>({});
  const longPressTimerRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);
  const [actionVerse, setActionVerse] = useState<number | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
    localStorage.setItem(MODE_KEY, mode);
    localStorage.setItem(BOOK_KEY, String(bookIdx));
    localStorage.setItem(CHAPTER_KEY, String(chapterIdx));
    localStorage.setItem(VIEW_KEY, view);
    localStorage.setItem(FONT_SIZE_KEY, String(fontSize));
    localStorage.setItem(LINE_HEIGHT_KEY, String(lineHeight));
    localStorage.setItem(FONT_KEY, fontFamily);
    localStorage.setItem(VERSE_KEY, String(verseIdx));
    localStorage.setItem(RATE_KEY, String(audioRate));
    localStorage.setItem(VOICE_GENDER_KEY, voiceGender);
  }, [mode, bookIdx, chapterIdx, view, fontSize, lineHeight, fontFamily, verseIdx, audioRate, voiceGender]);

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

  const speechLang =
    translation === "rvr" ? "es-ES" : translation === "aa" ? "pt-BR" : "en-US";

  const searchResults = useMemo(() => {
    if (!query.trim() || !books) return [];

    const q = query.toLowerCase();
    const results: { book: Book; bIdx: number; cIdx: number; vIdx: number; text: string }[] = [];

    for (let b = 0; b < books.length && results.length < 80; b++) {
      const book = books[b];

      for (let c = 0; c < book.chapters.length && results.length < 80; c++) {
        const chapter = book.chapters[c];

        for (let v = 0; v < chapter.length && results.length < 80; v++) {
          const verseText = chapter[v];

          if (verseText.toLowerCase().includes(q)) {
            results.push({ book, bIdx: b, cIdx: c, vIdx: v, text: verseText });
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
    const voice = pickVoice(speechLang, voiceGender);
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

  // If voice gender or rate changes while playing, restart current verse with new settings.
  useEffect(() => {
    if (!isSpeaking) return;
    speakingRef.current = false;
    window.speechSynthesis.cancel();
    setTimeout(() => speakVerseAt(bookIdx, chapterIdx, verseIdx), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioRate, voiceGender]);

  // Wire up Media Session lock-screen / hardware controls when supported.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("play", () => resumeAudio());
      navigator.mediaSession.setActionHandler("pause", () => pauseAudio());
      navigator.mediaSession.setActionHandler("seekbackward", () => skipVerses(-2));
      navigator.mediaSession.setActionHandler("seekforward", () => skipVerses(2));
      navigator.mediaSession.setActionHandler("previoustrack", () => skipVerses(-2));
      navigator.mediaSession.setActionHandler("nexttrack", () => skipVerses(2));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books, bookIdx, chapterIdx, verseIdx, isSpeaking, audioRate, voiceGender]);

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
      setActionVerse(idx);
      if (navigator.vibrate) try { navigator.vibrate(15); } catch {}
    }, 450);
  };
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
      className={`sticky top-0 z-20 backdrop-blur-md border-b pt-[env(safe-area-inset-top)] ${
        isDay ? "bg-white/95 border-zinc-200" : "bg-black/90 border-zinc-800"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 gap-3">
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
              <button onClick={playChapter} aria-label={isSpeaking ? "Pause" : "Play"} className="text-orange-500 min-w-[44px] min-h-[44px] flex items-center justify-center -m-2">
                {isSpeaking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
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
        </div>
      </div>
    </div>
  );

  if (loading || !books) {
    return (
      <div className={`${pageBg} min-h-[100dvh] flex items-center justify-center`}>
        <div className="text-orange-500">{tr("bible_loading", "Loading Bible…")}</div>
      </div>
    );
  }

  return (
    <div className={`${pageBg} min-h-[100dvh] overflow-hidden`}>
      <div className="h-[100dvh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+170px)]">
        {view === "books" && (
          <>
            <Header title={tr("holy_bible", "Holy Bible")} />

            <div className="px-4 sm:px-5 pt-4 pb-8 max-w-[720px] mx-auto">
              <div className="flex gap-2 mb-4">
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

            <div className="px-4 sm:px-5 pt-4 pb-8 max-w-[720px] mx-auto">
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
            <Header title={`${bookName(currentBook).toUpperCase()} ${chapterIdx + 1}`} onBack={() => setView("chapters")} />

            {showResumeBanner && (
              <div className="px-4 sm:px-5 pt-3 max-w-[760px] mx-auto">
                <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${card}`}>
                  <div className="flex-1 text-sm">
                    {tr("bible_resume_from", "Resume from verse")} {verseIdx + 1}?
                  </div>
                  <button
                    onClick={() => setShowResumeBanner(false)}
                    className="text-zinc-500 min-w-[44px] min-h-[44px] flex items-center justify-center -m-2"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => playFromVerse(verseIdx)}
                    className="rounded-lg bg-orange-500 text-white text-sm font-semibold px-3 py-2 min-h-[44px]"
                  >
                    {tr("resume", "Resume")}
                  </button>
                </div>
              </div>
            )}

            <div className="px-4 sm:px-5 pt-4 pb-10 max-w-[760px] mx-auto space-y-3">
              {currentVerses.map((text, index) => {
                const verseNumber = index + 1;
                const chapterNumber = chapterIdx + 1;
                const fav = isFav(currentBook.name, chapterNumber, verseNumber);
                const noteKey = noteKeyFor(currentBook.name, chapterNumber, verseNumber);
                const hasNote = !!notes[noteKey];
                const isActive = isSpeaking && verseIdx === index;
                const refLabel = `${bookName(currentBook)} ${chapterNumber}:${verseNumber}`;

                return (
                  <div
                    key={index}
                    ref={(el) => { verseRefsRef.current[index] = el; }}
                    onTouchStart={() => startLongPress(index)}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    onTouchCancel={cancelLongPress}
                    onContextMenu={(e) => { e.preventDefault(); setActionVerse(index); }}
                    onClick={() => {
                      if (longPressFiredRef.current) { longPressFiredRef.current = false; return; }
                      playFromVerse(index);
                    }}
                    className={`rounded-xl border p-4 transition-colors cursor-pointer select-none ${
                      isActive
                        ? "border-orange-500 bg-orange-500/15 ring-1 ring-orange-500"
                        : card
                    }`}
                  >
                    <p className={`${fontClass}`} style={{ fontSize: `${fontSize}px`, lineHeight }}>
                      <span className="text-orange-500 font-bold mr-2">{verseNumber}</span>
                      {text}
                    </p>

                    {hasNote && (
                      <p
                        className={`mt-3 text-[13px] italic px-3 py-2 rounded-lg border-l-2 border-orange-500 ${
                          isDay ? "bg-orange-50 text-zinc-700" : "bg-orange-500/10 text-zinc-300"
                        }`}
                      >
                        {notes[noteKey]}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => copyVerse(text, refLabel)}
                        className={`${copiedKey === refLabel ? "text-orange-500" : "text-zinc-500"} min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg`}
                        aria-label={tr("copy", "Copy")}
                      >
                        {copiedKey === refLabel ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => shareVerseImage(text, refLabel)}
                        className="text-zinc-500 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
                        aria-label={tr("share", "Share")}
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openNoteFor(currentBook.name, chapterNumber, verseNumber)}
                        className={`${hasNote ? "text-orange-500" : "text-zinc-500"} min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg`}
                        aria-label={tr("bible_note", "Note")}
                      >
                        <StickyNote className="w-5 h-5" fill={hasNote ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={() =>
                          toggleFavorite({
                            translation,
                            book: currentBook.name,
                            chapter: chapterNumber,
                            verse: verseNumber,
                            text,
                          })
                        }
                        className={`${fav ? "text-orange-500" : "text-zinc-500"} min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg`}
                        aria-label={tr("favorite", "Favorite")}
                      >
                        <Star className="w-5 h-5" fill={fav ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                );
              })}

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
                  placeholder={tr("bible_search_verses", "Search verses…")}
                  className="bg-transparent outline-none flex-1 text-base"
                />
              </div>

              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setBookIdx(result.bIdx);
                      setChapterIdx(result.cIdx);
                      setView("verses");
                    }}
                    className={`w-full text-left rounded-xl border p-3.5 ${card}`}
                  >
                    <p className="text-orange-500 text-xs font-bold mb-1">
                      {bookName(result.book)} {result.cIdx + 1}:{result.vIdx + 1}
                    </p>

                    <p className="text-sm leading-relaxed">{result.text}</p>
                  </button>
                ))}

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
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setShowLangPicker(false)}>
          <div
            onClick={(event) => event.stopPropagation()}
            className={`w-full rounded-t-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] ${
              isDay ? "bg-white text-zinc-950" : "bg-zinc-950 text-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
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
                  className={`w-full text-left px-4 py-3.5 rounded-xl border ${
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
                <p className="text-sm mb-2 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-orange-500" />
                  {tr("voice", "Voice")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["female", "male"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setVoiceGender(g)}
                      className={`rounded-xl border px-3 py-2 capitalize ${
                        voiceGender === g ? "border-orange-500 bg-orange-500/10" : "border-zinc-700"
                      }`}
                    >
                      {g === "female" ? tr("voice_female", "Female") : tr("voice_male", "Male")}
                    </button>
                  ))}
                </div>
              </div>

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

      {openNoteKey && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setOpenNoteKey(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full rounded-t-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] ${
              isDay ? "bg-white text-zinc-950" : "bg-zinc-950 text-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <StickyNote className="w-5 h-5 text-orange-500" />
              <h3 className="text-[18px] font-semibold">{tr("bible_note", "Note")}</h3>
            </div>

            <textarea
              autoFocus
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder={tr("bible_note_placeholder", "Write your personal note for this verse…")}
              rows={6}
              className={`w-full rounded-xl border p-3 bg-transparent outline-none resize-none text-[15px] ${
                isDay ? "border-zinc-200" : "border-zinc-800"
              }`}
            />

            <div className="flex items-center gap-2 mt-4">
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

      {currentBook && (
        <div
          className="fixed left-0 right-0 z-40 px-3"
          style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}
        >
          <div className={`max-w-[720px] mx-auto rounded-2xl border shadow-lg backdrop-blur-md ${
            isDay ? "bg-white/95 border-zinc-200 text-zinc-950" : "bg-zinc-950/95 border-zinc-800 text-white"
          }`}>
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-orange-500 font-bold truncate uppercase tracking-wider">
                  {bookName(currentBook)} {chapterIdx + 1}:{verseIdx + 1}
                </p>
                <p className="text-[11px] text-zinc-500 truncate">
                  {translation.toUpperCase()} · {voiceGender === "female" ? tr("voice_female", "Female") : tr("voice_male", "Male")} · {audioRate}x
                </p>
              </div>
              <button onClick={() => skipVerses(-2)} aria-label="Rewind" className="text-orange-500 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Rewind className="w-5 h-5" />
              </button>
              <button
                onClick={() => (isSpeaking ? pauseAudio() : resumeAudio())}
                aria-label={isSpeaking ? "Pause" : "Play"}
                className="rounded-full bg-orange-500 text-white w-11 h-11 flex items-center justify-center"
              >
                {isSpeaking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button onClick={() => skipVerses(2)} aria-label="Forward" className="text-orange-500 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <FastForward className="w-5 h-5" />
              </button>
            </div>
            <div className="px-3 pb-2">
              <input
                type="range"
                min={0}
                max={Math.max(0, currentVerses.length - 1)}
                value={Math.min(verseIdx, Math.max(0, currentVerses.length - 1))}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (isSpeaking) {
                    speakingRef.current = false;
                    window.speechSynthesis.cancel();
                    setTimeout(() => speakVerseAt(bookIdx, chapterIdx, v), 60);
                  } else {
                    setVerseIdx(v);
                    updateMediaSession(bookIdx, chapterIdx, v);
                  }
                }}
                className="w-full accent-orange-500"
                aria-label="Seek"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 -mt-1">
                <span>{tr("verse", "Verse")} {verseIdx + 1}</span>
                <span>/ {currentVerses.length}</span>
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
