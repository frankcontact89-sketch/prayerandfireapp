import React, { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import Index from "./Index";
import { supabase } from "@/integrations/supabase/client";

export default function IndexWithCommunity() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setIsAuthenticated(Boolean(session?.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const openCommunity = () => {
    window.location.assign("/community");
  };

  return (
    <div className="relative min-h-[100dvh] bg-black">
      <Index />

      {isAuthenticated && (
        <button
          type="button"
          onClick={openCommunity}
          aria-label="Community"
          title="Community"
          className="fixed z-[999] grid h-[64px] w-[76px] place-items-center bg-black text-zinc-500 active:text-orange-500"
          style={{
            bottom: "env(safe-area-inset-bottom)",
            right: "max(8px, calc((100vw - 430px) / 2 + 8px))",
          }}
        >
          <MessageCircle className="h-7 w-7" strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}
