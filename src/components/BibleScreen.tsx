import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, Star, Share2, ChevronRight, BookOpen, Globe, Sun, Moon } from "lucide-react";

type Book = { name: string; abbrev: string; chapters: string[][] };

const TRANSLATIONS = [
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

const UI = {
  en: {
    bible: "Holy Bible",
    search: "Search the Bible",
    fav: "Favorites",
    translation: "Bible Translation",
    language: "Screen Language",
    copied: "Verse copied",
    noResults: "No results",
  },
  es: {
    bible: "Santa Biblia",
    search: "Buscar en la Biblia",
    fav: "Favoritos",
    translation: "Traducción Bíblica",
    language: "Idioma de Pantalla",
    copied: "Versículo copiado",
    noResults: "Sin resultados",
  },
  pt: {
    bible: "Bíblia Sagrada",
    search: "Pesquisar na Bíblia",
    fav: "Favoritos",
    translation: "Tradução Bíblica",
    language: "Idioma da Tela",
    copied: "Versículo copiado",
    noResults: "Sem resultados",
  },
  hi: {
    bible: "पवित्र बाइबल",
    search: "बाइबल खोजें",
    fav: "पसंदीदा",
    translation: "बाइबल अनुवाद",
    language: "स्क्रीन भाषा",
    copied: "पद कॉपी हुआ",
    noResults: "कोई परिणाम नहीं",
  },
};

const FAV_KEY = "pf_bible_favorites";
const LANG_KEY = "pf_bible_lang";
const UI_LANG_KEY = "pf_bible_ui_lang";
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
  const [uiLang, setUiLang] = useState<keyof typeof UI>(
    () => (localStorage.getItem(UI_LANG_KEY) as keyof typeof UI) || "en",
  );
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
  const [showPicker, setShowPicker] = useState(false);

  const txt = UI[uiLang] || UI.en;
  const isDay = mode === "day";
  const pageBg = isDay ? "bg-[#f8f5ef] text-zinc-950" : "bg-black text-white";
  const card = isDay ? "bg-white border-zinc-200 text-zinc-950" : "bg-zinc-950 border-zinc-900 text-white";

  useEffect(() => {
    setLoading(true);
    const selected = TRANSLATIONS.find((x) => x.code === translation) || TRANSLATIONS[0];

    selected.loader().then((data) => {
      setBooks(data);
      setBookIdx((prev) => Math.min(prev, data.length - 1));
      setLoading(false);
    });

    localStorage.setItem(LANG_KEY, translation);
  }, [translation]);

  useEffect(() => {
    localStorage.setItem(UI_LANG_KEY, uiLang);
    localStorage.setItem(MODE_KEY, mode);
    localStorage.setItem(BOOK_KEY, String(bookIdx));
    localStorage.setItem(CHAPTER_KEY, String(chapterIdx));
    localStorage.setItem(VIEW_KEY, view);
  }, [uiLang, mode, bookIdx, chapterIdx, view]);

  const currentBook = books?.[bookIdx];
  const currentVerses = currentBook?.chapters?.[chapterIdx] || [];

  const searchResults = useMemo(() => {
    if (!query.trim() || !books) return [];
    const q = query.toLowerCase();
    const results: any[] = [];

    for (let b = 0; b < books.length && results.length < 80; b++) {
      const bk = books[b];
      for (let c = 0; c < bk.chapters.length && results.length < 80; c++) {
        for (let v = 0; v < bk.chapters[c].length && results.length < 80; v++) {
          const verse = bk.chapters[c][v];
          if (verse.toLowerCase().includes(q)) {
            results.push({ book: bk, bIdx: b, cIdx: c, vIdx: v, text: verse });
          }
        }
      }
    }

    return results;
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
    const payload = `"${text}" — ${ref}\n\nPrayer & Fire App`;

    try {
      if (navigator.share) {
        await navigator.share({ title: ref, text: payload });
        return;
      }
    } catch {}

    try {
      await navigator.clipboard.writeText(payload);
      alert(txt.copied);
    } catch {
      alert(payload);
    }
  };

  const Header = ({ title, onBack }: { title: string; onBack?: () => void }) => (
    <div
      className={`sticky top-0 z-10 backdrop-blur-md border-b ${isDay ? "bg-white/95 border-zinc-200" : "bg-black/90 border-zinc-800"}`}
    >
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button onClick={onBack} className="text-orange-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-[20px] font-semibold truncate">{title}</h2>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setMode(isDay ? "night" : "day")} className="text-orange-500">
            {isDay ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button onClick={() => setShowPicker(true)} className="text-orange-500 flex items-center gap-1">
            <Globe className="w-4 h-4" />
            <span className="uppercase text-xs font-bold">{translation}</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (loading || !books) {
    return (
      <div className={`${pageBg} min-h-screen flex items-center justify-center text-orange-500`}>Loading Bible…</div>
    );
  }

  return (
    <div className={`${pageBg} min-h-screen`}>
      {view === "books" && (
        <>
          <Header title={txt.bible} />
          <div className="px-5 pt-4 pb-6 max-w-[430px] mx-auto">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setView("search")}
                className={`flex-1 flex items-center gap-2 border rounded-xl px-4 py-3 text-sm ${card}`}
              >
                <Search className="w-4 h-4" /> {txt.search}
              </button>
              <button
                onClick={() => setView("favorites")}
                className={`border rounded-xl px-4 py-3 text-orange-500 ${card}`}
              >
                <Star className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
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
                  className={`aspect-square rounded-xl border font-semibold ${card}`}
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

                  <div className="flex items-center justify-end gap-4 mt-3">
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
                      <Star className="w-5 h-5" fill={fav ? "currentColor" : "none"} />
                    </button>
                    <button onClick={() => shareVerse(text, ref)} className="text-zinc-500">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between pt-2">
              <button
                disabled={chapterIdx === 0}
                onClick={() => setChapterIdx((c) => Math.max(0, c - 1))}
                className={`px-4 py-2.5 rounded-xl border ${card} disabled:opacity-30`}
              >
                ← Previous
              </button>
              <button
                disabled={chapterIdx >= currentBook.chapters.length - 1}
                onClick={() => setChapterIdx((c) => Math.min(currentBook.chapters.length - 1, c + 1))}
                className={`px-4 py-2.5 rounded-xl border ${card} disabled:opacity-30`}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {view === "search" && (
        <>
          <Header title={txt.search} onBack={() => setView("books")} />
          <div className="px-5 pt-4 pb-6 max-w-[430px] mx-auto">
            <div className={`flex items-center gap-2 border rounded-xl px-4 py-3 mb-4 ${card}`}>
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={txt.search}
                className="bg-transparent outline-none flex-1"
              />
            </div>

            <div className="space-y-2">
              {searchResults.map((r: any, idx) => (
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
              {query && searchResults.length === 0 && <p className="text-zinc-500 text-center pt-6">{txt.noResults}</p>}
            </div>
          </div>
        </>
      )}

      {view === "favorites" && (
        <>
          <Header title={txt.fav} onBack={() => setView("books")} />
          <div className="px-5 pt-4 pb-6 max-w-[430px] mx-auto space-y-2">
            {favorites.length === 0 && <p className="text-zinc-500 text-center pt-10">No favorites yet.</p>}
            {favorites.map((f, idx) => (
              <div key={idx} className={`rounded-xl border p-4 ${card}`}>
                <p className="text-orange-500 text-xs font-bold mb-1">
                  {f.book} {f.chapter}:{f.verse} · {f.translation.toUpperCase()}
                </p>
                <p className="text-[15px] leading-relaxed">{f.text}</p>
                <div className="flex justify-end gap-4 mt-3">
                  <button onClick={() => toggleFavorite(f)} className="text-orange-500">
                    <Star className="w-5 h-5" fill="currentColor" />
                  </button>
                  <button
                    onClick={() => shareVerse(f.text, `${f.book} ${f.chapter}:${f.verse}`)}
                    className="text-zinc-500"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showPicker && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setShowPicker(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`${isDay ? "bg-white text-zinc-950" : "bg-zinc-950 text-white"} w-full rounded-t-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+20px)]`}
          >
            <h3 className="text-lg font-bold mb-3">{txt.translation}</h3>
            <div className="space-y-2 mb-5">
              {TRANSLATIONS.map((t) => (
                <button
                  key={t.code}
                  onClick={() => {
                    setTranslation(t.code);
                    setShowPicker(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl border ${translation === t.code ? "border-orange-500 bg-orange-500/10" : "border-zinc-700"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <h3 className="text-lg font-bold mb-3">{txt.language}</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setUiLang("en")} className="border border-zinc-700 rounded-xl py-3">
                English
              </button>
              <button onClick={() => setUiLang("es")} className="border border-zinc-700 rounded-xl py-3">
                Español
              </button>
              <button onClick={() => setUiLang("pt")} className="border border-zinc-700 rounded-xl py-3">
                Português
              </button>
              <button onClick={() => setUiLang("hi")} className="border border-zinc-700 rounded-xl py-3">
                Hindi
              </button>
            </div>

            <p className="text-zinc-500 text-xs mt-4">
              Available Bible translations: KJV and Reina-Valera. Screen language can change separately.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
