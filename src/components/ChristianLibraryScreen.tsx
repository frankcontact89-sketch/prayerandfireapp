import React, { useEffect, useState } from "react";
import { Library as LibraryIcon, ChevronRight, Landmark, GraduationCap } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { supabase } from "@/integrations/supabase/client";
import { L, pick } from "./content/lang";

const CATEGORY_LABELS: Record<string, [string, string, string]> = {
  bible_studies: ["Bible Studies", "Estudios Bíblicos", "Estudos Bíblicos"],
  doctrine: ["Doctrine", "Doctrina", "Doutrina"],
  christology: ["Christology", "Cristología", "Cristologia"],
  pneumatology: ["Pneumatology", "Pneumatología", "Pneumatologia"],
  soteriology: ["Soteriology", "Soteriología", "Soteriologia"],
  hermeneutics: ["Hermeneutics", "Hermenéutica", "Hermenêutica"],
  homiletics: ["Homiletics", "Homilética", "Homilética"],
  church_history: ["Church History", "Historia de la Iglesia", "História da Igreja"],
  apologetics: ["Apologetics", "Apologética", "Apologética"],
  leadership: ["Leadership", "Liderazgo", "Liderança"],
  missions: ["Missions", "Misiones", "Missões"],
  sermons: ["Sermons", "Sermones", "Sermões"],
  articles: ["Articles", "Artículos", "Artigos"],
};

interface Props {
  onBack: () => void;
  language: string;
  onOpenArticle: (id: string) => void;
  onNavigate?: (page: string) => void;
}

export function ChristianLibraryScreen({ onBack, language, onOpenArticle, onNavigate }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [wordsCount, setWordsCount] = useState<number>(0);
  const [solasCount, setSolasCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    (async () => {
      try {
        const [{ data, error: articlesError }, { count: wc, error: wordsError }, { count: sc, error: solasError }] = await Promise.all([
          supabase.from("library_articles").select("*")
            .eq("is_published", true).order("category").order("order_index"),
          supabase.from("greek_words").select("*", { count: "exact", head: true }),
          supabase.from("solas").select("*", { count: "exact", head: true }),
        ]);
        if (articlesError || wordsError || solasError) throw articlesError || wordsError || solasError;
        if (!active) return;
        setRows(data || []);
        setWordsCount(wc || 0);
        setSolasCount(sc || 0);
      } catch (error) {
        console.error("Library content could not be loaded", error);
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [retryCount]);

  const title = L(language, "Library & Academy", "Biblioteca y Academia", "Biblioteca e Academia");

  if (loading) {
    return (
      <SimpleScreen title={title} icon={<LibraryIcon className="w-6 h-6" />} onBack={onBack}>
        <div className="text-zinc-400 text-center py-10">…</div>
      </SimpleScreen>
    );
  }

  if (loadError) {
    return (
      <SimpleScreen title={title} icon={<LibraryIcon className="w-6 h-6" />} onBack={onBack}>
        <div role="alert" className="rounded-xl border border-[#E5BB70]/30 bg-[#220D19]/70 p-5 text-center space-y-3">
          <p className="text-slate-200">{L(language,
            "The library could not be loaded. Check your connection and try again.",
            "No se pudo cargar la biblioteca. Revisa tu conexión e inténtalo de nuevo.",
            "Não foi possível carregar a biblioteca. Verifique sua conexão e tente novamente.")}</p>
          <button type="button" onClick={() => setRetryCount(n => n + 1)}
            className="rounded-lg border border-[#E5BB70]/60 px-4 py-2 text-[#E5BB70] hover:bg-[#5C061F]/60">
            {L(language, "Try again", "Intentar de nuevo", "Tentar novamente")}
          </button>
        </div>
      </SimpleScreen>
    );
  }

  const grouped: Record<string, any[]> = {};
  for (const r of rows) {
    (grouped[r.category] ||= []).push(r);
  }

  return (
    <SimpleScreen title={title} icon={<LibraryIcon className="w-6 h-6" />} onBack={onBack}>
      <div className="space-y-6">
        {/* Keep the original Prayer & Fire burgundy/gold theme; ABBA blue applies only inside its portal. */}
        <section aria-label="ABBA Academy" className="rounded-xl border border-[#E5BB70]/30 bg-[#220D19]/70 p-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="w-6 h-6 shrink-0 text-[#E5BB70]" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="font-semibold text-white">ABBA Academy</h2>
              <p className="mt-1 text-sm text-slate-300">
                {L(language,
                  "Open the ABBA Academy portal to sign in and access your enrolled courses.",
                  "Abre el portal de ABBA Academy para iniciar sesión y acceder a tus cursos inscritos.",
                  "Abra o portal da ABBA Academy para entrar e acessar seus cursos matriculados.")}
              </p>
              <button type="button" onClick={() => onNavigate?.("abba-academy")}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#E5BB70]/50 px-4 py-2 text-sm font-semibold text-[#E5BB70] hover:bg-[#5C061F]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5BB70]">
                {L(language, "Open ABBA Academy", "Entrar a ABBA Academy", "Entrar na ABBA Academy")}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="mt-2 text-xs text-zinc-400">
                {L(language,
                  "The Academy has its own blue portal. Course synchronization in the app is not available yet.",
                  "La Academia tiene su propio portal azul. La sincronización de cursos dentro de la app todavía no está disponible.",
                  "A Academia tem seu próprio portal azul. A sincronização dos cursos no aplicativo ainda não está disponível.")}
              </p>
            </div>
          </div>
        </section>
        {(solasCount > 0 || wordsCount > 0) && (
          <section className="space-y-2">
            {solasCount > 0 && (
              <button
                onClick={() => onNavigate?.("solas")}
                className="w-full text-left rounded-xl border border-[#E5BB70]/30 bg-[#220D19]/80 p-3 hover:border-[#E5BB70]/70 hover:bg-[#5C061F]/35 flex items-center gap-3"
              >
                <Landmark className="w-5 h-5 text-[#E5BB70] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">
                    {L(language, "The Five Solas", "Los Cinco Solas", "Os Cinco Solas")}
                  </div>
                  <div className="text-sm text-zinc-400 mt-0.5">
                    {L(language, "Reformation pillars of the faith",
                      "Pilares de la fe de la Reforma",
                      "Pilares da fé da Reforma")}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#E5BB70]/70" />
              </button>
            )}
            {wordsCount > 0 && (
              <button
                onClick={() => onNavigate?.("greek-words")}
                className="w-full text-left rounded-xl border border-[#E5BB70]/30 bg-[#220D19]/80 p-3 hover:border-[#E5BB70]/70 hover:bg-[#5C061F]/35 flex items-center gap-3"
              >
                <GraduationCap className="w-5 h-5 text-[#E5BB70] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">
                    {L(language, "Biblical Languages Library",
                      "Biblioteca de Lenguas Bíblicas",
                      "Biblioteca de Línguas Bíblicas")}
                  </div>
                  <div className="text-sm text-zinc-400 mt-0.5">
                    {wordsCount} {L(language, "entries", "entradas", "entradas")}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#E5BB70]/70" />
              </button>
            )}
          </section>
        )}

        {Object.entries(grouped).map(([cat, list]) => {
          const labels = CATEGORY_LABELS[cat] || [cat, cat, cat];
          return (
            <section key={cat}>
              <h2 className="text-[#E5BB70] uppercase tracking-[0.2em] text-[11px] font-bold mb-2">
                {L(language, labels[0], labels[1], labels[2])}
              </h2>
              <div className="space-y-2">
                {list.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onOpenArticle(a.id)}
                    className="w-full text-left rounded-xl border border-[#E5BB70]/20 bg-[#220D19]/80 p-3 hover:border-[#E5BB70]/70 hover:bg-[#5C061F]/35 flex items-center gap-3"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-white">{pick(a, "title", language)}</div>
                      {pick(a, "summary", language) && (
                        <div className="text-sm text-zinc-400 line-clamp-2 mt-0.5">
                          {pick(a, "summary", language)}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#E5BB70]/70" />
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </SimpleScreen>
  );
}
/** Academy entry screen only: the official website remains the source of authentication and course access. */
export function AbbaAcademyPortalScreen({ onBack, language }: { onBack: () => void; language: string }) {
  const [showAcademy, setShowAcademy] = useState(false);
  return (
    <div className="min-h-[70vh] bg-[#071A34] text-white px-4 py-5">
      <div className={showAcademy ? "mx-auto w-full" : "mx-auto max-w-md"}>
        <button type="button" onClick={() => showAcademy ? setShowAcademy(false) : onBack()}
          className="mb-5 inline-flex items-center gap-2 text-slate-200 hover:text-white">
          <span aria-hidden="true">←</span> {showAcademy
            ? L(language, "Academy home", "Inicio de Academia", "Início da Academia")
            : L(language, "Back to Library", "Volver a la Biblioteca", "Voltar à Biblioteca")}
        </button>
        {showAcademy ? (
          <div className="overflow-hidden rounded-xl border border-[#365D87] bg-white">
            <iframe
              title="ABBA Academy"
              src="https://prayerandfire.org/academy"
              className="block w-full border-0"
              style={{ height: "calc(100dvh - 230px)", minHeight: 480 }}
              allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <p className="bg-[#102A4A] px-4 py-3 text-xs text-[#D5E4F6]">
              {L(language,
                "If the Academy does not load here, its website may block embedded access. Use the external option below.",
                "Si la Academia no carga aquí, su sitio puede bloquear el acceso integrado. Usa la opción externa de abajo.",
                "Se a Academia não carregar aqui, o site pode bloquear o acesso incorporado. Use a opção externa abaixo.")}
              {" "}
              <a href="https://prayerandfire.org/academy" target="_blank" rel="noopener noreferrer"
                className="font-semibold underline">
                {L(language, "Open website", "Abrir sitio web", "Abrir site")}
              </a>
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#365D87] bg-[#102A4A] p-6 shadow-lg">
            <GraduationCap className="mb-4 h-10 w-10 text-[#D5E4F6]" aria-hidden="true" />
            <h1 className="text-2xl font-bold">ABBA Academy</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#D5E4F6]">
              {L(language,
                "Access your Academy account without leaving Prayer & Fire.",
                "Accede a tu cuenta de la Academia sin salir de Prayer & Fire.",
                "Acesse sua conta da Academia sem sair do Prayer & Fire.")}
            </p>
            <button type="button" onClick={() => setShowAcademy(true)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D5E4F6] px-4 py-3 font-semibold text-[#071A34] hover:bg-white">
              {L(language, "Continue to Academy", "Continuar a la Academia", "Continuar para a Academia")}
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="mt-4 text-xs text-[#AFC4DD]">
              {L(language,
                "Embedded website access is experimental; Academy sign-in and lessons must be tested on iOS.",
                "El acceso integrado es experimental; debemos probar el inicio de sesión y las clases en iOS.",
                "O acesso integrado é experimental; precisamos testar o login e as aulas no iOS.")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
