import React, { useEffect, useState } from "react";
import { Heart, StickyNote, Share2, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { L } from "./lang";
import { APP_CONFIG } from "@/config/constants";
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
  shareText?: string;
  language: string;
}

export function ContentActions({ itemType, itemId, title, shareText, language }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);
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
      const [{ data: fav }, { data: note }] = await Promise.all([
        supabase.from("favorites").select("id")
          .eq("user_id", uid).eq("item_type", itemType).eq("item_id", itemId).maybeSingle(),
        supabase.from("user_notes").select("id, content")
          .eq("user_id", uid).eq("item_type", itemType).eq("item_id", itemId).maybeSingle(),
      ]);
      setIsFav(!!fav);
      if (note) { setNoteId(note.id); setNoteContent(note.content || ""); }
    })();
  }, [itemType, itemId]);

  const requireAuth = () => {
    if (!userId) {
      toast({
        title: L(language, "Sign in required", "Inicia sesión", "Faça login"),
        description: L(language,
          "Sign in to save favorites and notes.",
          "Inicia sesión para guardar favoritos y notas.",
          "Faça login para salvar favoritos e notas."),
      });
      return false;
    }
    return true;
  };

  const toggleFav = async () => {
    if (!requireAuth()) return;
    if (isFav) {
      await supabase.from("favorites").delete()
        .eq("user_id", userId!).eq("item_type", itemType).eq("item_id", itemId);
      setIsFav(false);
      toast({ title: L(language, "Removed from favorites", "Eliminado de favoritos", "Removido dos favoritos") });
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: userId!, item_type: itemType, item_id: itemId,
      });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      setIsFav(true);
      toast({ title: L(language, "Saved to favorites", "Guardado en favoritos", "Salvo nos favoritos") });
    }
  };

  const saveNote = async () => {
    if (!requireAuth()) return;
    setSaving(true);
    try {
      if (noteId) {
        await supabase.from("user_notes").update({ content: noteContent })
          .eq("id", noteId);
      } else {
        const { data, error } = await supabase.from("user_notes").insert({
          user_id: userId!, item_type: itemType, item_id: itemId, content: noteContent,
        }).select("id").maybeSingle();
        if (error) throw error;
        if (data?.id) setNoteId(data.id);
      }
      toast({ title: L(language, "Note saved", "Nota guardada", "Nota salva") });
      setNoteOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const share = async () => {
    const text = `${title}\n\n${shareText || ""}\n${APP_CONFIG.URL}`.trim();
    try {
      if ((navigator as any).share) await (navigator as any).share({ title, text });
      else {
        await navigator.clipboard.writeText(text);
        toast({ title: L(language, "Copied", "Copiado", "Copiado") });
      }
    } catch {}
  };

  const Btn = ({ onClick, active, icon, label }: any) => (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition ${
        active
          ? "border-orange-500 bg-orange-500/10 text-orange-400"
          : "border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );

  return (
    <>
      <div className="mt-6 grid grid-cols-3 gap-2">
        <Btn
          onClick={toggleFav}
          active={isFav}
          icon={<Heart className={`w-4 h-4 ${isFav ? "fill-orange-400" : ""}`} />}
          label={isFav
            ? L(language, "Saved", "Guardado", "Salvo")
            : L(language, "Save", "Guardar", "Salvar")}
        />
        <Btn
          onClick={() => { if (requireAuth()) setNoteOpen(true); }}
          active={!!noteContent}
          icon={<StickyNote className="w-4 h-4" />}
          label={noteContent
            ? L(language, "Edit note", "Editar nota", "Editar nota")
            : L(language, "Add note", "Agregar nota", "Adicionar nota")}
        />
        <Btn
          onClick={share}
          icon={<Share2 className="w-4 h-4" />}
          label={L(language, "Share", "Compartir", "Compartilhar")}
        />
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
            placeholder={L(language, "Write your thoughts…", "Escribe tus pensamientos…", "Escreva seus pensamentos…")}
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