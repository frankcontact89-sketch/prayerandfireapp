import React, { createContext, useContext } from "react";
import { BIBLE_BOOK_NAMES } from "@/data/bible/book-names";

// Extra book-name variants not covered directly by BIBLE_BOOK_NAMES.
// Every variant maps to the canonical abbreviation used in the bundled
// Bible JSON (kjv.json / rvr.json / aa.json).
const EXTRA_VARIANTS: Array<[string, string]> = [
  ["Psalm", "ps"], ["Psalms", "ps"],
  ["Salmo", "ps"], ["Salmos", "ps"],
  ["Song of Songs", "so"], ["Song of Solomon", "so"],
  ["Cantares", "so"], ["Cânticos", "so"], ["Canticos", "so"],
  ["Cantar de los Cantares", "so"],
];

export type ParsedRef = { abbrev: string; chapter: number; verse: number };

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Variants = { map: Map<string, string>; regex: RegExp };
const CACHE: Record<string, Variants> = {};

function buildVariants(language: string): Variants {
  const langs: Array<"en" | "es" | "pt"> =
    language === "es" || language === "pt" ? [language as any, "en"] : ["en"];
  const list: Array<[string, string]> = [];
  for (const [abbrev, names] of Object.entries(BIBLE_BOOK_NAMES)) {
    for (const l of langs) {
      const n = (names as any)[l];
      if (n) list.push([n, abbrev]);
    }
  }
  list.push(...EXTRA_VARIANTS);

  // Dedupe by lowercase name, longest first for greedy matching
  list.sort((a, b) => b[0].length - a[0].length);
  const map = new Map<string, string>();
  const patterns: string[] = [];
  for (const [name, abbrev] of list) {
    const key = name.toLowerCase();
    if (map.has(key)) continue;
    map.set(key, abbrev);
    patterns.push(escapeRegex(name).replace(/ /g, "\\s+"));
  }
  const regex = new RegExp(
    `\\b(${patterns.join("|")})\\s+(\\d+)\\s*:\\s*(\\d+)(?:\\s*[-–]\\s*\\d+)?`,
    "gi",
  );
  return { map, regex };
}

function getVariants(language: string): Variants {
  const key = language === "es" || language === "pt" ? language : "en";
  if (!CACHE[key]) CACHE[key] = buildVariants(key);
  return CACHE[key];
}

// Wraps every detected Bible reference in a markdown link using the
// `bibleref://<abbrev>/<chapter>/<verse>` scheme so ReactMarkdown will
// render it as a tappable element which we intercept.
export function linkifyBibleRefs(text: string, language: string): string {
  if (!text) return text;
  const { map, regex } = getVariants(language);
  return text.replace(regex, (match, name: string, c: string, v: string) => {
    const abbrev = map.get(name.toLowerCase());
    if (!abbrev) return match;
    return `[${match}](bibleref://${abbrev}/${Number(c)}/${Number(v)})`;
  });
}

export function parseBibleRefHref(href: string): ParsedRef | null {
  if (!href?.startsWith("bibleref://")) return null;
  const parts = href.slice("bibleref://".length).split("/");
  if (parts.length < 3) return null;
  const [abbrev, c, v] = parts;
  const chapter = Number(c);
  const verse = Number(v);
  if (!abbrev || !Number.isFinite(chapter) || !Number.isFinite(verse)) return null;
  return { abbrev: abbrev.toLowerCase(), chapter, verse };
}

type OpenRefFn = (ref: ParsedRef) => void;
const BibleRefContext = createContext<OpenRefFn | null>(null);

export function BibleRefProvider({
  openRef,
  children,
}: {
  openRef: OpenRefFn;
  children: React.ReactNode;
}) {
  return (
    <BibleRefContext.Provider value={openRef}>{children}</BibleRefContext.Provider>
  );
}

export function useOpenBibleRef(): OpenRefFn | null {
  return useContext(BibleRefContext);
}