import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  is_live: boolean;
  is_active: boolean;
  category?: string;
}

export function AdminVideos({ t }: { t: (en: string, es: string) => string }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    category: "",
    is_live: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("app_videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading videos", variant: "destructive" });
    } else {
      setVideos(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingVideo) {
      const { error } = await supabase
        .from("app_videos")
        .update(formData)
        .eq("id", editingVideo.id);

      if (error) {
        toast({ title: "Error updating video", variant: "destructive" });
      } else {
        toast({ title: "Video updated successfully" });
        resetForm();
        fetchVideos();
      }
    } else {
      const { error } = await supabase
        .from("app_videos")
        .insert([formData]);

      if (error) {
        toast({ title: "Error creating video", variant: "destructive" });
      } else {
        toast({ title: "Video created successfully" });
        resetForm();
        fetchVideos();
      }
    }
  };

  const resetForm = () => {
    setIsOpen(false);
    setEditingVideo(null);
    setFormData({
      title: "",
      description: "",
      video_url: "",
      thumbnail_url: "",
      category: "",
      is_live: false
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("app_videos")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error deleting video", variant: "destructive" });
    } else {
      toast({ title: "Video deleted successfully" });
      fetchVideos();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("Manage Videos", "Administrar Videos")}</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              {t("Add Video", "Agregar Video")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? t("Edit Video", "Editar Video") : t("Add Video", "Agregar Video")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder={t("Title", "Título")}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Textarea
                placeholder={t("Description", "Descripción")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Input
                placeholder="Video URL"
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                required
              />
              <Input
                placeholder={t("Thumbnail URL", "URL de Miniatura")}
                type="url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              />
              <Input
                placeholder={t("Category", "Categoría")}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_live}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_live: checked })}
                />
                <label>{t("Live Stream", "Transmisión en Vivo")}</label>
              </div>
              <Button type="submit" className="w-full">
                {editingVideo ? t("Update", "Actualizar") : t("Create", "Crear")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Title", "Título")}</TableHead>
              <TableHead>{t("Category", "Categoría")}</TableHead>
              <TableHead>{t("Type", "Tipo")}</TableHead>
              <TableHead>{t("Status", "Estado")}</TableHead>
              <TableHead>{t("Actions", "Acciones")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video.id}>
                <TableCell className="font-medium">{video.title}</TableCell>
                <TableCell>{video.category || "-"}</TableCell>
                <TableCell>
                  {video.is_live && (
                    <span className="flex items-center gap-1 text-destructive">
                      <Play className="w-3 h-3" />
                      {t("Live", "En Vivo")}
                    </span>
                  )}
                  {!video.is_live && t("Video", "Video")}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${video.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {video.is_active ? t("Active", "Activo") : t("Inactive", "Inactivo")}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingVideo(video);
                        setFormData({
                          title: video.title,
                          description: video.description || "",
                          video_url: video.video_url,
                          thumbnail_url: video.thumbnail_url || "",
                          category: video.category || "",
                          is_live: video.is_live
                        });
                        setIsOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(video.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
