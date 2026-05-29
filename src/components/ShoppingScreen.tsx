import React, { useState, useEffect } from "react";
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
}

const ORANGE = "#FF6A00";

export function ShoppingScreen({ t }: ShoppingScreenProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .ilike("name", "%voz%")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    setProduct(data as Product);
    setLoading(false);
  };

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
            <ShoppingBag size={20} />
          </div>

          <div>
            <div style={styles.brandTitle}>Store</div>
            <div style={styles.brandSub}>Featured resources</div>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {product && (
          <div style={styles.card} onClick={() => setSelectedProduct(product)}>
            <div style={styles.compactRow}>
              <div style={styles.imageBox}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} style={styles.image} />
                ) : (
                  <div style={styles.imagePlaceholder}>🔥</div>
                )}
              </div>

              <div style={styles.cardBody}>
                <div style={styles.cardTitle}>{product.name}</div>
                <div style={styles.cardDesc}>Christian book by Aline Ramiro.</div>

                <button
                  style={styles.primaryBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (product.purchase_url) {
                      window.open(product.purchase_url, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  <ExternalLink size={15} />
                  View on Amazon
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-md bg-black border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white text-center">{selectedProduct?.name}</DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {selectedProduct.image_url && (
                <div className="flex justify-center overflow-hidden rounded-xl bg-white/5 p-3">
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="w-full max-h-80 object-contain"
                  />
                </div>
              )}

              <p className="text-white/70 text-center leading-relaxed text-sm">Christian book by Aline Ramiro.</p>

              <button
                onClick={() => window.open(selectedProduct.purchase_url, "_blank", "noopener,noreferrer")}
                style={styles.primaryBtnFull}
              >
                <ExternalLink size={18} />
                View on Amazon
              </button>
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
    padding: "14px 14px 84px",
  },

  loading: {
    textAlign: "center",
    padding: 40,
    opacity: 0.7,
  },

  header: {
    maxWidth: 430,
    margin: "0 auto",
    paddingBottom: 14,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  brandLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "rgba(255,106,0,0.12)",
    border: "1px solid rgba(255,106,0,0.25)",
    color: ORANGE,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  brandTitle: {
    fontSize: 26,
    fontWeight: 900,
  },

  brandSub: {
    fontSize: 13,
    opacity: 0.72,
  },

  content: {
    maxWidth: 430,
    margin: "16px auto 0",
  },

  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    overflow: "hidden",
    cursor: "pointer",
    padding: 14,
  },

  compactRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  imageBox: {
    width: 112,
    minWidth: 112,
    height: 150,
    borderRadius: 14,
    overflow: "hidden",
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },

  imagePlaceholder: {
    fontSize: 42,
    opacity: 0.5,
  },

  cardBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 800,
    lineHeight: 1.15,
  },

  cardDesc: {
    fontSize: 13,
    opacity: 0.78,
    lineHeight: 1.35,
  },

  primaryBtn: {
    background: ORANGE,
    color: "#000",
    border: "none",
    borderRadius: 12,
    padding: "11px 12px",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  primaryBtnFull: {
    width: "100%",
    background: ORANGE,
    color: "#000",
    border: "none",
    borderRadius: 14,
    padding: "13px",
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
};
