import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, Star, Share2, ChevronRight, BookOpen, Globe, Sun, Moon } from "lucide-react";

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
];

const FAV_KEY = "pf_bible_favorites";
const LANG_KEY = "pf_bible_lang";
const MODE_KEY = "pf_bible_mode";
const BOOK_KEY = "pf_bible_book";
const CHAPTER_KEY = "pf_bible_chapter";
const VIEW_KEY = "pf_bible_view";

type Favorite = { translation: string; book: string; chapter: number; verse: number; text: string };

function loadFavorites(): Favorite[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveFavorites(f: Favorite[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify(f));
}

export function BibleScreen() {
  const [translation, setTranslation] = useState(() => localStorage.getItem(LANG_KEY) || "kjv");
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

  const isDay = mode === "day";

  useEffect(() => {
    setLoading(true);
    const t = TRANSLATIONS.find((x) => x.code === translation) || TRANSLATIONS[0];
    t.loader().then((b) => {
      setBooks(b);
      setBookIdx((prev) => Math.min(prev, b.length - 1));
      setLoading(false);
    });
    localStorage.setItem(LANG_KEY, translation);
  }, [translation]);

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
    localStorage.setItem(BOOK_KEY, String(bookIdx));
    localStorage.setItem(CHAPTER_KEY, String(chapterIdx));
    localStorage.setItem(VIEW_KEY, view);
  }, [mode, bookIdx, chapterIdx, view]);

  const currentBook = books?.[bookIdx];
  const currentVerses = currentBook?.chapters?.[chapterIdx] || [];

  const searchResults = useMemo(() => {
    if (!query.trim() || !books) return [] as { book: Book; bIdx: number; cIdx: number; vIdx: number; text: string }[];
    const q = query.toLowerCase();
    const out: { book: Book; bIdx: number; cIdx: number; vIdx: number; text: string }[] = [];
    for (let b = 0; b < books.length && out.length < 80; b++) {
      const bk = books[b];
      for (let c = 0; c < bk.chapters.length && out.length < 80; c++) {
        const ch = bk.chapters[c];
        for (let v = 0; v < ch.length && out.length < 80; v++) {
          if (ch[v].toLowerCase().includes(q)) out.push({ book: bk, bIdx: b, cIdx: c, vIdx: v, text: ch[v] });
        }
      }
    }
    return out;
  }, [query, books]);

  const toggleFavorite = (v: Favorite) => {
    const exists = favorites.find(
      (f) => f.translation === v.translation && f.book === v.book && f.chapter === v.chapter && f.verse === v.verse,
    );
    const next = exists ? favorites.filter((f) => f !== exists) : [v, ...favorites];
    setFavorites(next);
    saveFavorites(next);
  };

  const isFav = (book: string, chapter: number, verse: number) =>
    favorites.some(
      (f) => f.translation === translation && f.book === book && f.chapter === chapter && f.verse === verse,
    );

  const shareVerse = async (text: string, ref: string) => {
    const payload = `"${text}" — ${ref}`;
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ text: payload });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(payload);
    } catch {}
  };

  const Header = ({ title, onBack }: { title: string; onBack?: () => void }) => (
    <div
      className={`sticky top-0 z-10 backdrop-blur-md border-b ${isDay ? "bg-white/95 border-zinc-200" : "bg-black/90 border-zinc-800"}`}
    >
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button onClick={onBack} className="text-orange-500 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className={`${isDay ? "text-zinc-950" : "text-white"} text-[20px] font-semibold truncate`}>{title}</h2>
        </div>

        <div className="flex items-center gap-3">
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

  const card = isDay ? "bg-white border-zinc-200 text-zinc-950" : "bg-zinc-950 border-zinc-900 text-white";
  const pageBg = isDay ? "bg-[#f8f5ef] text-zinc-950" : "bg-black text-white";

  if (loading || !books) {
    return (
      <div className={`${pageBg} min-h-screen flex items-center justify-center`}>
        <div className="text-orange-500">Loading Bible…</div>
      </div>
    );
  }

  return (
    <div className={`${pageBg} min-h-screen`}>
      {view === "books" && (
        <>
          <Header title="Holy Bible" />
          <div className="px-5 pt-4 pb-6 max-w-[430px] mx-auto">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setView("search")}
                className={`flex-1 flex items-center gap-2 ${card} border rounded-xl px-4 py-3 text-sm`}
              >
                <Search className="w-4 h-4" /> Search the Bible
              </button>
              <button
                onClick={() => setView("favorites")}
                className={`${card} border rounded-xl px-4 py-3 text-orange-500`}
              >
                <Star className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              {books.map((b, i) => (
                <button
                  key={b.abbrev}
                  onClick={() => {
                    setBookIdx(i);
                    setChapterIdx(0);
                    setView("chapters");
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border ${card}`}
                >
                  <span className="text-base font-medium">{b.name}</span>
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
          <div className="px-5 pt-4 pb-6 max-w-[430px] mx-auto">
            <div className="grid grid-cols-5 gap-2">
              {currentBook.chapters.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setChapterIdx(i);
                    setView("verses");
                  }}
                  className={`aspect-square rounded-xl border ${card} text-base font-semibold`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {view === "verses" && currentBook && (
        <>
          <Header title={`${currentBook.name} ${chapterIdx + 1}`} onBack={() => setView("chapters")} />
          <div className="px-5 pt-4 pb-8 max-w-[430px] mx-auto space-y-3">
            {currentVerses.map((text, i) => {
              const ref = `${currentBook.name} ${chapterIdx + 1}:${i + 1}`;
              const fav = isFav(currentBook.name, chapterIdx + 1, i + 1);
              return (
                <div key={i} className={`rounded-xl border p-4 ${card}`}>
                  <p className="text-[17px] leading-relaxed">
                    <span className="text-orange-500 font-bold mr-2">{i + 1}</span>
                    {text}
                  </p>
                  <div className="flex items-center justify-end gap-3 mt-2.5">
                    <button
                      onClick={() =>
                        toggleFavorite({
                          translation,
                          book: currentBook.name,
                          chapter: chapterIdx + 1,
                          verse: i + 1,
                          text,
                        })
                      }
                      className={fav ? "text-orange-500" : "text-zinc-500"}
                    >
                      <Star className="w-4 h-4" fill={fav ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => shareVerse(text, ref)} className="text-zinc-500">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between pt-2">
              <button
                disabled={chapterIdx === 0}
                onClick={() => setChapterIdx((c) => Math.max(0, c - 1))}
                className={`px-4 py-2.5 rounded-xl border ${card} text-sm disabled:opacity-30`}
              >
                ← Previous
              </button>
              <button
                disabled={chapterIdx >= currentBook.chapters.length - 1}
                onClick={() => setChapterIdx((c) => Math.min(currentBook.chapters.length - 1, c + 1))}
                className={`px-4 py-2.5 rounded-xl border ${card} text-sm disabled:opacity-30`}
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
          <div className="px-5 pt-4 pb-6 max-w-[430px] mx-auto">
            <div className={`flex items-center gap-2 border rounded-xl px-4 py-3 mb-4 ${card}`}>
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search verses…"
                className="bg-transparent text-base outline-none flex-1"
              />
            </div>

            <div className="space-y-2">
              {searchResults.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setBookIdx(r.bIdx);
                    setChapterIdx(r.cIdx);
                    setView("verses");
                  }}
                  className={`w-full text-left rounded-xl border p-3.5 ${card}`}
                >
                  <p className="text-orange-500 text-xs font-bold mb-1">
                    {r.book.name} {r.cIdx + 1}:{r.vIdx + 1}
                  </p>
                  <p className="text-sm leading-relaxed">{r.text}</p>
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
          <div className="px-5 pt-4 pb-6 max-w-[430px] mx-auto space-y-2">
            {favorites.length === 0 && (
              <div className="text-center pt-12">
                <Star className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Tap the star on any verse to save it here.</p>
              </div>
            )}

            {favorites.map((f, idx) => (
              <div key={idx} className={`rounded-xl border p-4 ${card}`}>
                <p className="text-orange-500 text-xs font-bold mb-1.5">
                  {f.book} {f.chapter}:{f.verse} · {f.translation.toUpperCase()}
                </p>
                <p className="text-[15px] leading-relaxed">{f.text}</p>
                <div className="flex items-center justify-end gap-3 mt-2">
                  <button onClick={() => toggleFavorite(f)} className="text-orange-500">
                    <Star className="w-4 h-4" fill="currentColor" />
                  </button>
                  <button
                    onClick={() => shareVerse(f.text, `${f.book} ${f.chapter}:${f.verse}`)}
                    className="text-zinc-500"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showLangPicker && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setShowLangPicker(false)}>
          <div
            className={`${isDay ? "bg-white text-zinc-950 border-zinc-200" : "bg-zinc-950 text-white border-zinc-800"} w-full border-t rounded-t-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-orange-500" />
              <h3 className="text-[18px] font-semibold">Translation</h3>
            </div>

            <div className="space-y-2">
              {TRANSLATIONS.map((t) => (
                <button
                  key={t.code}
                  onClick={() => {
                    setTranslation(t.code);
                    setShowLangPicker(false);
                  }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border ${
                    translation === t.code
                      ? "border-orange-500 bg-orange-500/10"
                      : isDay
                        ? "border-zinc-200 bg-zinc-50"
                        : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <span className="text-base font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
