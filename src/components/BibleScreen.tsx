import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, Star, ChevronRight, BookOpen, Globe, Sun, Moon, Play, Pause, Type, StickyNote, Save, Trash2 } from "lucide-react";

type Book = { name: string; abbrev: string; chapters: string[][] };
type Translation = { code: string; label: string; loader: () => Promise<Book[]> };

const TRANSLATIONS: Translation[] = [
  {
    code: "kjv",
    label: "English — KJV",
    loader: () => import("@/data/bible/kjv.json").then((m) => m.default as Book[]),
  },
  {
    code: "rvr",
    label: "Español — Reina-Valera",
    loader: () => import("@/data/bible/rvr.json").then((m) => m.default as Book[]),
  },
  {
    code: "aa",
    label: "Português — Almeida",
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

  const [translation, setTranslation] = useState(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && TRANSLATIONS.some((x) => x.code === stored)) return stored;
    return (language && APP_LANG_TO_BIBLE[language]) || "kjv";
  });

  useEffect(() => {
    if (!language) return;
    const mapped = APP_LANG_TO_BIBLE[language];
    if (mapped && mapped !== translation) {
      setTranslation(mapped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

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
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showReaderSettings, setShowReaderSettings] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem(FONT_SIZE_KEY) || 17));
  const [lineHeight, setLineHeight] = useState(() => Number(localStorage.getItem(LINE_HEIGHT_KEY) || 1.7));
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem(FONT_KEY) || "system");

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
  }, [mode, bookIdx, chapterIdx, view, fontSize, lineHeight, fontFamily]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const currentBook = books?.[bookIdx];
  const currentVerses = currentBook?.chapters?.[chapterIdx] || [];

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

  const playChapter = () => {
    if (!currentBook || !currentVerses.length) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const fullText = `${currentBook.name} chapter ${chapterIdx + 1}. ${currentVerses
      .map((v, i) => `Verse ${i + 1}. ${v}`)
      .join(" ")}`;

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = translation === "rvr" ? "es-ES" : "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
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
            <button onClick={playChapter} className="text-orange-500">
              {isSpeaking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
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
        <div className="text-orange-500">Loading Bible…</div>
      </div>
    );
  }

  return (
    <div className={`${pageBg} min-h-[100dvh] overflow-hidden`}>
      <div className="h-[100dvh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+96px)]">
        {view === "books" && (
          <>
            <Header title="Holy Bible" />

            <div className="px-4 sm:px-5 pt-4 pb-8 max-w-[720px] mx-auto">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setView("search")}
                  className={`flex-1 flex items-center gap-2 border rounded-xl px-4 py-3 text-sm ${card}`}
                >
                  <Search className="w-4 h-4" />
                  Search the Bible
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
                    <span className="text-base font-medium">{book.name}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {view === "chapters" && currentBook && (
          <>
            <Header title={currentBook.name} onBack={() => setView("books")} />

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
            <Header title={`${currentBook.name} ${chapterIdx + 1}`} onBack={() => setView("chapters")} />

            <div className="px-4 sm:px-5 pt-4 pb-10 max-w-[760px] mx-auto space-y-3">
              {currentVerses.map((text, index) => {
                const verseNumber = index + 1;
                const chapterNumber = chapterIdx + 1;
                const fav = isFav(currentBook.name, chapterNumber, verseNumber);

                return (
                  <div key={index} className={`rounded-xl border p-4 ${card}`}>
                    <p className={`${fontClass}`} style={{ fontSize: `${fontSize}px`, lineHeight }}>
                      <span className="text-orange-500 font-bold mr-2">{verseNumber}</span>
                      {text}
                    </p>

                    <div className="flex items-center justify-end gap-4 mt-3">
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
                        className={fav ? "text-orange-500" : "text-zinc-500"}
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
                  ← Previous
                </button>

                <button
                  disabled={chapterIdx >= currentBook.chapters.length - 1}
                  onClick={() => setChapterIdx((current) => Math.min(currentBook.chapters.length - 1, current + 1))}
                  className={`px-4 py-2.5 rounded-xl border text-sm disabled:opacity-30 ${card}`}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}

        {view === "search" && (
          <>
            <Header title="Search" onBack={() => setView("books")} />

            <div className="px-4 sm:px-5 pt-4 pb-8 max-w-[720px] mx-auto">
              <div className={`flex items-center gap-2 border rounded-xl px-4 py-3 mb-4 ${card}`}>
                <Search className="w-4 h-4 text-zinc-500" />

                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search verses…"
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
                      {result.book.name} {result.cIdx + 1}:{result.vIdx + 1}
                    </p>

                    <p className="text-sm leading-relaxed">{result.text}</p>
                  </button>
                ))}

                {query && searchResults.length === 0 && (
                  <p className="text-zinc-500 text-center text-sm pt-6">No results</p>
                )}
              </div>
            </div>
          </>
        )}

        {view === "favorites" && (
          <>
            <Header title="Favorites" onBack={() => setView("books")} />

            <div className="px-4 sm:px-5 pt-4 pb-8 max-w-[720px] mx-auto space-y-2">
              {favorites.length === 0 && (
                <div className="text-center pt-12">
                  <Star className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">Tap the star on any verse to save it here.</p>
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
              <h3 className="text-[18px] font-semibold">Bible Translation</h3>
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
              <h3 className="text-[18px] font-semibold">Reading Settings</h3>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm mb-2">Font</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["system", "Default"],
                    ["serif", "Serif"],
                    ["mono", "Mono"],
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
                <p className="text-sm mb-2">Font size: {fontSize}px</p>
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
                <p className="text-sm mb-2">Line spacing: {lineHeight}</p>
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
                {isSpeaking ? "Stop Audio" : "Play Current Chapter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
