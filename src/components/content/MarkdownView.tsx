import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { localizeBibleRefs } from "@/lib/localize-bible-refs";
import {
  linkifyBibleRefs,
  parseBibleRefHref,
  useOpenBibleRef,
} from "@/lib/bible-refs";

interface Props {
  text: string;
  language: string;
  className?: string;
}

// Renders authored content as real markdown (##, **, lists, links...) with
// the app's dark aesthetic. Also localizes English Bible book names into ES/PT
// when the app language is set to those.
export function MarkdownView({ text, language, className }: Props) {
  const openRef = useOpenBibleRef();
  const processed = useMemo(() => {
    const localized = localizeBibleRefs(text || "", language);
    return linkifyBibleRefs(localized, language);
  }, [text, language]);
  if (!processed) return null;
  return (
    <div className={`prose prose-invert max-w-none text-zinc-200 leading-relaxed ${className || ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (p) => <h1 className="text-2xl font-extrabold text-white mt-4 mb-2" {...p} />,
          h2: (p) => <h2 className="text-xl font-bold text-white mt-4 mb-2" {...p} />,
          h3: (p) => <h3 className="text-lg font-bold text-orange-400 mt-3 mb-1" {...p} />,
          h4: (p) => <h4 className="text-base font-bold text-orange-400 mt-3 mb-1" {...p} />,
          p:  (p) => <p className="text-zinc-200 leading-relaxed my-2" {...p} />,
          strong: (p) => <strong className="text-white font-bold" {...p} />,
          em: (p) => <em className="text-zinc-100 italic" {...p} />,
          ul: (p) => <ul className="list-disc pl-5 my-2 space-y-1 text-zinc-200" {...p} />,
          ol: (p) => <ol className="list-decimal pl-5 my-2 space-y-1 text-zinc-200" {...p} />,
          li: (p) => <li className="text-zinc-200" {...p} />,
          blockquote: (p) => (
            <blockquote className="border-l-2 border-orange-500/60 pl-3 my-3 text-zinc-300 italic" {...p} />
          ),
          a: ({ href, children, ...rest }: any) => {
            const parsed = parseBibleRefHref(href || "");
            if (parsed && openRef) {
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openRef(parsed);
                  }}
                  className="text-orange-400 underline decoration-orange-400/60 underline-offset-2 hover:text-orange-300 font-semibold"
                >
                  {children}
                </button>
              );
            }
            return (
              <a
                className="text-orange-400 underline"
                target="_blank"
                rel="noreferrer"
                href={href}
                {...rest}
              >
                {children}
              </a>
            );
          },
          code: (p) => <code className="bg-zinc-900 rounded px-1 py-0.5 text-orange-300 text-[0.9em]" {...p} />,
          hr: () => <hr className="my-4 border-zinc-800" />,
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}