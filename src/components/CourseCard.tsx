import React from "react";

type Course = {
  id: string;
  title: string;
  price: number;
  description: string;
  category?: string;
  imageUrl?: string;
  checkoutUrl?: string;
  detailsUrl?: string;
};

type Props = {
  course: Course;
  onOpenDetails: (course: Course) => void;
};

export default function CourseCard({ course, onOpenDetails }: Props) {
  return (
    <div className="rounded-2xl border border-border/10 bg-card/5 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {course.category ? (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary-foreground">
                {course.category}
              </span>
            ) : null}
          </div>

          <h3 className="mt-3 text-xl font-semibold text-foreground">{course.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{course.description}</p>

          <div className="mt-4 text-2xl font-bold text-primary">
            ${Number(course.price).toFixed(2)}
          </div>
        </div>

        <div className="shrink-0">
          {course.imageUrl ? (
            <img
              src={course.imageUrl}
              alt={course.title}
              className="h-20 w-20 rounded-xl object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-background/40 text-2xl">
              🔥
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => onOpenDetails(course)}
          className="w-full rounded-xl border border-primary/40 bg-transparent px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10"
        >
          View
        </button>
      </div>
    </div>
  );
}

export type { Course };
