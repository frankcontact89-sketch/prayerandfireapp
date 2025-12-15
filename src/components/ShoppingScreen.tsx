import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import vozInteriorBook from "@/assets/voz-interior-book.jpg";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Trash2, ShoppingBag } from "lucide-react";

interface ShoppingScreenProps { t: (key: string) => string; }
interface Product { id: string; name: string; price: number | null; image_url: string | null; description: string | null; purchase_url: string; is_active: boolean; category?: string; }
interface Purchase { id: string; product_id: string; purchase_date: string; price_paid: number | null; products: Product; }

const ORANGE = "#FF6A00";

export function ShoppingScreen({ t }: ShoppingScreenProps) {
  const BOOK_LINK = "https://a.co/d/dfgHEvM";
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const { toast } = useToast();

  const categories = ["All", "Courses", "Books", "Merch", "Other"];

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

  // Combine products with VOZ INTERIOR book
  const allItems = useMemo(() => {
    const bookItem: Product = {
      id: "book-voz-interior",
      name: "VOZ INTERIOR",
      description: t("byAuthor"),
      price: null,
      image_url: vozInteriorBook,
      purchase_url: BOOK_LINK,
      is_active: true,
      category: "Books"
    };
    return [bookItem, ...products.map(p => ({ ...p, category: p.category || "Other" }))];
  }, [products, t]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems
      .filter(i => activeCategory === "All" ? true : i.category === activeCategory)
      .filter(i => {
        if (!q) return true;
        return i.name.toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q);
      });
  }, [allItems, query, activeCategory]);

  const hasItems = allItems.length > 0;

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: "center", padding: 40, opacity: 0.7 }}>{t("loading")}</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brandRow}>
          <div style={styles.brandLeft}>
            <div style={styles.brandIcon}>🛍️</div>
            <div>
              <div style={styles.brandTitle}>{t("store")}</div>
              <div style={styles.brandSub}>{t("browseProducts")}</div>
            </div>
          </div>

          <button style={styles.cartBtn} onClick={() => setShowCart(!showCart)}>
            🛒 {t("shoppingCart")} {cart.length > 0 && <span style={styles.cartBadge}>{cart.length}</span>}
          </button>
        </div>

        {/* Search */}
        <div style={styles.searchRow}>
          <input
            style={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchProducts")}
          />

          <select
            style={styles.select}
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c} style={{ background: "#000", color: "#fff" }}>
                {c === "All" ? t("all") : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shopping Cart */}
      {showCart && cart.length > 0 && (
        <div style={styles.cartSection}>
          <div style={styles.cartHeader}>
            <span style={styles.cartTitle}>🛒 {t("yourCart")} ({cart.length} {t("items")})</span>
            <button style={styles.checkoutBtn} onClick={handleCheckoutAll}>
              {t("checkoutAll")} (${calculateTotal()})
            </button>
          </div>
          <div style={styles.cartGrid}>
            {cart.map((product) => (
              <div key={product.id} style={styles.cartItem}>
                {product.image_url && <img src={product.image_url} alt={product.name} style={styles.cartItemImage} />}
                <div style={styles.cartItemInfo}>
                  <div style={styles.cartItemName}>{product.name}</div>
                  <div style={styles.cartItemPrice}>${product.price?.toFixed(2)}</div>
                </div>
                <button style={styles.removeBtn} onClick={() => removeFromCart(product.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasItems && (
        <div style={styles.emptyWrap}>
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>📦</div>
            <div style={styles.emptyTitle}>{t("storeComingSoon")}</div>
            <div style={styles.emptyText}>
              {t("preparingProducts")}
              <br />
              {t("checkBackSoon")}
            </div>

            <div style={styles.emptyActions}>
              <button style={styles.primaryBtn} onClick={() => window.location.href = "/giving"}>
                ❤️ {t("goToGiving")}
              </button>
              <button style={styles.secondaryBtn} onClick={() => window.location.href = "/courses"}>
                🎓 {t("viewCourses")}
              </button>
            </div>

            <div style={styles.smallNote}>
              {t("tipProductsAutoShow")}
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      {hasItems && (
        <div style={styles.content}>
          <div style={styles.sectionTitle}>{t("availableProducts")}</div>

          {filteredItems.length === 0 ? (
            <div style={styles.noResults}>
              {t("noProductsFound")}
            </div>
          ) : (
            <div style={styles.grid}>
              {filteredItems.map((p) => (
                <div key={p.id} style={styles.card} onClick={() => setSelectedProduct(p)}>
                  <div style={styles.cardTop}>
                    <div style={styles.badge}>{p.category || "Other"}</div>
                  </div>

                  <div style={styles.imageBox}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} style={styles.image} />
                    ) : (
                      <div style={styles.imagePlaceholder}>🔥</div>
                    )}
                  </div>

                  <div style={styles.cardTitle}>{p.name}</div>

                  {p.description ? (
                    <div style={styles.cardDesc}>{p.description}</div>
                  ) : (
                    <div style={styles.cardDescMuted}>
                      {t("descriptionComingSoon")}
                    </div>
                  )}

                  {typeof p.price === "number" ? (
                    <div style={styles.price}>${p.price.toFixed(2)}</div>
                  ) : (
                    <div style={styles.priceMuted}>—</div>
                  )}

                  <button
                    style={styles.primaryBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (p.purchase_url) window.open(p.purchase_url, "_blank");
                    }}
                  >
                    {p.id === "book-voz-interior" ? t("buyOnAmazon") : t("view")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-black border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6">
              {selectedProduct.image_url && (
                <div className="flex justify-center overflow-hidden rounded-lg">
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full max-h-96 object-contain" />
                </div>
              )}
              {selectedProduct.price && (
                <div className="text-center">
                  <span className="text-3xl font-bold" style={{ color: ORANGE }}>${selectedProduct.price}</span>
                </div>
              )}
              {selectedProduct.description && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">{t("description")}</h4>
                  <p className="text-white/70">{selectedProduct.description}</p>
                </div>
              )}
              {selectedProduct.is_active && (
                <div className="flex gap-3 pt-4">
                  {selectedProduct.id !== "book-voz-interior" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(selectedProduct); }}
                      style={{ ...styles.secondaryBtn, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      <ShoppingCart size={18} /> {t("addToCart")}
                    </button>
                  )}
                  <button
                    onClick={() => window.open(selectedProduct.purchase_url, "_blank")}
                    style={{ ...styles.primaryBtn, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    <ShoppingBag size={18} /> {selectedProduct.id === "book-voz-interior" ? t("buyOnAmazon") : t("buyNow")}
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#000",
    color: "#fff",
    padding: "18px 14px 60px",
  },

  header: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "10px 0 18px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  brandRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },

  brandLeft: { display: "flex", gap: 12, alignItems: "center" },

  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "rgba(255,106,0,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    border: "1px solid rgba(255,106,0,0.25)",
  },

  brandTitle: { fontSize: 22, fontWeight: 800 },
  brandSub: { fontSize: 13, opacity: 0.75 },

  cartBtn: {
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  cartBadge: {
    background: ORANGE,
    color: "#000",
    borderRadius: 999,
    padding: "2px 8px",
    fontSize: 12,
    fontWeight: 800,
  },

  searchRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  search: {
    flex: 1,
    minWidth: 220,
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "12px 12px",
    borderRadius: 12,
    outline: "none",
  },

  select: {
    minWidth: 170,
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "12px 12px",
    borderRadius: 12,
    outline: "none",
  },

  cartSection: {
    maxWidth: 900,
    margin: "18px auto",
    background: "rgba(255,106,0,0.08)",
    border: "1px solid rgba(255,106,0,0.20)",
    borderRadius: 16,
    padding: 16,
  },

  cartHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },

  cartTitle: { fontSize: 18, fontWeight: 800 },

  checkoutBtn: {
    background: ORANGE,
    color: "#000",
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
  },

  cartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 12,
  },

  cartItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
  },

  cartItemImage: {
    width: 60,
    height: 60,
    objectFit: "cover",
    borderRadius: 8,
  },

  cartItemInfo: { flex: 1 },
  cartItemName: { fontWeight: 700, fontSize: 14 },
  cartItemPrice: { color: ORANGE, fontWeight: 800 },

  removeBtn: {
    background: "rgba(255,0,0,0.15)",
    border: "1px solid rgba(255,0,0,0.25)",
    borderRadius: 8,
    padding: 8,
    cursor: "pointer",
    color: "#ff6b6b",
  },

  emptyWrap: {
    maxWidth: 900,
    margin: "28px auto 0",
    display: "flex",
    justifyContent: "center",
  },

  emptyCard: {
    width: "100%",
    maxWidth: 520,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 22,
    textAlign: "center",
  },

  emptyIcon: { fontSize: 34, marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: 900, marginBottom: 8 },
  emptyText: { fontSize: 14, opacity: 0.8, lineHeight: 1.6 },

  emptyActions: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    justifyContent: "center",
    flexWrap: "wrap",
  },

  smallNote: {
    marginTop: 14,
    fontSize: 12,
    opacity: 0.6,
  },

  content: { maxWidth: 900, margin: "22px auto 0" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 900,
    marginBottom: 14,
    opacity: 0.9,
  },

  noResults: {
    marginTop: 14,
    padding: 18,
    borderRadius: 14,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.10)",
    opacity: 0.85,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },

  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    cursor: "pointer",
    transition: "border-color 0.2s",
  },

  cardTop: {
    display: "flex",
    justifyContent: "flex-end",
  },

  badge: {
    fontSize: 11,
    fontWeight: 800,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,106,0,0.14)",
    border: "1px solid rgba(255,106,0,0.25)",
    color: ORANGE,
  },

  imageBox: {
    height: 150,
    borderRadius: 14,
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  image: { width: "100%", height: "100%", objectFit: "cover" },
  imagePlaceholder: { fontSize: 36, opacity: 0.8 },

  cardTitle: { fontSize: 16, fontWeight: 900 },
  cardDesc: { fontSize: 13, opacity: 0.8, lineHeight: 1.5 },
  cardDescMuted: { fontSize: 13, opacity: 0.5 },

  price: { fontSize: 18, fontWeight: 900, color: ORANGE },
  priceMuted: { fontSize: 16, opacity: 0.5 },

  primaryBtn: {
    marginTop: 4,
    background: ORANGE,
    color: "#000",
    padding: "12px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
  },

  secondaryBtn: {
    background: "transparent",
    color: ORANGE,
    padding: "12px",
    borderRadius: 12,
    border: `1px solid ${ORANGE}`,
    cursor: "pointer",
    fontWeight: 900,
  },
};
