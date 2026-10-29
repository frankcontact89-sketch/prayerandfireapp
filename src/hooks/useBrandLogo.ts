import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_LOGO = "/prayer-fire-official-logo.webp";
export const brandLogoChanged = "pf-brand-logo-updated";

export function useBrandLogo() {
  const [logo, setLogo] = useState(FALLBACK_LOGO);
  useEffect(() => {
    let active = true;
    let requestId = 0;
    const refresh = async () => {
      const currentRequest = ++requestId;
      const { data, error } = await (supabase as any).from("app_branding").select("logo_path").eq("id", "global").maybeSingle();
      if (!active || currentRequest !== requestId) return;
      if (error) { console.warn("Branding configuration not available:", error.message); return; }
      const path = data?.logo_path;
      const next = typeof path === "string" && /^logos\/[a-zA-Z0-9._-]+$/.test(path)
        ? supabase.storage.from("pf-branding").getPublicUrl(path).data.publicUrl
        : FALLBACK_LOGO;
      setLogo(next);
    };
    void refresh();
    const listener = () => void refresh();
    window.addEventListener(brandLogoChanged, listener);
    return () => { active = false; window.removeEventListener(brandLogoChanged, listener); };
  }, []);
  return logo;
}
