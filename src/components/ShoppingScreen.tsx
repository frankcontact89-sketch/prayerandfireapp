import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, ExternalLink, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShoppingScreenProps {
  t: (key: string) => string;
}

interface Product {
  id: string;
  name: string;
  price: number | null;
  image_url: string | null;
  description: string | null;
  purchase_url: string;
  is_active: boolean;
}

export function ShoppingScreen({ t }: ShoppingScreenProps) {
  const STRIPE_PAYMENT = "https://buy.stripe.com/test_dRm4gz5Xu4A5bXb8qpgUM00";
  const BOOK_LINK = "https://a.co/d/dfgHEvM";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center text-muted-foreground">{t("loading")}...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <ShoppingBag className="w-16 h-16 text-primary" />
        </div>
        <h2 className="text-3xl font-extrabold text-foreground">
          🛍️ {t("shopping")}
        </h2>
        <p className="text-muted-foreground">
          {t("explore_products")}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center p-12 space-y-4">
          <ShoppingBag className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            No hay productos disponibles en este momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow flex flex-col">
              {product.image_url && (
                <div className="flex justify-center mb-2 overflow-hidden rounded-lg">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
              {!product.image_url && (
                <div className="flex justify-center mb-2">
                  <ShoppingBag className="w-20 h-20 text-primary" strokeWidth={1.5} />
                </div>
              )}
              <h4 className="text-xl font-bold text-foreground">{product.name}</h4>
              {product.description && (
                <p className="text-sm text-muted-foreground flex-1">{product.description}</p>
              )}
              <div className="flex items-center justify-between pt-4">
                {product.price && (
                  <span className="text-2xl font-bold text-primary">${product.price}</span>
                )}
                {!product.price && <span></span>}
                <Button onClick={() => window.open(product.purchase_url || STRIPE_PAYMENT, "_blank")}>
                  {t("buy")}
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Separator className="my-8" />

      {/* Featured Book Section */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold text-foreground">
              📖 Featured Book
            </h3>
          </div>
          <p className="text-muted-foreground">
            Discover The Fire Within — a devotional that ignites your faith and passion for God's presence.
          </p>
        </div>

        <Card className="p-6 space-y-4 max-w-md mx-auto hover:shadow-lg transition-shadow">
          <div className="flex flex-col items-center gap-4">
            <img
              src="https://m.media-amazon.com/images/I/61fZ3n6J2lL._SY466_.jpg"
              alt="The Fire Within"
              className="w-40 h-auto rounded-lg shadow-lg"
            />
            <div className="text-center">
              <h4 className="text-lg font-semibold text-foreground mb-2">The Fire Within</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Available on Amazon
              </p>
              <Button asChild className="w-full gap-2">
                <a href={BOOK_LINK} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  Buy on Amazon
                </a>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Prayer & Fire Store Section */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">
            🔥 Prayer & Fire Store
          </h3>
          <p className="text-muted-foreground">
            Explore our upcoming collection — shirts, mugs, and more.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {/* Product 1: T-Shirt */}
          <Card className="p-4 space-y-3 hover:shadow-lg transition-shadow">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src="https://m.media-amazon.com/images/I/61eVgftN2bL._AC_UY879_.jpg"
                alt="Prayer & Fire T-Shirt"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground text-sm">
                T-Shirt
              </p>
              <p className="text-xs text-muted-foreground">
                Coming Soon
              </p>
            </div>
          </Card>

          {/* Product 2: Mug */}
          <Card className="p-4 space-y-3 hover:shadow-lg transition-shadow">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src="https://m.media-amazon.com/images/I/61DPOamA5JL._AC_SX679_.jpg"
                alt="Prayer & Fire Mug"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground text-sm">
                Mug
              </p>
              <p className="text-xs text-muted-foreground">
                Coming Soon
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
