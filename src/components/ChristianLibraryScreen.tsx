import React, { useEffect, useState } from "react";
import { Library as LibraryIcon, ChevronRight, Landmark, GraduationCap } from "lucide-react";
import { SimpleScreen } from "./SimpleScreen";
import { supabase } from "@/integrations/supabase/client";
import { L, pick } from "./content/lang";
import { loadAcademyAccess, completeAcademyLesson } from "@/lib/abbaAcademyBridge";
import { academyCompletionPercent, type AcademyAccess } from "@/lib/abbaAcademy";

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
                  "Explore ABBA Academy and its biblical training programs.",
                  "Conoce ABBA Academy y sus programas de formación bíblica.",
                  "Conheça a ABBA Academy e seus programas de formação bíblica.")}
              </p>
              <button type="button" onClick={() => onNavigate?.("abba-academy")}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#E5BB70]/50 px-4 py-2 text-sm font-semibold text-[#E5BB70] hover:bg-[#5C061F]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E5BB70]">
                {L(language, "Open ABBA Academy", "Entrar a ABBA Academy", "Entrar na ABBA Academy")}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="mt-2 text-xs text-zinc-400">
                {L(language,
                  "Your access to private lessons depends on your Academy enrollment.",
                  "El acceso a las clases privadas depende de tu inscripción en la Academia.",
                  "O acesso às aulas privadas depende da sua matrícula na Academia.")}
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
/** App-native Academy UI. The backend must authorize every private request. */
export function AbbaAcademyPortalScreen({ onBack, language }: { onBack: () => void; language: string }) {
  const [access, setAccess] = useState<AcademyAccess>({ status: "unavailable" });
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [sessionRevision, setSessionRevision] = useState(0);
  const [prayerFireAccountId, setPrayerFireAccountId] = useState<string | null>(null);
  const [accountIdCopied, setAccountIdCopied] = useState(false);
  const [savingCompletion, setSavingCompletion] = useState(false);
  const [completionError, setCompletionError] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setPrayerFireAccountId(data.user?.id ?? null);
    }).catch(() => {
      if (mounted) setPrayerFireAccountId(null);
    });
    return () => { mounted = false; };
  }, []);


  useEffect(() => {
    const controller = new AbortController();
    // Keep the current authorized lesson visible during routine refreshes.
    // Account changes explicitly clear access in the auth listener below.
    setLoading(true);
    loadAcademyAccess(controller.signal)
      .then((value) => {
        if (controller.signal.aborted) return;
        setAccess(value);
        // Keep the current lesson open when a background refresh returns it.
        // Clear selection immediately if enrollment or lesson access was revoked.
        setSelectedLesson((previous) => previous && value.status === "enrolled" &&
          value.lessons.some((lesson) => lesson.id === previous) ? previous : null);
        setSelectedCourse((previous) => previous && value.status !== "unavailable" &&
          value.courses.some((course) => course.id === previous) ? previous : null);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          // Never retain potentially stale enrollment after a failed refresh.
          setAccess({ status: "unavailable" });
          setSelectedLesson(null);
          setSelectedCourse(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry, sessionRevision]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setAccess({ status: "unavailable" });
        setSelectedCourse(null);
        setSelectedLesson(null);
        setSessionRevision((value) => value + 1);
      } else if (event === "TOKEN_REFRESHED") {
        // Refresh authorized Academy data without losing the course selection.
        // The request effect aborts any in-flight request from the old token.
        setSessionRevision((value) => value + 1);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Refresh course catalog and progress when the student returns to the app.
    // A future authenticated Academy bridge can then surface newly published
    // lessons without requiring another TestFlight release.
    const refreshOnResume = () => {
      if (document.visibilityState === "visible") {
        setRetry((value) => value + 1);
      }
    };
    document.addEventListener("visibilitychange", refreshOnResume);
    // Keep the catalog current during long study sessions without a new build.
    // Pause network refreshes while the app is in the background.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setRetry((value) => value + 1);
      }
    }, 5 * 60 * 1000);
    return () => {
      document.removeEventListener("visibilitychange", refreshOnResume);
      window.clearInterval(interval);
    };
  }, []);

  const enrolled = access.status === "enrolled";
  const courses = access.status === "unavailable" ? [] : access.courses;
  const activeCourse = courses.find((course) => course.id === selectedCourse);
  const lessons = enrolled && activeCourse
    ? access.lessons.filter((lesson) => lesson.course_id === activeCourse.id)
        .sort((a, b) => a.lesson_number - b.lesson_number)
    : [];
  const activeLesson = lessons.find((lesson) => lesson.id === selectedLesson);
  const lessonProgress = enrolled && activeLesson ? access.progress.find((item) => item.lesson_id === activeLesson.id) : undefined;
  const lessonIndex = activeLesson ? lessons.findIndex((item) => item.id === activeLesson.id) : -1;
  const previousLesson = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex >= 0 && lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  const percent = enrolled && activeCourse
    ? academyCompletionPercent(lessons, access.progress)
    : 0;
  const nextStudyLesson = enrolled && activeCourse
    ? lessons.find((lesson) => !access.progress.some(
        (item) => item.lesson_id === lesson.id && item.completed,
      ))
    : undefined;

  return (
    <section className="min-h-[70vh] bg-[#071A34] px-5 py-8 text-white" aria-label="ABBA Academy">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-wide text-[#D9BD81]">ABBA Academy</h1>
          <button type="button" onClick={() => {
            if (selectedLesson) setSelectedLesson(null);
            else if (selectedCourse) setSelectedCourse(null);
            else onBack();
          }} className="rounded-lg border border-[#365D87] px-3 py-2 text-sm text-white hover:bg-[#102A4A]"
            aria-label={L(language, "Go back", "Regresar", "Voltar")}>
            {L(language, "Back", "Regresar", "Voltar")}
          </button>
        </div>
        {loading && access.status === "unavailable" ? (
          <p role="status" className="text-slate-200">
            {L(language, "Checking your Academy access…", "Verificando tu acceso a la Academia…", "Verificando seu acesso à Academia…")}
          </p>
        ) : access.status === "unavailable" ? (
          <div className="rounded-2xl border border-[#365D87] bg-[#102A4A] p-6">
            <GraduationCap className="mb-4 h-10 w-10 text-[#D9BD81]" aria-hidden="true" />
            <h2 className="text-xl font-semibold">
              {L(language, "Academy connection pending", "Conexión con la Academia pendiente", "Conexão com a Academia pendente")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              {L(language,
                "Your lessons will appear here once secure enrollment verification is enabled. No additional password is required on this screen.",
                "Tus clases aparecerán aquí cuando se active la verificación segura de inscripción. No se requiere otra contraseña en esta pantalla.",
                "Suas aulas aparecerão aqui quando a verificação segura da matrícula for ativada. Nenhuma outra senha é necessária nesta tela.")}
            </p>
            <button type="button" onClick={() => setRetry((value) => value + 1)}
              className="mt-5 rounded-lg border border-[#D9BD81] px-4 py-2 text-sm text-[#D9BD81]">
              {L(language, "Try again", "Intentar de nuevo", "Tentar novamente")}
            </button>
          </div>
        ) : access.status === "link_required" ? (
          <div role="status" className="rounded-2xl border border-[#365D87] bg-[#102A4A] p-6">
            <GraduationCap className="mb-4 h-10 w-10 text-[#D9BD81]" aria-hidden="true" />
            <h2 className="text-xl font-semibold">
              {L(language, "Connect your Academy account", "Conecta tu cuenta de la Academia", "Conecte sua conta da Academia")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              {L(language,
                "Your Prayer & Fire session is active. Your Academy account has not been securely linked yet. If you are enrolled, contact Academy support to verify the connection. No second sign-in or payment is needed here.",
                "Tu sesión de Prayer & Fire está activa. Tu cuenta de la Academia todavía no está vinculada de forma segura. Si ya estás inscrito, solicita a soporte de la Academia que verifique la conexión. Aquí no necesitas iniciar sesión de nuevo ni pagar.",
                "Sua sessão do Prayer & Fire está ativa. Sua conta da Academia ainda não foi vinculada com segurança. Se já está matriculado, solicite à equipe da Academia a verificação da conexão. Não é necessário entrar novamente nem pagar aqui.")}
            </p>
            {prayerFireAccountId && (
              <div className="mt-5 rounded-lg border border-[#365D87] p-3">
                <p className="mb-2 text-xs text-slate-300">
                  {L(language,
                    "Prayer & Fire account reference for verified Academy support",
                    "Referencia de tu cuenta Prayer & Fire para el soporte autorizado de la Academia",
                    "Referência da sua conta Prayer & Fire para o suporte autorizado da Academia")}
                </p>
                <input readOnly value={prayerFireAccountId} aria-label={L(language, "Account reference", "Referencia de cuenta", "Referência da conta")}
                  className="w-full rounded bg-[#071A34] px-2 py-2 text-xs text-white" onFocus={(event) => event.currentTarget.select()} />
                <button type="button"
                  className="mt-2 rounded-lg border border-[#D9BD81] px-3 py-2 text-xs text-[#D9BD81]"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(prayerFireAccountId);
                      setAccountIdCopied(true);
                    } catch {
                      setAccountIdCopied(false);
                    }
                  }}>
                  {accountIdCopied
                    ? L(language, "Copied", "Copiado", "Copiado")
                    : L(language, "Copy account reference", "Copiar referencia", "Copiar referência")}
                </button>
              </div>
            )}
            <button type="button" onClick={() => setRetry((value) => value + 1)}
              className="mt-5 rounded-lg border border-[#D9BD81] px-4 py-2 text-sm text-[#D9BD81]">
              {L(language, "Check again", "Verificar de nuevo", "Verificar novamente")}
            </button>
          </div>
        ) : access.status === "not_enrolled" ? (
          <div className="rounded-2xl border border-[#365D87] bg-[#102A4A] p-6">
            <h2 className="text-xl font-semibold">{L(language, "Academy courses", "Cursos de la Academia", "Cursos da Academia")}</h2>
            <p className="mt-3 text-sm text-slate-200">
              {L(language, "You do not have an active enrollment. Enrollment is managed on the Academy website, not inside this app.",
                "No tienes una inscripción activa. Las inscripciones se gestionan en el website de la Academia, no dentro del app.",
                "Você não tem uma matrícula ativa. As inscrições são gerenciadas no site da Academia, não no aplicativo.")}
            </p>
            {courses.map((course) => (
              <div key={course.id} className="mt-4 rounded-lg border border-[#365D87] p-4">
                <h3 className="font-semibold text-[#D9BD81]">{course.title}</h3>
                <p className="mt-1 text-sm text-slate-200">{course.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {!activeCourse ? (
              <>
                <h2 className="mb-4 text-lg font-semibold">{L(language, "My courses", "Mis cursos", "Meus cursos")}</h2>
                {courses.length === 0 && (
                  <p role="status" className="rounded-xl border border-[#365D87] p-4 text-sm text-slate-200">
                    {L(language, "No courses are available yet.", "Todavía no hay cursos disponibles.", "Ainda não há cursos disponíveis.")}
                  </p>
                )}
                {courses.map((course) => (
                  <button key={course.id} type="button" onClick={() => setSelectedCourse(course.id)}
                    className="mb-3 block w-full rounded-xl border border-[#365D87] bg-[#102A4A] p-5 text-left">
                    <span className="block font-semibold text-[#D9BD81]">{course.title}</span>
                    <span className="mt-1 block text-sm text-slate-200">{course.description}</span>
                  </button>
                ))}
              </>
            ) : (
              <>
                <button type="button" onClick={() => { setSelectedCourse(null); setSelectedLesson(null); }}
                  className="mb-4 text-sm text-[#D9BD81]">
                  {L(language, "All courses", "Todos los cursos", "Todos os cursos")}
                </button>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">{activeCourse.title}</h2>
                  <button type="button" disabled={loading}
                    onClick={() => setRetry((value) => value + 1)}
                    aria-label={L(language, "Refresh course and progress", "Actualizar curso y progreso", "Atualizar curso e progresso")}
                    className="rounded-lg border border-[#D9BD81] px-3 py-2 text-xs text-[#D9BD81] disabled:opacity-50">
                    {loading
                      ? L(language, "Updating…", "Actualizando…", "Atualizando…")
                      : L(language, "Refresh", "Actualizar", "Atualizar")}
                  </button>
                </div>
                <p className="my-3 text-sm text-slate-200">
                  {L(language, "Completed", "Completado", "Concluído")}: {percent}%
                  {" · "}
                  {lessons.filter((lesson) => access.status === "enrolled" &&
                    access.progress.some((item) => item.lesson_id === lesson.id && item.completed)).length}
                  /{lessons.length} {L(language, "lessons", "lecciones", "aulas")}
                </p>
                {!activeLesson && nextStudyLesson && (
                  <button type="button" onClick={() => setSelectedLesson(nextStudyLesson.id)}
                    className="mb-5 rounded-lg bg-[#D9BD81] px-4 py-3 text-sm font-semibold text-[#071A34]">
                    {L(language, "Continue studying", "Continuar estudiando", "Continuar estudando")}
                    {" · "}{L(language, "Lesson", "Lección", "Aula")} {nextStudyLesson.lesson_number}
                  </button>
                )}
                {!activeLesson && lessons.length > 0 && !nextStudyLesson && (
                  <p role="status" className="mb-5 rounded-lg border border-[#D9BD81] p-3 text-sm text-[#D9BD81]">
                    {L(language,
                      "All available lessons completed. You can select any lesson to review.",
                      "Completaste todas las lecciones disponibles. Puedes seleccionar cualquiera para repasarla.",
                      "Você concluiu todas as aulas disponíveis. Selecione uma aula para revisar.")}
                  </p>
                )}
                <div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}
                  aria-label={L(language, "Course progress", "Progreso del curso", "Progresso do curso")}
                  className="mb-5 h-2 overflow-hidden rounded-full bg-[#365D87]">
                  <div className="h-full bg-[#D9BD81]" style={{ width: `${percent}%` }} />
                </div>
                {lessons.length === 0 && (
                  <p role="status" className="rounded-xl border border-[#365D87] p-4 text-sm text-slate-200">
                    {L(language, "There are no available lessons in this course yet.",
                      "Todavía no hay lecciones disponibles en este curso.",
                      "Ainda não há aulas disponíveis neste curso.")}
                  </p>
                )}
                {activeLesson ? (
                  <div className="rounded-xl border border-[#365D87] bg-[#102A4A] p-5">
                    <button type="button" onClick={() => setSelectedLesson(null)} className="mb-4 text-sm text-[#D9BD81]">
                      {L(language, "All lessons", "Todas las lecciones", "Todas as aulas")}
                    </button>
                    <p className="text-xs text-[#D9BD81]">{L(language, "Lesson", "Lección", "Aula")} {activeLesson.lesson_number}</p>
                    <h3 className="mt-1 text-xl font-semibold">{activeLesson.title}</h3>
                    {activeLesson.description && <p className="mt-3 text-sm text-slate-200">{activeLesson.description}</p>}
                    {activeLesson.summary && (
                      <div className="mt-5">
                        <h4 className="mb-2 font-semibold text-[#D9BD81]">
                          {L(language, "Lesson summary", "Resumen de la lección", "Resumo da aula")}
                        </h4>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{activeLesson.summary}</p>
                      </div>
                    )}
                    <p className="mt-5 text-sm text-slate-200">
                      {lessonProgress?.completed ? L(language, "Completed", "Completada", "Concluída") : L(language, "Not completed", "Pendiente", "Pendente")}
                    </p>
                    {!lessonProgress?.completed && (
                      <div className="mt-3">
                        <button type="button" disabled={savingCompletion} onClick={async () => {
                          setSavingCompletion(true);
                          setCompletionError(false);
                          try {
                            const saved = await completeAcademyLesson(activeLesson.id);
                            if (saved) setRetry(n => n + 1);
                            else setCompletionError(true);
                          } finally {
                            setSavingCompletion(false);
                          }
                        }}
                          className="rounded-lg border border-[#D9BD81] px-4 py-2 text-sm font-semibold text-[#D9BD81] disabled:opacity-50">
                          {savingCompletion
                            ? L(language, "Saving…", "Guardando…", "Salvando…")
                            : L(language, "Mark lesson complete", "Marcar lección como completada", "Marcar aula como concluída")}
                        </button>
                        {completionError && <p role="alert" className="mt-2 text-sm text-slate-200">
                          {L(language,
                            "Progress could not be saved. Check your connection or enrollment and try again.",
                            "No se pudo guardar el progreso. Verifica tu conexión o inscripción e inténtalo nuevamente.",
                            "Não foi possível salvar seu progresso. Verifique a conexão ou matrícula e tente novamente.")}
                        </p>}
                      </div>
                    )}
                    {lessonProgress && lessonProgress.last_position_seconds > 0 && (
                      <p className="mt-2 text-xs text-slate-300">
                        {L(language, "Saved playback position", "Posición guardada", "Posição salva")}:
                        {" "}{Math.floor(lessonProgress.last_position_seconds / 60)}:{String(Math.floor(lessonProgress.last_position_seconds % 60)).padStart(2, "0")}
                      </p>
                    )}
                    <nav className="mt-5 flex flex-wrap gap-3" aria-label="Lesson navigation">
                      {previousLesson && <button type="button" onClick={() => setSelectedLesson(previousLesson.id)} className="rounded-lg border border-[#D9BD81] px-4 py-2 text-sm text-[#D9BD81]">
                        {L(language, "Previous lesson", "Lección anterior", "Aula anterior")}
                      </button>}
                      {nextLesson && <button type="button" onClick={() => setSelectedLesson(nextLesson.id)} className="rounded-lg border border-[#D9BD81] px-4 py-2 text-sm text-[#D9BD81]">
                        {L(language, "Next lesson", "Siguiente lección", "Próxima aula")}
                      </button>}
                    </nav>
                    <p className="mt-5 rounded-lg border border-[#365D87] p-3 text-xs text-slate-300">
                      {L(language,
                        "Video, audio and activities will appear after the secure lesson service is connected.",
                        "Los videos, audios y actividades aparecerán cuando se conecte el servicio seguro de lecciones.",
                        "Vídeos, áudios e atividades aparecerão após a conexão segura das aulas.")}
                    </p>
                  </div>
                ) : lessons.map((lesson) => (
                  <button type="button" onClick={() => setSelectedLesson(lesson.id)}
                    key={lesson.id} className="mb-3 block w-full rounded-xl border border-[#365D87] bg-[#102A4A] p-4 text-left">
                    <span className="text-xs text-[#D9BD81]">
                      {L(language, "Lesson", "Lección", "Aula")} {lesson.lesson_number}
                    </span>
                    <h3 className="font-semibold">{lesson.title}</h3>
                    {lesson.duration_minutes !== null && (
                      <p className="mt-1 text-xs text-slate-300">
                        {lesson.duration_minutes} {L(language, "min", "min", "min")}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-slate-200">{lesson.description}</p>
                    <span className="mt-2 block text-xs text-slate-300">
                      {access.progress.some((item) => item.lesson_id === lesson.id && item.completed)
                        ? L(language, "Completed", "Completada", "Concluída")
                        : L(language, "Not completed", "Pendiente", "Pendente")}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
