// Phone normalization helpers shared by Settings and Community invites.
// Rule: an explicit "+country code" is always preserved. A local-style number
// is combined with the selected country code (default +1 for US/Canada).

export const COUNTRY_CODES = [
  { code: "+1", label: "US/CA +1" },
  { code: "+52", label: "MX +52" },
  { code: "+34", label: "ES +34" },
  { code: "+55", label: "BR +55" },
  { code: "+351", label: "PT +351" },
  { code: "+57", label: "CO +57" },
  { code: "+54", label: "AR +54" },
  { code: "+56", label: "CL +56" },
  { code: "+51", label: "PE +51" },
  { code: "+44", label: "UK +44" },
];

export const DEFAULT_COUNTRY_CODE = "+1";

/** Returns an E.164 string (+digits) or null when the input cannot be a valid number. */
export function toE164(input: string, countryCode = DEFAULT_COUNTRY_CODE): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;

  let digits: string;
  if (raw.startsWith("+")) {
    digits = raw.replace(/[^0-9]/g, "");
  } else {
    const local = raw.replace(/[^0-9]/g, "");
    if (!local) return null;
    const cc = (countryCode || DEFAULT_COUNTRY_CODE).replace(/[^0-9]/g, "");
    // Already prefixed with the country code and long enough → keep as is.
    digits = local.startsWith(cc) && local.length > cc.length + 6 ? local : `${cc}${local}`;
  }

  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}
