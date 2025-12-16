import React, { useState } from "react";
import CourseCard, { Course } from "@/components/CourseCard";

interface CoursesScreenProps {
  t: (key: string) => string;
  onBack: () => void;
}

export default function CoursesScreen({ t, onBack }: CoursesScreenProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Course | null>(null);

  const courses: Course[] = [
    {
      id: "imersion",
      title: "Imersão",
      price: 60,
      description:
        "Accede a todos nuestros cursos espirituales incluyendo módulos sobre ayuno, oración, adoración y más...",
      category: "Other",
      checkoutUrl: "PON_AQUI_TU_LINK_DE_STRIPE",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-muted/20 text-foreground"
          >
            ←
          </button>
          <h1 className="text-2xl font-bold">{t("myCourses")}</h1>
        </div>

        {courses.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            onOpenDetails={(course) => {
              setSelected(course);
              setOpen(true);
            }}
          />
        ))}

        {/* Modal de detalles */}
        {open && selected ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-border/10 bg-background p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-bold text-foreground">{selected.title}</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-1 text-muted-foreground hover:bg-muted/10"
                >
                  ✕
                </button>
              </div>

              <div className="mt-2 text-3xl font-extrabold text-primary">
                ${Number(selected.price).toFixed(0)}
              </div>

              <div className="mt-4">
                <div className="text-sm font-semibold text-foreground/80">Description</div>
                <p className="mt-2 text-sm text-muted-foreground">{selected.description}</p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  className="rounded-xl border border-primary/40 bg-transparent px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10"
                  onClick={() => alert("Added to cart ✅")}
                >
                  Add to Cart
                </button>

                {selected.checkoutUrl ? (
                  <a
                    href={selected.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Buy Now
                  </a>
                ) : (
                  <button disabled className="rounded-xl bg-muted/10 px-4 py-3 text-sm font-semibold text-muted-foreground/40">
                    Buy Now
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
