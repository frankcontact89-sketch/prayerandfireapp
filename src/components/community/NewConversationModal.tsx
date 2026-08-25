import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Person = {
  id: string;
  displayName: string;
  username?: string | null;
  avatar?: string | null;
};

type Props = {
  open: boolean;
  language: "en" | "es" | "pt";
  onClose: () => void;
  onNewGroup: () => void;
  canCreateGroup: boolean;
  onPerson: (person: Person) => Promise<void>;
};

const words = {
  en: {
    title: "New chat",
    search: "Search people",
    group: "New group",
    loading: "Loading people…",
    empty: "No other members found",
  },
  es: {
    title: "Nuevo chat",
    search: "Buscar personas",
    group: "Nuevo grupo",
    loading: "Cargando personas…",
    empty: "No se encontraron otros miembros",
  },
  pt: {
    title: "Nova conversa",
    search: "Buscar pessoas",
    group: "Novo grupo",
    loading: "Carregando pessoas…",
    empty: "Nenhum outro membro encontrado",
  },
};

export default function NewConversationModal({
  open,
  language,
  onClose,
  onNewGroup,
  canCreateGroup,
  onPerson,
}: Props) {
  const t = words[language];
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: requests } = await supabase
        .from("community_access_requests")
        .select("user_id")
        .eq("status", "approved");
      const { data: admins } = await supabase
        .from("community_admins")
        .select("user_id");
      const ids = Array.from(
        new Set([
          ...(requests ?? []).map((row) => row.user_id),
          ...(admins ?? []).map((row) => row.user_id),
        ]),
      ).filter((id) => id !== user?.id);
      if (!ids.length) {
        if (!cancelled) {
          setPeople([]);
          setLoading(false);
        }
        return;
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,username,avatar_url")
        .in("id", ids)
        .order("username");
      if (!cancelled) {
        setPeople(
          (profiles ?? []).map((profile) => ({
            id: profile.id,
            displayName: profile.username || "Prayer & Fire Member",
            username: profile.username,
            avatar: profile.avatar_url,
          })),
        );
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(
    () =>
      people.filter((person) =>
        `${person.displayName} ${person.username ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [people, query],
  );
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[160] flex flex-col bg-[#080808] text-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-black px-3">
        <button
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full bg-zinc-900"
        >
          <ArrowLeft />
        </button>
        <b className="text-lg">{t.title}</b>
      </header>
      <div className="px-4 py-3">
        <div className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900 px-4">
          <Search className="h-5 w-5 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </div>
      </div>
      <main className="min-h-0 flex-1 overflow-y-auto px-4">
        {canCreateGroup && (
          <button
            onClick={onNewGroup}
            className="flex w-full items-center gap-3 border-b border-white/10 py-3 text-left"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-orange-500 text-black">
              <Users />
            </span>
            <b>{t.group}</b>
          </button>
        )}
        {loading ? (
          <p className="py-10 text-center text-sm text-zinc-500">{t.loading}</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">{t.empty}</p>
        ) : (
          filtered.map((person) => (
            <button
              key={person.id}
              disabled={opening !== null}
              onClick={async () => {
                setOpening(person.id);
                await onPerson(person);
                setOpening(null);
              }}
              className="flex w-full items-center gap-3 border-b border-white/5 py-3 text-left disabled:opacity-60"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-800 font-black">
                {person.avatar ? (
                  <img
                    src={person.avatar}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  person.displayName[0]?.toUpperCase()
                )}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate">{person.displayName}</b>
                {person.username && (
                  <small className="block truncate text-zinc-500">
                    @{person.username}
                  </small>
                )}
              </span>
            </button>
          ))
        )}
      </main>
    </div>
  );
}
