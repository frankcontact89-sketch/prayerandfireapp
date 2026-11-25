import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useContactSearch(query: string, enabled: boolean) {
  const [people, setPeople] = useState<{ id: string; username: string | null; avatar_url: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const term = query.trim();
    setPeople([]);
    setFailed(false);
    if (!enabled || term.length < 2) { setLoading(false); return; }
    setLoading(true);
    const timer = window.setTimeout(() => {
      void supabase.rpc("community_find_contacts", { _query: term }).then(({ data, error }) => {
        if (!active) return;
        setPeople(data ?? []);
        setFailed(!!error);
        setLoading(false);
      });
    }, 400);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, enabled]);
  return { people, loading, failed };
}
