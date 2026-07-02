import { BIBLE_BOOK_NAMES } from "@/data/bible/book-names";

// Comprehensive English → localized name lookup for book names used in
// article, devotional, and reading-plan text. Includes numbered book variants
// ("1 John", "First John") that don't appear in BIBLE_BOOK_NAMES abbreviations
// as bare words.
const EXTRA_EN_TO: Record<"es" | "pt", Record<string, string>> = {
  es: {
    Psalm: "Salmo",
    Song: "Cantares",
    "Song of Songs": "Cantares",
  },
  pt: {
    Psalm: "Salmo",
    Song: "Cânticos",
    "Song of Songs": "Cânticos",
  },
};

function buildMap(lang: "es" | "pt"): Array<[RegExp, string]> {
  const pairs: Array<[string, string]> = [];
  for (const entry of Object.values(BIBLE_BOOK_NAMES)) {
    if (entry.en && entry[lang] && entry.en !== entry[lang]) {
      pairs.push([entry.en, entry[lang]]);
    }
  }
  for (const [en, target] of Object.entries(EXTRA_EN_TO[lang])) {
    pairs.push([en, target]);
  }
  // Longest first so "1 John" matches before "John"
  pairs.sort((a, b) => b[0].length - a[0].length);
  return pairs.map(([en, target]) => [
    new RegExp(`\\b${en.replace(/ /g, "\\s+")}\\b`, "g"),
    target,
  ]);
}

const CACHE: Record<string, Array<[RegExp, string]>> = {};

export function localizeBibleRefs(text: string, language: string): string {
  if (!text) return text;
  if (language !== "es" && language !== "pt") return text;
  const lang = language as "es" | "pt";
  if (!CACHE[lang]) CACHE[lang] = buildMap(lang);
  let out = text;
  for (const [re, target] of CACHE[lang]) out = out.replace(re, target);
  return out;
}

// "Day 1" / "Days" localization for reading-plan labels
export function localizeDayLabel(n: number, language: string): string {
  if (language === "es") return `Día ${n}`;
  if (language === "pt") return `Dia ${n}`;
  return `Day ${n}`;
}