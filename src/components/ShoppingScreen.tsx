import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, ExternalLink, BookOpen, Package, ShoppingCart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import vozInteriorBook from "@/assets/voz-interior-book.jpg";
import prayerFireTshirt from "@/assets/prayer-fire-tshirt.png";
import { Badge } from "@/components/ui/badge";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooks, setShowBooks] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchases();
    fetchProducts();
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

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true);

    if (error) {
      toast({
        title: "Error",
        description: "Could not load products",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
  };

  const addToCart = (product: Product) => {
    if (!cart.find(item => item.id === product.id)) {
      setCart([...cart, product]);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    } else {
      toast({
        title: "Already in cart",
        description: `${product.name} is already in your cart`,
        variant: "destructive",
      });
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
    toast({
      title: "Removed from cart",
      description: "Product removed from your cart",
    });
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price || 0), 0).toFixed(2);
  };

  const handleCheckoutAll = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add products to your cart before checking out",
        variant: "destructive",
      });
      return;
    }
    // Open the purchase URL for the first item (or implement multi-product checkout)
    window.open(cart[0].purchase_url, "_blank");
    toast({
      title: "Checkout initiated",
      description: "Complete your purchase in the new window",
    });
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
        <div className="flex justify-center items-center gap-4 mb-4">
          <Package className="w-16 h-16 text-primary" />
          <div className="relative">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowCart(!showCart)}
              className="gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart
              {cart.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {cart.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-foreground">
          📦 My Purchases
        </h2>
        <p className="text-muted-foreground">
          View all your purchased products
        </p>
      </div>

      {/* Shopping Cart Section */}
      {showCart && cart.length > 0 && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Your Cart ({cart.length} items)
              </h3>
              <Button
                onClick={handleCheckoutAll}
                className="gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                Checkout All (${calculateTotal()})
              </Button>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cart.map((product) => (
                <Card key={product.id} className="p-4 flex items-center gap-4">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{product.name}</h4>
                    <p className="text-lg font-bold text-primary">
                      ${product.price?.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeFromCart(product.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      )}

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

      {/* Available Products Section */}
      {products.length > 0 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-foreground">
              🛍️ Available Products
            </h3>
            <p className="text-muted-foreground text-sm">
              Browse our collection and add items to your cart
            </p>
          </div>

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
                    <Package className="w-20 h-20 text-primary" strokeWidth={1.5} />
                  </div>
                )}
                <h4 className="text-xl font-bold text-foreground">{product.name}</h4>
                {product.description && (
                  <p className="text-sm text-muted-foreground flex-1">{product.description}</p>
                )}
                <div className="space-y-3 pt-4 border-t">
                  {product.price && (
                    <div className="text-center">
                      <span className="text-2xl font-bold text-primary">${product.price}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => addToCart(product)}
                      className="flex-1 gap-2"
                      variant="outline"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </Button>
                    <Button
                      asChild
                      className="flex-1 gap-2"
                    >
                      <a href={product.purchase_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        Buy Now
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

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
                  src={prayerFireTshirt}
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
