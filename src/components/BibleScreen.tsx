import React from "react";
import { BookOpen } from "lucide-react";

interface BibleScreenProps {
  t: (key: string) => string;
}

const verses = [
  { ref: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { ref: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." },
  { ref: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me." },
  { ref: "Proverbs 3:5-6", text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths." },
  { ref: "Isaiah 40:31", text: "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint." },
  { ref: "Jeremiah 29:11", text: "For I know the thoughts that I think toward you, saith the Lord, thoughts of peace, and not of evil, to give you an expected end." },
  { ref: "Romans 8:28", text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
  { ref: "Joshua 1:9", text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest." },
  { ref: "Matthew 11:28", text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest." },
  { ref: "Psalm 46:10", text: "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth." },
];

export function BibleScreen({ t }: BibleScreenProps) {
  return (
    <div className="max-w-2xl mx-auto px-5 pt-6 pb-12 space-y-4 animate-fade-in">
      <header className="text-center mb-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 mb-3">
          <BookOpen className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Bible</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verses from the King James Version to encourage your faith.
        </p>
      </header>

      {verses.map((v) => (
        <article
          key={v.ref}
          className="rounded-2xl bg-card border border-border p-5 hover:border-primary/40 transition"
        >
          <p className="text-[15px] text-foreground/90 italic leading-relaxed">
            "{v.text}"
          </p>
          <p className="text-sm text-primary font-semibold mt-3">— {v.ref} (KJV)</p>
        </article>
      ))}
    </div>
  );
}
