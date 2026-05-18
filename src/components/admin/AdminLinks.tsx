import React, { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit } from "lucide-react";
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

interface Link {
  id: string;
  title: string;
  url: string;
  icon?: string;
  order_index: number;
  is_active: boolean;
}

export function AdminLinks({ t }: { t: (key: string) => string }) {
  const [links, setLinks] = useState<Link[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [formData, setFormData] = useState({ title: "", url: "", icon: "" });
  const { toast } = useToast();

  const linkSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(100, "Title too long"),
    url: z.string().trim().url("Must be a valid URL").max(500, "URL too long"),
    icon: z.string().trim().max(50, "Icon name too long").optional().or(z.literal("")),
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from("app_links")
      .select("*")
      .order("order_index");

    if (error) {
      toast({ title: "Error loading links", variant: "destructive" });
    } else {
      setLinks(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = linkSchema.safeParse(formData);
    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: parsed.error.issues[0]?.message ?? "Please check the form",
        variant: "destructive",
      });
      return;
    }
    const cleanData = parsed.data;

    if (editingLink) {
      const { error } = await supabase
        .from("app_links")
        .update(cleanData)
        .eq("id", editingLink.id);

      if (error) {
        toast({ title: "Error updating link", variant: "destructive" });
      } else {
        toast({ title: "Link updated successfully" });
        setIsOpen(false);
        setEditingLink(null);
        setFormData({ title: "", url: "", icon: "" });
        fetchLinks();
      }
    } else {
      const { error } = await supabase
        .from("app_links")
        .insert([{ ...cleanData, order_index: links.length }]);

      if (error) {
        toast({ title: "Error creating link", variant: "destructive" });
      } else {
        toast({ title: "Link created successfully" });
        setIsOpen(false);
        setFormData({ title: "", url: "", icon: "" });
        fetchLinks();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("app_links")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error deleting link", variant: "destructive" });
    } else {
      toast({ title: "Link deleted successfully" });
      fetchLinks();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Links</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingLink(null); setFormData({ title: "", url: "", icon: "" }); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLink ? "Edit Link" : "Add Link"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Input
                placeholder="URL"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />
              <Input
                placeholder="Icon (optional)"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
              <Button type="submit" className="w-full">
                {editingLink ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id}>
                <TableCell className="font-medium">{link.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{link.url}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${link.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {link.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingLink(link);
                        setFormData({ title: link.title, url: link.url, icon: link.icon || "" });
                        setIsOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(link.id)}
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
