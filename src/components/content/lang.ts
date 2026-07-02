export function L(lang: string, en: string, es: string, pt: string) {
  return lang === "es" ? es : lang === "pt" ? pt : en;
}

export function pick(row: any, base: string, lang: string): string {
  if (!row) return "";
  const key = `${base}_${lang}`;
  const fallback = `${base}_en`;
  return (row[key] ?? row[fallback] ?? "") as string;
}

export function pickArr(row: any, base: string, lang: string): string[] {
  if (!row) return [];
  const v = row[`${base}_${lang}`] ?? row[`${base}_en`];
  return Array.isArray(v) ? v : [];
}