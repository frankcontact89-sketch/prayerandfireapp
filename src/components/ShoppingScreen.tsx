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
            <ShoppingBag size={22} />
          </div>

          <div>
            <div style={styles.brandTitle}>Store</div>

            <div style={styles.brandSub}>Featured book</div>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        {product && (
          <div style={styles.card} onClick={() => setSelectedProduct(product)}>
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
                <ExternalLink size={16} />
                View on Amazon
              </button>

              <div style={styles.externalText}>Opens externally</div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl bg-black border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">{selectedProduct?.name}</DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-5">
              {selectedProduct.image_url && (
                <div className="flex justify-center overflow-hidden rounded-xl bg-white/5">
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="w-full max-h-96 object-contain"
                  />
                </div>
              )}

              <p className="text-white/70 text-center leading-relaxed">Christian book by Aline Ramiro.</p>

              <p className="text-xs text-white/40 text-center">Opens externally</p>

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
    padding: "18px 14px 90px",
  },

  loading: {
    textAlign: "center",
    padding: 40,
    opacity: 0.7,
  },

  header: {
    maxWidth: 700,
    margin: "0 auto",
    paddingBottom: 20,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  brandLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: "rgba(255,106,0,0.12)",
    border: "1px solid rgba(255,106,0,0.25)",
    color: ORANGE,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  brandTitle: {
    fontSize: 30,
    fontWeight: 900,
  },

  brandSub: {
    fontSize: 14,
    opacity: 0.72,
  },

  content: {
    maxWidth: 700,
    margin: "24px auto 0",
  },

  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    overflow: "hidden",
    cursor: "pointer",
  },

  imageBox: {
    width: "100%",
    height: 420,
    overflow: "hidden",
    background: "rgba(255,255,255,0.04)",
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
    fontSize: 50,
    opacity: 0.5,
  },

  cardBody: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  cardTitle: {
    fontSize: 34,
    fontWeight: 900,
    textTransform: "uppercase",
  },

  cardDesc: {
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 1.5,
  },

  primaryBtn: {
    background: ORANGE,
    color: "#000",
    border: "none",
    borderRadius: 14,
    padding: "14px",
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
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
    borderRadius: 14,
    padding: "14px",
    fontWeight: 900,
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  externalText: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.45,
  },
};
