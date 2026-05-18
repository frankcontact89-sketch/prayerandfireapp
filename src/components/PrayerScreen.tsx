import React from "react";
import { HandHeart } from "lucide-react";

interface PrayerScreenProps {
  t: (key: string) => string;
}

const prayers = [
  {
    title: "Morning Prayer",
    body:
      "Heavenly Father, thank You for the gift of this new day. I surrender my heart, mind, and steps to You. Fill me with Your Spirit, guide my words, and let every action bring honor to Your name. Strengthen my faith, soften my heart, and open my eyes to the people I can serve today. In Jesus' name, amen.",
  },
  {
    title: "Prayer for Strength",
    body:
      "Lord, I come to You weary and in need of Your strength. When fear rises, remind me that You are near. When I feel weak, be my courage. Renew my mind with Your promises and lift me on wings like eagles. I trust that Your grace is sufficient for me, for Your power is made perfect in weakness. In Jesus' name, amen.",
  },
  {
    title: "Evening Prayer",
    body:
      "Father, as this day comes to a close, I thank You for every breath, every blessing, and every lesson. Forgive me where I fell short, and heal what is broken in me. Quiet my heart, calm my thoughts, and let me rest in Your peace. Watch over my loved ones tonight, and prepare me for tomorrow. In Jesus' name, amen.",
  },
  {
    title: "Prayer for Family",
    body:
      "Lord, I lift my family before You. Cover each one with Your protection, peace, and love. Heal old wounds, restore broken places, and let Christ be the center of our home. May we grow together in faith, kindness, and unity. In Jesus' name, amen.",
  },
];

export function PrayerScreen({ t }: PrayerScreenProps) {
  return (
    <div className="max-w-2xl mx-auto px-5 pt-6 pb-12 space-y-5 animate-fade-in">
      <header className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 mb-3">
          <HandHeart className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Prayers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A quiet place to pray, reflect, and draw near to God.
        </p>
      </header>

      {prayers.map((p) => (
        <article
          key={p.title}
          className="rounded-2xl bg-card border border-border p-5 hover:border-primary/40 transition"
        >
          <h2 className="text-base font-bold text-foreground mb-2">{p.title}</h2>
          <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
            {p.body}
          </p>
        </article>
      ))}
    </div>
  );
}
