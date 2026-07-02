import React, { useEffect, useState } from "react";
import { StickyNote, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { L } from "./lang";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export type ContentItemType =
  | "article"
  | "sola"
  | "greek_word"
  | "devotional"
  | "reading_plan";

interface Props {
  itemType: ContentItemType;
  itemId: string;
  title: string;
  language: string;
}

export function ContentActions({ itemType, itemId, language }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id || null;
      setUserId(uid);
      if (!uid) return;
      const { data: note } = await supabase
        .from("user_notes")
        .select("id, content")
        .eq("user_id", uid)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();
      if (note) {
        setNoteId(note.id);
        setNoteContent(note.content || "");
      }
    })();
  }, [itemType, itemId]);

  const requireAuth = () => {
    if (!userId) {
      toast({
        title: L(language, "Sign in required", "Inicia sesión", "Faça login"),
        description: L(
          language,
          "Sign in to add notes.",
          "Inicia sesión para agregar notas.",
          "Faça login para adicionar notas."
        ),
      });
      return false;
    }
    return true;
  };

  const saveNote = async () => {
    if (!requireAuth()) return;
    setSaving(true);
    try {
      if (noteId) {
        await supabase
          .from("user_notes")
          .update({ content: noteContent })
          .eq("id", noteId);
      } else {
        const { data, error } = await supabase
          .from("user_notes")
          .insert({
            user_id: userId!,
            item_type: itemType,
            item_id: itemId,
            content: noteContent,
          })
          .select("id")
          .maybeSingle();
        if (error) throw error;
        if (data?.id) setNoteId(data.id);
      }
      toast({
        title: L(language, "Note saved", "Nota guardada", "Nota salva"),
      });
      setNoteOpen(false);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mt-6">
        <button
          onClick={() => {
            if (requireAuth()) setNoteOpen(true);
          }}
          className={`w-full flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition ${
            noteContent
              ? "border-orange-500 bg-orange-500/10 text-orange-400"
              : "border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
          }`}
        >
          <StickyNote className="w-4 h-4" />
          <span className="truncate">
            {noteContent
              ? L(language, "Edit note", "Editar nota", "Editar nota")
              : L(language, "Add note", "Agregar nota", "Adicionar nota")}
          </span>
        </button>
      </div>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {L(language, "Your note", "Tu nota", "Sua nota")}
            </DialogTitle>
          </DialogHeader>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={6}
            placeholder={L(
              language,
              "Write your thoughts…",
              "Escribe tus pensamientos…",
              "Escreva seus pensamentos…"
            )}
            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-white focus:outline-none focus:border-orange-500"
          />
          <DialogFooter className="gap-2">
            <button
              onClick={() => setNoteOpen(false)}
              className="rounded-lg border border-zinc-700 text-zinc-300 px-4 py-2 text-sm flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              {L(language, "Cancel", "Cancelar", "Cancelar")}
            </button>
            <button
              onClick={saveNote}
              disabled={saving}
              className="rounded-lg bg-orange-500 text-black font-bold px-4 py-2 text-sm flex items-center gap-1 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {L(language, "Save note", "Guardar nota", "Salvar nota")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
