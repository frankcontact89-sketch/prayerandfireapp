import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import vozInteriorBook from "@/assets/voz-interior-book.jpg";
import prayerFireMug from "@/assets/prayer-fire-mug.png";
import prayerJournal from "@/assets/prayer-journal.jpg";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";

interface ShoppingScreenProps { t: (key: string) => string; }
interface Product {
  id: string;
  name: string;
  image_url: string | null;
  description: string | null;
  purchase_url: string;
  is_active: boolean;
  category?: string | null;
  button_label?: string | null;
}

const ORANGE = "#FF6A00";

function inferButtonLabel(p: Product): string {
  // Special override: "Imersão" must use Stripe label
  if (/imers[aã]o/i.test(p.name)) return "Register / Pay with Stripe";
  if (p.button_label) return p.button_label;
  const url = (p.purchase_url || "").toLowerCase();
  if (url.includes("amazon.")) return "View on Amazon";
  if (url.includes("etsy.")) return "View on Etsy";
  if (url.includes("stripe.") || url.includes("buy.stripe") || url.includes("checkout.stripe")) return "Register / Pay with Stripe";
  return "Open Link";
}

export function ShoppingScreen({ t }: ShoppingScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "Books", "Merch"];

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id,name,image_url,description,purchase_url,is_active,category,button_label")
      .eq("is_active", true);
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  const allItems = useMemo<Product[]>(() => {
    const featured: Product[] = [
      {
        id: "book-voz-interior",
        name: "VOZ INTERIOR",
        description: "A faith-based book to help you hear the inner voice of God.",
        image_url: vozInteriorBook,
        purchase_url: "https://a.co/d/dfgHEvM",
        is_active: true,
        category: "Books",
        button_label: "View on Amazon",
      },
      {
        id: "merch-prayer-fire-mug",
        name: "Prayer & Fire Mug",
        description: "Premium ceramic mug with the Prayer & Fire flame logo.",
        image_url: prayerFireMug,
        purchase_url: "https://www.etsy.com/",
        is_active: true,
        category: "Merch",
        button_label: "View on Etsy",
      },
      {
        id: "merch-prayer-journal",
        name: "Prayer Journal",
        description: "Leather-bound journal to record prayers, reflections, and answers.",
        image_url: prayerJournal,
        purchase_url: "https://www.etsy.com/",
        is_active: true,
        category: "Books",
        button_label: "View on Etsy",
      },
    ];
    const existingIds = new Set(products.map((p) => p.id));
    const featuredFiltered = featured.filter((f) => !existingIds.has(f.id));
    return [...featuredFiltered, ...products.map((p) => ({ ...p, category: p.category || "Books" }))];
  }, [products]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems
      .filter(i => activeCategory === "All" ? true : i.category === activeCategory)
      .filter(i => !q || i.name.toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q));
  }, [allItems, query, activeCategory]);

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
        <div style={styles.brandLeft}>
          <div style={styles.brandIcon}>🛍️</div>
          <div>
            <div style={styles.brandTitle}>{t("store")}</div>
            <div style={styles.brandSub}>{t("browseProducts")}</div>
          </div>
        </div>

        <div style={styles.notice}>
          Products are fulfilled by external platforms such as Amazon or Etsy. Tap to view product details and purchase securely on the external site.
        </div>

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

      <div style={styles.content}>
        {filteredItems.length === 0 ? (
          <div style={styles.noResults}>{t("noProductsFound")}</div>
        ) : (
          <div style={styles.grid}>
            {filteredItems.map((p) => (
              <div key={p.id} style={styles.card} onClick={() => setSelectedProduct(p)}>
                <div style={styles.cardTop}>
                  <div style={styles.badge}>{p.category || "Books"}</div>
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
                  <div style={styles.cardDescMuted}>{t("descriptionComingSoon")}</div>
                )}

                <button
                  style={styles.primaryBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (p.purchase_url) window.open(p.purchase_url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
                  {p.button_label || "View on Amazon"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
              {selectedProduct.category && (
                <div className="text-center">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(255,106,0,0.15)", color: ORANGE }}>
                    {selectedProduct.category}
                  </span>
                </div>
              )}
              {selectedProduct.description && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">{t("description")}</h4>
                  <p className="text-white/70">{selectedProduct.description}</p>
                </div>
              )}
              <p className="text-xs text-white/50 text-center">
                Products are fulfilled by external platforms such as Amazon or Etsy. Tap to view product details and purchase securely on the external site.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => window.open(selectedProduct.purchase_url, "_blank", "noopener,noreferrer")}
                  style={{ ...styles.primaryBtn, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <ExternalLink size={18} /> {selectedProduct.button_label || "View on Amazon"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#000", color: "#fff", padding: "18px 14px 60px" },
  header: { maxWidth: 900, margin: "0 auto", padding: "10px 0 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" },
  brandLeft: { display: "flex", gap: 12, alignItems: "center" },
  brandIcon: { width: 44, height: 44, borderRadius: 12, background: "rgba(255,106,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, border: "1px solid rgba(255,106,0,0.25)" },
  brandTitle: { fontSize: 22, fontWeight: 800 },
  brandSub: { fontSize: 13, opacity: 0.75 },
  notice: { marginTop: 14, padding: 12, borderRadius: 12, background: "rgba(255,106,0,0.08)", border: "1px solid rgba(255,106,0,0.20)", fontSize: 12, lineHeight: 1.5, opacity: 0.95 },
  searchRow: { marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" },
  search: { flex: 1, minWidth: 180, background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.10)", padding: "12px", borderRadius: 12, outline: "none" },
  select: { minWidth: 140, background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.10)", padding: "12px", borderRadius: 12, outline: "none" },
  content: { maxWidth: 900, margin: "20px auto 0" },
  noResults: { textAlign: "center", padding: 40, opacity: 0.6 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 14, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10 },
  cardTop: { display: "flex", justifyContent: "flex-end" },
  badge: { fontSize: 11, fontWeight: 800, color: ORANGE, background: "rgba(255,106,0,0.12)", border: "1px solid rgba(255,106,0,0.25)", padding: "3px 8px", borderRadius: 999 },
  imageBox: { width: "100%", aspectRatio: "1 / 1", background: "rgba(255,255,255,0.04)", borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%", objectFit: "cover" },
  imagePlaceholder: { fontSize: 40, opacity: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: 800 },
  cardDesc: { fontSize: 13, opacity: 0.8, lineHeight: 1.45 },
  cardDescMuted: { fontSize: 13, opacity: 0.45, fontStyle: "italic" },
  primaryBtn: { background: ORANGE, color: "#000", border: "none", padding: "11px 14px", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 14 },
};
