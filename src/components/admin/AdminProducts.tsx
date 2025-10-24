import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit } from "lucide-react";

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
              <Input
                placeholder={t("Image URL", "URL de la imagen")}
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
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
