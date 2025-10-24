import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit, Upload, X } from "lucide-react";

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
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    image_url: "",
    description: "",
    purchase_url: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Por favor selecciona solo archivos de imagen",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return formData.image_url || null;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
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

    const uploadedImageUrl = await uploadImage();

    const productData = {
      name: formData.name,
      price: formData.price ? parseFloat(formData.price) : null,
      image_url: uploadedImageUrl,
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
        setSelectedFile(null);
        setImagePreview(null);
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
        setSelectedFile(null);
        setImagePreview(null);
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
    setImagePreview(product.image_url || null);
    setSelectedFile(null);
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
                setSelectedFile(null);
                setImagePreview(null);
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
              
              {/* Image upload section */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("Product Image", "Imagen del producto")}
                </label>
                
                {imagePreview && (
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => {
                        setImagePreview(null);
                        setSelectedFile(null);
                        setFormData({ ...formData, image_url: "" });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="product-image-upload"
                  />
                  <label
                    htmlFor="product-image-upload"
                    className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    {t("Select Image", "Seleccionar Imagen")}
                  </label>
                </div>
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
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading 
                  ? t("Uploading...", "Subiendo...") 
                  : `${editingProduct ? t("Update", "Actualizar") : t("Add", "Agregar")} ${t("Product", "Producto")}`
                }
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
