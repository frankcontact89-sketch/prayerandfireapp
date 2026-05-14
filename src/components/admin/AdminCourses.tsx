import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Upload, Plus, GraduationCap } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_label: string | null;
  link_url: string | null;
  link_type: string;
  price: number | null;
  is_active: boolean;
  order_index: number;
}

const LINK_TYPES = [
  { value: "external", label: "External Link", defaultBtn: "Learn More" },
  { value: "internal", label: "Internal Course", defaultBtn: "Open Course" },
  { value: "stripe", label: "Stripe Payment", defaultBtn: "Buy Now" },
];

export function AdminCourses({ t }: { t: (en: string, es: string) => string }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const empty = {
    title: "",
    description: "",
    image_url: "",
    button_label: "Learn More",
    link_url: "",
    link_type: "external",
    price: "",
    order_index: 0,
  };
  const [form, setForm] = useState(empty);
  const { toast } = useToast();

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("order_index", { ascending: true });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setCourses((data as Course[]) || []);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: t("Please select an image", "Selecciona una imagen"), variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: t("Max 5MB", "Máx 5MB"), variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `courses/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm({ ...form, image_url: publicUrl });
      toast({ title: t("Image uploaded", "Imagen subida") });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast({ title: "Error", description: t("Title required", "Título requerido"), variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      button_label: form.button_label || null,
      link_url: form.link_url || null,
      link_type: form.link_type,
      price: form.price ? Number(form.price) : null,
      order_index: Number(form.order_index) || 0,
      is_active: true,
    };
    const { error } = editing
      ? await supabase.from("courses").update(payload).eq("id", editing.id)
      : await supabase.from("courses").insert([payload]);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editing ? t("Course updated", "Curso actualizado") : t("Course added", "Curso agregado") });
      setOpen(false); setEditing(null); setForm(empty); fetchCourses();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("Delete this course?", "¿Eliminar este curso?"))) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: t("Deleted", "Eliminado") }); fetchCourses(); }
  };

  const openEdit = (c: Course) => {
    setEditing(c);
    setForm({
      title: c.title,
      description: c.description || "",
      image_url: c.image_url || "",
      button_label: c.button_label || "",
      link_url: c.link_url || "",
      link_type: c.link_type,
      price: c.price?.toString() || "",
      order_index: c.order_index,
    });
    setOpen(true);
  };

  if (loading) return <div className="text-center p-4">{t("Loading", "Cargando")}...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="w-6 h-6" /> {t("Manage Courses", "Gestionar Cursos")}
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm(empty); }}>
              <Plus className="w-4 h-4 mr-1" />{t("Add Course", "Agregar Curso")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? t("Edit Course", "Editar Curso") : t("New Course", "Nuevo Curso")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input placeholder={t("Title", "Título") + " *"} value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Textarea placeholder={t("Description", "Descripción")} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />

              <div className="space-y-2">
                <input type="file" ref={fileRef} accept="image/*" onChange={handleUpload} className="hidden" />
                <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? t("Uploading...", "Subiendo...") : t("Upload Image", "Subir Imagen")}
                </Button>
                {form.image_url && (
                  <div className="flex items-center gap-2">
                    <img src={form.image_url} alt="" className="w-20 h-20 rounded object-cover" />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setForm({ ...form, image_url: "" })}>
                      <Trash2 className="w-4 h-4 mr-1" /> Remove
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t("Link type", "Tipo de enlace")}</label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.link_type}
                  onChange={(e) => {
                    const lt = LINK_TYPES.find((l) => l.value === e.target.value)!;
                    setForm({ ...form, link_type: lt.value, button_label: form.button_label || lt.defaultBtn });
                  }}>
                  {LINK_TYPES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>

              <Input placeholder={t("Link URL", "URL del enlace")} value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })} />

              <Input placeholder={t("Button label", "Etiqueta del botón")} value={form.button_label}
                onChange={(e) => setForm({ ...form, button_label: e.target.value })} />

              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder={t("Price (optional)", "Precio (opcional)")} value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })} />
                <Input type="number" placeholder={t("Order", "Orden")} value={form.order_index}
                  onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) || 0 })} />
              </div>

              <Button type="submit" className="w-full">
                {editing ? t("Update", "Actualizar") : t("Add Course", "Agregar Curso")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {courses.length === 0 ? (
          <div className="text-center text-muted-foreground p-6">
            {t("No courses yet.", "Sin cursos aún.")}
          </div>
        ) : courses.map((c) => (
          <div key={c.id} className="border border-border rounded-lg p-4 flex justify-between items-start gap-3">
            <div className="flex gap-3 flex-1 min-w-0">
              {c.image_url ? (
                <img src={c.image_url} alt={c.title} className="w-16 h-16 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{c.title}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                    {LINK_TYPES.find((l) => l.value === c.link_type)?.label}
                  </span>
                  {c.button_label && <span className="text-xs text-muted-foreground">{c.button_label}</span>}
                </div>
                {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => openEdit(c)}><Edit className="w-4 h-4" /></Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}