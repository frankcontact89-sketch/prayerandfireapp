import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, ExternalLink, BookOpen, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import vozInteriorBook from "@/assets/voz-interior-book.jpg";

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

interface Purchase {
  id: string;
  product_id: string;
  purchase_date: string;
  price_paid: number | null;
  products: Product;
}

export function ShoppingScreen({ t }: ShoppingScreenProps) {
  const STRIPE_PAYMENT = "https://buy.stripe.com/test_dRm4gz5Xu4A5bXb8qpgUM00";
  const BOOK_LINK = "https://a.co/d/dfgHEvM";
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooks, setShowBooks] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("purchases")
      .select(`
        *,
        products (*)
      `)
      .eq("user_id", user.id)
      .order("purchase_date", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Could not load your purchases",
        variant: "destructive",
      });
    } else {
      setPurchases(data || []);
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
          <Package className="w-16 h-16 text-primary" />
        </div>
        <h2 className="text-3xl font-extrabold text-foreground">
          📦 My Purchases
        </h2>
        <p className="text-muted-foreground">
          View all your purchased products
        </p>
      </div>

      {purchases.length === 0 ? (
        <div className="text-center p-12 space-y-4">
          <Package className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">
            You haven't purchased any products yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Check out our available products below!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow flex flex-col">
              {purchase.products.image_url && (
                <div className="flex justify-center mb-2 overflow-hidden rounded-lg">
                  <img
                    src={purchase.products.image_url}
                    alt={purchase.products.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
              {!purchase.products.image_url && (
                <div className="flex justify-center mb-2">
                  <Package className="w-20 h-20 text-primary" strokeWidth={1.5} />
                </div>
              )}
              <h4 className="text-xl font-bold text-foreground">{purchase.products.name}</h4>
              {purchase.products.description && (
                <p className="text-sm text-muted-foreground flex-1">{purchase.products.description}</p>
              )}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Purchased:</span>
                  <span className="font-medium">{new Date(purchase.purchase_date).toLocaleDateString()}</span>
                </div>
                {purchase.price_paid && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price Paid:</span>
                    <span className="text-lg font-bold text-primary">${purchase.price_paid}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Separator className="my-8" />

      {/* Books Section */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h3 
              className="text-2xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={() => setShowBooks(!showBooks)}
            >
              Books
            </h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Click on "Books" to {showBooks ? "hide" : "explore our collection"}
          </p>
        </div>

        {showBooks && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center gap-4">
                <img
                  src={vozInteriorBook}
                  alt="VOZ INTERIOR - Aline Ramiro"
                  className="w-40 h-auto rounded-lg shadow-lg"
                />
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-foreground mb-2">VOZ INTERIOR</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    by Aline Ramiro • Available on Amazon
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
        )}
      </div>

      <Separator className="my-8" />

      {/* Prayer & Fire Store Section */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 
            className="text-2xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
            onClick={() => setShowStore(!showStore)}
          >
            Prayer & Fire Store
          </h3>
          <p className="text-muted-foreground text-sm">
            Click to {showStore ? "hide" : "explore our upcoming collection"}
          </p>
        </div>

        {showStore && (
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
        )}
      </div>
    </div>
  );
}
