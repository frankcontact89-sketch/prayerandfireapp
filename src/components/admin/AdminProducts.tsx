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
  price: number | null;
  image_url: string | null;
  description: string | null;
  purchase_url: string;
  is_active: boolean;
}

export function AdminProducts({ t }: { t: (en: string, es: string) => string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    image_url: "",
    description: "",
    purchase_url: "",
  });
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: t("Please select an image file", "Por favor selecciona un archivo de imagen"),
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: t("Image must be less than 5MB", "La imagen debe ser menor a 5MB"),
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast({
        title: t("Success", "Éxito"),
        description: t("Image uploaded successfully", "Imagen subida exitosamente"),
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || t("Failed to upload image", "Error al subir imagen"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.purchase_url) {
      toast({
        title: "Error",
        description: "Nombre y URL de compra son requeridos",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      name: formData.name,
      price: formData.price ? parseFloat(formData.price) : null,
      image_url: formData.image_url || null,
      description: formData.description || null,
      purchase_url: formData.purchase_url,
      is_active: true,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(productData)
        .eq("id", editingProduct.id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Éxito", description: "Producto actualizado ✅" });
        setDialogOpen(false);
        setEditingProduct(null);
        setFormData({ name: "", price: "", image_url: "", description: "", purchase_url: "" });
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from("products").insert([productData]);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Éxito", description: "Producto agregado ✅" });
        setDialogOpen(false);
        setFormData({ name: "", price: "", image_url: "", description: "", purchase_url: "" });
        fetchProducts();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Éxito", description: "Producto eliminado" });
      fetchProducts();
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price?.toString() || "",
      image_url: product.image_url || "",
      description: product.description || "",
      purchase_url: product.purchase_url,
    });
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center p-4">{t("Loading", "Cargando")}...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🛍️ Gestionar Productos</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingProduct(null);
                setFormData({ name: "", price: "", image_url: "", description: "", purchase_url: "" });
              }}
            >
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
                placeholder={t("Product name", "Nombre del producto") + " *"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                placeholder={t("Price (e.g. 24.99)", "Precio (ej. 24.99)")}
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>{t("Uploading...", "Subiendo...")}</>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {t("Upload Image from Phone", "Subir Imagen del Celular")}
                    </>
                  )}
                </Button>
                {formData.image_url && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {t("Image uploaded", "Imagen subida")}
                    </span>
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-10 h-10 rounded object-cover"
                    />
                  </div>
                )}
              </div>
              <Textarea
                placeholder={t("Product description", "Descripción del producto")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Input
                placeholder={t("Purchase URL (Stripe/Store)", "URL de compra (Stripe/Store)") + " *"}
                value={formData.purchase_url}
                onChange={(e) => setFormData({ ...formData, purchase_url: e.target.value })}
                required
              />
              <Button type="submit" className="w-full">
                {editingProduct ? t("Update", "Actualizar") : t("Add", "Agregar")} {t("Product", "Producto")}
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
              <div
                key={product.id}
                className="border border-border rounded-lg p-4 flex justify-between items-start"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  {product.price && (
                    <p className="text-primary font-bold">${product.price}</p>
                  )}
                  {product.description && (
                    <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                  )}
                  <a
                    href={product.purchase_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                  >
                    {product.purchase_url}
                  </a>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(product)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
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
