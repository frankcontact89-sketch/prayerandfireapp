/**
 * Native ABBA Academy data contract.
 *
 * The ministry-websites Supabase project owns enrollment, lessons and progress.
 * Do not query its private tables with the Prayer & Fire project's JWT or with
 * a service-role key bundled in the iOS app. A server-side identity bridge must
 * authenticate the Prayer & Fire user and authorize their Academy enrollment.
 */
export type AcademyCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  total_lessons: number;
};

export type AcademyLesson = {
  id: string;
  course_id: string;
  lesson_number: number;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  summary: string | null;
  videos: unknown;
  attachments: unknown;
};

export type AcademyProgress = {
  lesson_id: string;
  completed: boolean;
  watched_seconds: number;
  last_position_seconds: number;
  completed_at: string | null;
};

export type AcademyAccess =
  | { status: "unavailable" }
  | { status: "not_enrolled"; courses: AcademyCourse[] }
  | { status: "enrolled"; courses: AcademyCourse[]; lessons: AcademyLesson[]; progress: AcademyProgress[] };

/** Never infer enrollment from matching email addresses or a locally stored flag. */
export function canOpenAcademyLesson(
  access: AcademyAccess,
  lessonId: string,
): boolean {
  return access.status === "enrolled" &&
    access.lessons.some((lesson) => lesson.id === lessonId);
}

export function academyCompletionPercent(
  lessons: AcademyLesson[],
  progress: AcademyProgress[],
): number {
  if (lessons.length === 0) return 0;
  const completedIds = new Set(progress.filter((item) => item.completed).map((item) => item.lesson_id));
  const completedCount = lessons.filter((lesson) => completedIds.has(lesson.id)).length;
  return Math.round((completedCount / lessons.length) * 100);
}
