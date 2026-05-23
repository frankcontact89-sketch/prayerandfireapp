import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, ShoppingBag } from "lucide-react";

interface ShoppingScreenProps {
  t: (key: string) => string;
}

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
  if (/imers[aã]o/i.test(p.name)) return "Register with Stripe";
  if (p.button_label) return p.button_label;

  const url = (p.purchase_url || "").toLowerCase();
  if (url.includes("amazon.")) return "View on Amazon";
  if (url.includes("etsy.")) return "View on Etsy";
  if (url.includes("stripe.") || url.includes("buy.stripe") || url.includes("checkout.stripe")) {
    return "Register with Stripe";
  }
  return "Open Link";
}

function normalizeCategory(category?: string | null) {
  const c = (category || "").toLowerCase();
  if (c.includes("course") || c.includes("curso")) return "Courses";
  if (c.includes("merch") || c.includes("apparel") || c.includes("shirt") || c.includes("mug")) return "Merch";
  return "Books";
}

export function ShoppingScreen({ t }: ShoppingScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id,name,image_url,description,purchase_url,is_active,category,button_label")
      .eq("is_active", true);

    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  const grouped = useMemo(() => {
    const items = products.map((p) => ({
      ...p,
      category: normalizeCategory(p.category),
    }));

    return {
      Courses: items.filter((p) => p.category === "Courses"),
      Books: items.filter((p) => p.category === "Books"),
      Merch: items.filter((p) => p.category === "Merch"),
    };
  }, [products]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.brandLeft}>
          <div style={styles.brandIcon}>
            <ShoppingBag size={22} />
          </div>
          <div>
            <div style={styles.brandTitle}>Store</div>
            <div style={styles.brandSub}>Books, courses, and ministry resources</div>
          </div>
        </div>

        <div style={styles.notice}>External checkout through trusted partners.</div>
      </div>

      <div style={styles.content}>
        <ProductSection title="Courses" items={grouped.Courses} onSelect={setSelectedProduct} />
        <ProductSection title="Books" items={grouped.Books} onSelect={setSelectedProduct} />
        <ProductSection title="Merch" items={grouped.Merch} onSelect={setSelectedProduct} />
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-black border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">{selectedProduct?.name}</DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-5">
              {selectedProduct.image_url && (
                <div className="flex justify-center overflow-hidden rounded-xl bg-white/5">
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="w-full max-h-80 object-contain"
                  />
                </div>
              )}

              <div className="text-center">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: "rgba(255,106,0,0.15)",
                    color: ORANGE,
                  }}
                >
                  {selectedProduct.category || "Books"}
                </span>
              </div>

              {selectedProduct.description && (
                <p className="text-white/70 leading-relaxed">{selectedProduct.description}</p>
              )}

              <p className="text-xs text-white/50 text-center">External checkout through trusted partners.</p>

              <button
                onClick={() => window.open(selectedProduct.purchase_url, "_blank", "noopener,noreferrer")}
                style={styles.primaryBtnFull}
              >
                <ExternalLink size={18} />
                {inferButtonLabel(selectedProduct)}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductSection({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: Product[];
  onSelect: (p: Product) => void;
}) {
  if (!items.length) return null;

  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>

      <div style={styles.grid}>
        {items.map((p) => (
          <div key={p.id} style={styles.card} onClick={() => onSelect(p)}>
            <div style={styles.imageBox}>
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} style={styles.image} />
              ) : (
                <div style={styles.imagePlaceholder}>🔥</div>
              )}
            </div>

            <div style={styles.cardBody}>
              <div style={styles.badge}>{p.category || title}</div>
              <div style={styles.cardTitle}>{p.name}</div>

              {p.description && <div style={styles.cardDesc}>{p.description}</div>}

              <button
                style={styles.primaryBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  if (p.purchase_url) {
                    window.open(p.purchase_url, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                <ExternalLink size={15} />
                {inferButtonLabel(p)}
              </button>

              <div style={styles.externalNote}>External checkout</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#000",
    color: "#fff",
    padding: "18px 14px 90px",
  },
  loading: {
    textAlign: "center",
    padding: 40,
    opacity: 0.7,
  },
  header: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "10px 0 18px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  brandLeft: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  brandIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    background: "rgba(255,106,0,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: ORANGE,
    border: "1px solid rgba(255,106,0,0.25)",
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: 900,
  },
  brandSub: {
    fontSize: 14,
    opacity: 0.72,
  },
  notice: {
    marginTop: 14,
    padding: "10px 12px",
    borderRadius: 12,
    background: "rgba(255,106,0,0.08)",
    border: "1px solid rgba(255,106,0,0.20)",
    fontSize: 12,
    opacity: 0.9,
  },
  content: {
    maxWidth: 900,
    margin: "20px auto 0",
    display: "flex",
    flexDirection: "column",
    gap: 28,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 900,
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
  },
  card: {
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 18,
    overflow: "hidden",
    cursor: "pointer",
  },
  imageBox: {
    width: "100%",
    height: 190,
    background: "rgba(255,255,255,0.04)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  imagePlaceholder: {
    fontSize: 40,
    opacity: 0.5,
  },
  cardBody: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  badge: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: 800,
    color: ORANGE,
    background: "rgba(255,106,0,0.12)",
    border: "1px solid rgba(255,106,0,0.25)",
    padding: "3px 8px",
    borderRadius: 999,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: 900,
  },
  cardDesc: {
    fontSize: 14,
    opacity: 0.76,
    lineHeight: 1.45,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  primaryBtn: {
    marginTop: 4,
    background: ORANGE,
    color: "#000",
    border: "none",
    padding: "12px 14px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnFull: {
    width: "100%",
    background: ORANGE,
    color: "#000",
    border: "none",
    padding: "14px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  externalNote: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
};
