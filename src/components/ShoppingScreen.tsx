import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, GraduationCap, ExternalLink } from "lucide-react";

interface ShoppingScreenProps {
  t: (en: string, es: string) => string;
}

export function ShoppingScreen({ t }: ShoppingScreenProps) {
  const books = [
    {
      title: t("The Power of Prayer", "El Poder de la Oración"),
      description: t("Discover the transformative power of prayer in your daily life", "Descubre el poder transformador de la oración en tu vida diaria"),
      price: "$15.99",
      image: "📖",
      link: "#"
    },
    {
      title: t("Walking in Fire", "Caminando en Fuego"),
      description: t("A guide to living a Spirit-filled life", "Una guía para vivir una vida llena del Espíritu"),
      price: "$19.99",
      image: "📖",
      link: "#"
    }
  ];

  const courses = [
    {
      title: t("Foundations of Faith", "Fundamentos de la Fe"),
      description: t("8-week course on Christian basics", "Curso de 8 semanas sobre los fundamentos cristianos"),
      price: "$49.99",
      image: "🎓",
      link: "#"
    },
    {
      title: t("Prayer Ministry Training", "Entrenamiento en Ministerio de Oración"),
      description: t("Learn to lead powerful prayer sessions", "Aprende a dirigir sesiones poderosas de oración"),
      price: "$79.99",
      image: "🎓",
      link: "#"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-foreground">
          {t("Shopping", "Tienda")}
        </h2>
        <p className="text-muted-foreground">
          {t("Books and courses to grow your faith", "Libros y cursos para crecer en tu fe")}
        </p>
      </div>

      {/* Books Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Book className="w-6 h-6 text-primary" />
          <h3 className="text-2xl font-bold text-foreground">
            {t("Books", "Libros")}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {books.map((book, index) => (
            <Card key={index} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-2">{book.image}</div>
              <h4 className="text-xl font-bold text-foreground">{book.title}</h4>
              <p className="text-sm text-muted-foreground">{book.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">{book.price}</span>
                <Button onClick={() => window.open(book.link, "_blank")}>
                  {t("Buy Now", "Comprar Ahora")}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          <h3 className="text-2xl font-bold text-foreground">
            {t("Courses", "Cursos")}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((course, index) => (
            <Card key={index} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-2">{course.image}</div>
              <h4 className="text-xl font-bold text-foreground">{course.title}</h4>
              <p className="text-sm text-muted-foreground">{course.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">{course.price}</span>
                <Button onClick={() => window.open(course.link, "_blank")}>
                  {t("Enroll Now", "Inscribirse Ahora")}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
