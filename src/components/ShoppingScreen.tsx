import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, ExternalLink, BookOpen, Package, ShoppingCart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import vozInteriorBook from "@/assets/voz-interior-book.jpg";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShoppingScreenProps { t: (key: string) => string; }
interface Product { id: string; name: string; price: number | null; image_url: string | null; description: string | null; purchase_url: string; is_active: boolean; }
interface Purchase { id: string; product_id: string; purchase_date: string; price_paid: number | null; products: Product; }

export function ShoppingScreen({ t }: ShoppingScreenProps) {
  const BOOK_LINK = "https://a.co/d/dfgHEvM";
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooks, setShowBooks] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchPurchases(); fetchProducts(); }, []);

  const fetchPurchases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("purchases").select(`*, products (*)`).eq("user_id", user.id).order("purchase_date", { ascending: false });
    setPurchases(data || []);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").eq("is_active", true);
    setProducts(data || []);
  };

  const addToCart = (product: Product) => {
    if (!cart.find(item => item.id === product.id)) {
      setCart([...cart, product]);
      toast({ title: t("addedToCart"), description: `${product.name} ${t("hasBeenAddedToCart")}` });
    } else {
      toast({ title: t("alreadyInCart"), description: `${product.name} ${t("isAlreadyInCart")}`, variant: "destructive" });
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
    toast({ title: t("removedFromCart"), description: t("productRemoved") });
  };

  const calculateTotal = () => cart.reduce((total, item) => total + (item.price || 0), 0).toFixed(2);

  const handleCheckoutAll = () => {
    if (cart.length === 0) { toast({ title: t("cartEmpty"), description: t("addProductsBeforeCheckout"), variant: "destructive" }); return; }
    window.open(cart[0].purchase_url, "_blank");
    toast({ title: t("checkoutInitiated"), description: t("completeInNewWindow") });
  };

  if (loading) return <div className="max-w-6xl mx-auto p-6"><div className="text-center text-muted-foreground">{t("loading")}</div></div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <div className="flex justify-center items-center gap-4 mb-4">
          <Package className="w-16 h-16 text-primary" />
          <Button variant="outline" size="lg" onClick={() => setShowCart(!showCart)} className="gap-2">
            <ShoppingCart className="w-5 h-5" />{t("shoppingCart")}{cart.length > 0 && <Badge variant="destructive" className="ml-2">{cart.length}</Badge>}
          </Button>
        </div>
        <h2 className="text-3xl font-extrabold text-foreground">🛍️ {t("store")}</h2>
        <p className="text-muted-foreground">{t("browseProducts")}</p>
      </div>

      {showCart && cart.length > 0 && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2"><ShoppingCart className="w-5 h-5" />{t("yourCart")} ({cart.length} {t("items")})</h3>
              <Button onClick={handleCheckoutAll} className="gap-2"><ShoppingBag className="w-4 h-4" />{t("checkoutAll")} (${calculateTotal()})</Button>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cart.map((product) => (
                <Card key={product.id} className="p-4 flex items-center gap-4">
                  {product.image_url && <img src={product.image_url} alt={product.name} className="w-20 h-20 object-cover rounded-lg" />}
                  <div className="flex-1"><h4 className="font-semibold text-foreground">{product.name}</h4><p className="text-lg font-bold text-primary">${product.price?.toFixed(2)}</p></div>
                  <Button variant="destructive" size="icon" onClick={() => removeFromCart(product.id)}><Trash2 className="w-4 h-4" /></Button>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      )}

      {purchases.length === 0 ? (
        <div className="text-center p-12 space-y-4"><Package className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground text-lg">{t("noPurchasesYet")}</p><p className="text-sm text-muted-foreground">{t("checkOutProducts")}</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow flex flex-col">
              {purchase.products.image_url && <div className="flex justify-center mb-2 overflow-hidden rounded-lg"><img src={purchase.products.image_url} alt={purchase.products.name} className="w-full h-48 object-cover" /></div>}
              <h4 className="text-xl font-bold text-foreground">{purchase.products.name}</h4>
              {purchase.products.description && <p className="text-sm text-muted-foreground flex-1">{purchase.products.description}</p>}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t("purchased")}:</span><span className="font-medium">{new Date(purchase.purchase_date).toLocaleDateString()}</span></div>
                {purchase.price_paid && <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t("pricePaid")}:</span><span className="text-lg font-bold text-primary">${purchase.price_paid}</span></div>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Separator className="my-8" />

      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2"><BookOpen className="w-6 h-6 text-primary" /><h3 className="text-2xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => setShowBooks(!showBooks)}>{t("books")}</h3></div>
          <p className="text-muted-foreground text-sm">{showBooks ? t("hide") : t("books")}</p>
        </div>
        {showBooks && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center gap-4">
                <img src={vozInteriorBook} alt="VOZ INTERIOR - Aline Ramiro" className="w-40 h-auto rounded-lg shadow-lg" />
                <div className="text-center"><h4 className="text-lg font-semibold text-foreground mb-2">VOZ INTERIOR</h4><p className="text-sm text-muted-foreground mb-4">{t("byAuthor")}</p><Button asChild className="w-full gap-2"><a href={BOOK_LINK} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" />{t("buyOnAmazon")}</a></Button></div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {products.length > 0 && (
        <div className="space-y-6">
          <div className="text-center space-y-2"><h3 className="text-2xl font-bold text-foreground">🛍️ {t("availableProducts")}</h3><p className="text-muted-foreground text-sm">{t("browseCollection")}</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow flex flex-col cursor-pointer" onClick={() => setSelectedProduct(product)}>
                {product.image_url && <div className="flex justify-center mb-2 overflow-hidden rounded-lg"><img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" /></div>}
                {!product.image_url && <div className="flex justify-center mb-2"><Package className="w-20 h-20 text-primary" strokeWidth={1.5} /></div>}
                <h4 className="text-xl font-bold text-foreground">{product.name}</h4>
                {product.description && <p className="text-sm text-muted-foreground flex-1 line-clamp-2">{product.description}</p>}
                {product.price && <div className="text-center pt-4 border-t"><span className="text-2xl font-bold text-primary">${product.price}</span></div>}
              </Card>
            ))}
          </div>
        </div>
      )}

      <Separator className="my-8" />

      <div className="space-y-6">
        <div className="text-center space-y-2"><h3 className="text-2xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => setShowStore(!showStore)}>{t("prayerFireStore")}</h3><p className="text-muted-foreground text-sm">{showStore ? t("hide") : t("clickToExplore")}</p></div>
        {showStore && <div className="text-center p-8"><p className="text-muted-foreground">{t("checkBackLater")}</p></div>}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-bold">{selectedProduct?.name}</DialogTitle></DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              {selectedProduct.image_url && <div className="flex justify-center overflow-hidden rounded-lg"><img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full max-h-96 object-contain" /></div>}
              {selectedProduct.price && <div className="text-center"><span className="text-3xl font-bold text-primary">${selectedProduct.price}</span></div>}
              {selectedProduct.description && <div className="space-y-2"><h4 className="font-semibold text-foreground">{t("description")}</h4><p className="text-muted-foreground">{selectedProduct.description}</p></div>}
              {selectedProduct.is_active && (
                <div className="flex gap-3 pt-4">
                  <Button onClick={(e) => { e.stopPropagation(); addToCart(selectedProduct); }} className="flex-1 gap-2" variant="outline" size="lg"><ShoppingCart className="w-5 h-5" />{t("addToCart")}</Button>
                  <Button asChild className="flex-1 gap-2" size="lg"><a href={selectedProduct.purchase_url} target="_blank" rel="noopener noreferrer"><ShoppingBag className="w-5 h-5" />{t("buyNow")}</a></Button>
                </div>
              )}
              {!selectedProduct.is_active && <div className="text-center p-4 bg-muted rounded-lg"><p className="text-muted-foreground font-medium">{t("comingSoon")}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
