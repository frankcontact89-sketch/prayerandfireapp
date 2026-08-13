// Client-side pre-check that mirrors the authoritative database filter
// (public.community_text_blocked). The database remains the source of truth:
// this only gives faster, localized feedback before a network round-trip.

const PATTERNS: RegExp[] = [
  /\b(fuck|fuk|fck|phuck|motherfucker|cunt|whore|slut|bitch|btch|bastard|nigger|nigga|nigg|faggot|fag|kike|spic|chink|tranny|retard|puta|puto|pendejo|cabron|maricon|marica|verga|cono|chinga|mierda|hijueputa|vadia|vagabunda|viado|caralho|porra|buceta|foda se|filho da puta)\b/,
  /\b(child porn|childporn|cp porn|porn|porno|pornhub|xxx|nudes|sexo explicito|sexting|onlyfans)\b/,
  /(i will kill you|im going to kill you|kill yourself|kys|te voy a matar|te vou matar|vou te matar|matate|se mate|rape you)/,
  /(free crypto|bitcoin giveaway|make money fast|click this link to earn|whatsapp \+?[0-9]{8,}|telegram me for money|forex profit|investment guaranteed profit)/,
];

export function isBlockedContent(text?: string | null): boolean {
  if (!text || !text.trim()) return false;
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[@$!013]/g, (c) => ({ "@": "a", $: "s", "!": "i", "0": "o", "1": "i", "3": "e" }[c] as string))
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return PATTERNS.some((re) => re.test(normalized));
}

export const contentBlockedMessage = (lang: "en" | "es" | "pt") =>
  lang === "es"
    ? "Este contenido no se puede publicar porque infringe las normas de la comunidad Prayer & Fire."
    : lang === "pt"
      ? "Este conteúdo não pode ser publicado porque infringe as normas da comunidade Prayer & Fire."
      : "This content can't be posted because it violates the Prayer & Fire community standards.";
