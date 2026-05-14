import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Upload, Image as ImageIcon } from "lucide-react";

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  description: string | null;
  purchase_url: string;
  is_active: boolean;
  category: string | null;
  button_label: string | null;
}

const CATEGORIES = ["Books", "Merch", "Apparel", "Accessories", "Other"];
const LINK_TYPES = [
  { value: "amazon", label: "Amazon", buttonLabel: "View on Amazon" },
  { value: "etsy", label: "Etsy", buttonLabel: "View on Etsy" },
  { value: "stripe", label: "Stripe", buttonLabel: "Register / Pay with Stripe" },
  { value: "external", label: "External Link", buttonLabel: "Open Link" },
];

function inferLinkType(url: string, currentLabel?: string | null): string {
  const u = (url || "").toLowerCase();
  if (u.includes("amazon.")) return "amazon";
  if (u.includes("etsy.")) return "etsy";
  if (u.includes("stripe.")) return "stripe";
  if (currentLabel?.toLowerCase().includes("amazon")) return "amazon";
  if (currentLabel?.toLowerCase().includes("etsy")) return "etsy";
  if (currentLabel?.toLowerCase().includes("stripe")) return "stripe";
  return "external";
}

export function AdminProducts({ t }: { t: (en: string, es: string) => string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emptyForm = {
    name: "",
    image_url: "",
    description: "",
    purchase_url: "",
    category: "Books",
    link_type: "amazon",
    button_label: "View on Amazon",
  };
  const [formData, setFormData] = useState(emptyForm);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: t("Please select an image file", "Por favor selecciona un archivo de imagen"), variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: t("Image must be less than 5MB", "La imagen debe ser menor a 5MB"), variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(filePath);
      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: t("Success", "Éxito"), description: t("Image uploaded successfully", "Imagen subida exitosamente") });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || t("Failed to upload image", "Error al subir imagen"), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id,name,image_url,description,purchase_url,is_active,category,button_label")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProducts((data as Product[]) || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.purchase_url) {
      toast({ title: "Error", description: t("Name and external link are required", "Nombre y enlace externo son requeridos"), variant: "destructive" });
      return;
    }

    const productData = {
      name: formData.name,
      image_url: formData.image_url || null,
      description: formData.description || null,
      purchase_url: formData.purchase_url,
      category: formData.category,
      button_label: formData.button_label,
      is_active: true,
    };

    if (editingProduct) {
      const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: t("Success", "Éxito"), description: t("Product updated ✅", "Producto actualizado ✅") });
        setDialogOpen(false);
        setEditingProduct(null);
        setFormData(emptyForm);
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from("products").insert([productData]);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: t("Success", "Éxito"), description: t("Product added ✅", "Producto agregado ✅") });
        setDialogOpen(false);
        setFormData(emptyForm);
        fetchProducts();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("Delete this product?", "¿Eliminar este producto?"))) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("Success", "Éxito"), description: t("Product deleted", "Producto eliminado") });
      fetchProducts();
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      image_url: product.image_url || "",
      description: product.description || "",
      purchase_url: product.purchase_url,
      category: product.category || "Books",
      button_label: product.button_label || "View on Amazon",
    });
    setDialogOpen(true);
  };

  if (loading) return <div className="text-center p-4">{t("Loading", "Cargando")}...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🛍️ {t("Manage Products", "Gestionar Productos")}</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingProduct(null); setFormData(emptyForm); }}>
              {t("Add Product", "Agregar Producto")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? t("Edit Product", "Editar Producto") : t("New Product", "Nuevo Producto")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder={t("Product title", "Título del producto") + " *"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div className="space-y-2">
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? t("Uploading...", "Subiendo...") : (
                    <><Upload className="w-4 h-4 mr-2" />{t("Upload / Change Image", "Subir / Cambiar Imagen")}</>
                  )}
                </Button>
                {formData.image_url && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground truncate flex-1">{t("Image uploaded", "Imagen subida")}</span>
                    <img src={formData.image_url} alt="Preview" className="w-10 h-10 rounded object-cover" />
                  </div>
                )}
              </div>

              <Textarea
                placeholder={t("Short description", "Descripción corta")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t("Category", "Categoría")}</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <Input
                placeholder={t("External link (Amazon / Etsy URL)", "Enlace externo (URL Amazon / Etsy)") + " *"}
                value={formData.purchase_url}
                onChange={(e) => setFormData({ ...formData, purchase_url: e.target.value })}
                required
              />

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">{t("Button label", "Etiqueta del botón")}</label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={formData.button_label}
                  onChange={(e) => setFormData({ ...formData, button_label: e.target.value })}
                >
                  {BUTTON_LABELS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <p className="text-xs text-muted-foreground">
                {t(
                  "No prices shown in the app. Purchases happen externally on Amazon or Etsy.",
                  "No se muestran precios en la app. Las compras se realizan externamente en Amazon o Etsy."
                )}
              </p>

              <Button type="submit" className="w-full">
                {editingProduct ? t("Update Product", "Actualizar Producto") : t("Add Product", "Agregar Producto")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {products.length === 0 ? (
          <div className="text-center text-muted-foreground p-8">
            {t("No products yet. Add one with the button above.", "No hay productos aún. Agrega uno con el botón de arriba.")}
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <div key={product.id} className="border border-border rounded-lg p-4 flex justify-between items-start gap-3">
                <div className="flex gap-3 flex-1 min-w-0">
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">{product.category || "Books"}</span>
                      <span className="text-xs text-muted-foreground">{product.button_label || "View on Amazon"}</span>
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                    )}
                    <a href={product.purchase_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 inline-block truncate max-w-full">
                      {product.purchase_url}
                    </a>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
