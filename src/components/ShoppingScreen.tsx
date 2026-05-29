import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ExternalLink,
  ShoppingBag,
  Star,
  ShieldCheck,
  Globe,
  BadgeCheck,
  Flame,
  Heart,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Truck,
  Sparkles,
} from "lucide-react";

interface ShoppingScreenProps {
  t: (key: string) => string;
}

interface RemoteProduct {
  id: string;
  name: string;
  image_url: string | null;
  description: string | null;
  purchase_url: string;
  is_active: boolean;
}

type Category = "all" | "tshirts" | "hoodies" | "mugs" | "stickers" | "books";

interface DemoProduct {
  id: string;
  name: string;
  category: Exclude<Category, "all">;
  price: string;
  rating: number;
  reviews: number;
  badge?: "Bestseller" | "Featured" | "New";
  shortDesc: string;
  longDesc: string;
  materials: string;
  sizes?: string[];
  shipping: string;
  purchaseUrl: string;
  gradient: string;
  emoji: string;
}

const ORANGE = "#FF6B00";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "tshirts", label: "T-Shirts" },
  { id: "hoodies", label: "Hoodies" },
  { id: "mugs", label: "Mugs" },
  { id: "stickers", label: "Stickers" },
  { id: "books", label: "Books" },
];

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: "tee-fire",
    name: "Holy Fire Premium Tee",
    category: "tshirts",
    price: "$29.00",
    rating: 4.9,
    reviews: 214,
    badge: "Bestseller",
    shortDesc: "Soft cotton tee with embroidered flame.",
    longDesc:
      "A premium heavyweight tee designed to wear your faith with confidence. Featuring a subtle embroidered Prayer & Fire flame and clean typography on the back.",
    materials: "100% ring-spun cotton, 220 gsm",
    sizes: ["S", "M", "L", "XL", "XXL"],
    shipping: "Ships worldwide in 5–10 business days",
    purchaseUrl: "https://www.amazon.com/",
    gradient: "linear-gradient(135deg,#1a0f08,#3a1a05 60%,#FF6B00)",
    emoji: "🔥",
  },
  {
    id: "hoodie-movement",
    name: "Global Movement Hoodie",
    category: "hoodies",
    price: "$59.00",
    rating: 4.8,
    reviews: 138,
    badge: "Featured",
    shortDesc: "Heavyweight fleece hoodie, ministry-grade comfort.",
    longDesc:
      "Thick brushed fleece interior, oversized fit, and minimal Prayer & Fire branding. Made for prayer nights, travel, and everyday wear.",
    materials: "80% cotton / 20% polyester, 400 gsm fleece",
    sizes: ["S", "M", "L", "XL", "XXL"],
    shipping: "Ships worldwide in 7–14 business days",
    purchaseUrl: "https://www.amazon.com/",
    gradient: "linear-gradient(135deg,#0a0a0a,#1a1a1a 60%,#3a1a05)",
    emoji: "🧥",
  },
  {
    id: "mug-prayer",
    name: "Morning Prayer Mug",
    category: "mugs",
    price: "$18.00",
    rating: 4.9,
    reviews: 96,
    badge: "New",
    shortDesc: "Ceramic mug for your morning devotion.",
    longDesc:
      "Start your day in prayer with this 11oz ceramic mug featuring a discreet flame logo and a daily scripture inside the rim.",
    materials: "Premium ceramic, dishwasher & microwave safe",
    shipping: "Ships worldwide in 5–10 business days",
    purchaseUrl: "https://www.amazon.com/",
    gradient: "linear-gradient(135deg,#1a1a1a,#2d2d2d,#FF6B00)",
    emoji: "☕",
  },
  {
    id: "stickers-pack",
    name: "Prayer & Fire Sticker Pack",
    category: "stickers",
    price: "$9.00",
    rating: 5.0,
    reviews: 312,
    badge: "Bestseller",
    shortDesc: "Set of 5 waterproof vinyl stickers.",
    longDesc:
      "Durable, waterproof vinyl stickers for laptops, water bottles, and Bibles. UV-resistant inks keep colors vibrant for years.",
    materials: "Matte vinyl, laminated, UV resistant",
    shipping: "Ships worldwide in 3–7 business days",
    purchaseUrl: "https://www.amazon.com/",
    gradient: "linear-gradient(135deg,#2a1505,#FF6B00)",
    emoji: "✨",
  },
  {
    id: "tee-faith",
    name: "Wear Your Faith Tee",
    category: "tshirts",
    price: "$27.00",
    rating: 4.7,
    reviews: 89,
    shortDesc: "Soft tri-blend tee with bold typography.",
    longDesc:
      "Minimal 'Wear Your Faith' typography on a soft tri-blend tee. A daily reminder of your calling.",
    materials: "Tri-blend cotton / polyester / rayon",
    sizes: ["S", "M", "L", "XL"],
    shipping: "Ships worldwide in 5–10 business days",
    purchaseUrl: "https://www.amazon.com/",
    gradient: "linear-gradient(135deg,#0d0d0d,#2d2d2d)",
    emoji: "👕",
  },
  {
    id: "hoodie-cross",
    name: "Cross & Flame Hoodie",
    category: "hoodies",
    price: "$64.00",
    rating: 4.8,
    reviews: 74,
    shortDesc: "Embroidered cross & flame insignia.",
    longDesc:
      "A statement hoodie with a tonal embroidered cross & flame insignia. Built for warmth and worship.",
    materials: "Heavyweight cotton blend, 380 gsm",
    sizes: ["M", "L", "XL", "XXL"],
    shipping: "Ships worldwide in 7–14 business days",
    purchaseUrl: "https://www.amazon.com/",
    gradient: "linear-gradient(135deg,#0a0a0a,#3a1a05)",
    emoji: "✝️",
  },
  {
    id: "book-voz",
    name: "A Voz que Mudou Minha Vida",
    category: "books",
    price: "$15.00",
    rating: 5.0,
    reviews: 421,
    badge: "Bestseller",
    shortDesc: "Christian book by Aline Ramiro.",
    longDesc:
      "A powerful testimony of transformation, faith, and the voice of God. Available in print and Kindle editions.",
    materials: "Paperback / Kindle",
    shipping: "Fulfilled by Amazon worldwide",
    purchaseUrl: "https://www.amazon.com/",
    gradient: "linear-gradient(135deg,#1a0f08,#FF6B00)",
    emoji: "📖",
  },
  {
    id: "mug-flame",
    name: "Flame Logo Mug",
    category: "mugs",
    price: "$16.00",
    rating: 4.6,
    reviews: 52,
    shortDesc: "Minimal flame logo on matte ceramic.",
    longDesc:
      "A clean, matte-finish ceramic mug with the Prayer & Fire flame. The everyday companion for your quiet time.",
    materials: "Matte ceramic, 11oz",
    shipping: "Ships worldwide in 5–10 business days",
    purchaseUrl: "https://www.amazon.com/",
    gradient: "linear-gradient(135deg,#1a1a1a,#FF6B00)",
    emoji: "🔥",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    location: "Texas, USA",
    text: "The quality of the Holy Fire tee blew me away. I wear it everywhere and people always ask about Prayer & Fire.",
    rating: 5,
  },
  {
    name: "João P.",
    location: "São Paulo, Brazil",
    text: "Encomendei o moletom e chegou impecável. Sinto orgulho de usar e compartilhar o movimento.",
    rating: 5,
  },
  {
    name: "Grace O.",
    location: "Lagos, Nigeria",
    text: "Beautiful packaging, fast shipping, and every purchase supports the mission. Highly recommend.",
    rating: 5,
  },
];

export function ShoppingScreen({ t: _t }: ShoppingScreenProps) {
  const [remoteProduct, setRemoteProduct] = useState<RemoteProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>("all");
  const [selected, setSelected] = useState<DemoProduct | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setRemoteProduct(data as RemoteProduct | null);
      setLoading(false);
    })();
  }, []);

  const filtered =
    category === "all" ? DEMO_PRODUCTS : DEMO_PRODUCTS.filter((p) => p.category === category);
  const featured = DEMO_PRODUCTS.filter(
    (p) => p.badge === "Featured" || p.badge === "Bestseller",
  ).slice(0, 4);
  const bestsellers = DEMO_PRODUCTS.filter((p) => p.badge === "Bestseller");
  const related = selected
    ? DEMO_PRODUCTS.filter((p) => p.id !== selected.id && p.category === selected.category).slice(0, 4)
    : [];

  const galleryFor = (p: DemoProduct) => [
    p.gradient,
    `linear-gradient(45deg,#000,${ORANGE})`,
    `linear-gradient(225deg,#1a1a1a,#3a1a05,${ORANGE})`,
  ];

  const openProduct = (p: DemoProduct) => {
    setSelected(p);
    setGalleryIndex(0);
    setZoomed(false);
  };

  const buy = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brandLeft}>
          <div style={styles.brandIcon}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <div style={styles.brandTitle}>Prayer &amp; Fire Store</div>
            <div style={styles.brandSub}>Wear your faith. Fuel the mission.</div>
          </div>
        </div>
      </header>

      <div style={styles.trustBar}>
        <div style={styles.trustItem}><ShieldCheck size={14} color={ORANGE} /><span>Secure Checkout</span></div>
        <div style={styles.trustItem}><Globe size={14} color={ORANGE} /><span>Worldwide Shipping</span></div>
        <div style={styles.trustItem}><BadgeCheck size={14} color={ORANGE} /><span>Guaranteed</span></div>
      </div>

      <section style={styles.hero}>
        <div style={styles.heroGlow} />
        <div style={styles.heroBadge}>
          <Flame size={12} color={ORANGE} />
          <span>The Movement</span>
        </div>
        <h1 style={styles.heroTitle}>
          Wear Your <span style={{ color: ORANGE }}>Faith</span>
        </h1>
        <p style={styles.heroSub}>
          Premium Christian apparel and resources. Every purchase fuels the Prayer &amp; Fire global movement.
        </p>
        <div style={styles.heroCtas}>
          <button style={styles.primaryBtn} onClick={() => setCategory("tshirts")}>Shop Apparel</button>
          <button style={styles.ghostBtn} onClick={() => setCategory("books")}>Shop Books</button>
        </div>
      </section>

      <nav style={styles.categories} aria-label="Product categories">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            style={{
              ...styles.categoryPill,
              background: category === c.id ? ORANGE : "rgba(255,255,255,0.04)",
              color: category === c.id ? "#000" : "#fff",
              borderColor: category === c.id ? ORANGE : "rgba(255,255,255,0.08)",
              fontWeight: category === c.id ? 900 : 600,
            }}
          >
            {c.label}
          </button>
        ))}
      </nav>

      {category === "all" && (
        <Section title="Featured" subtitle="Hand-picked by the Prayer & Fire team">
          <div style={styles.grid2}>
            {featured.map((p) => (
              <ProductCard key={p.id} p={p} onOpen={openProduct} onBuy={buy} />
            ))}
          </div>
        </Section>
      )}

      {category === "all" && (
        <Section title="Bestsellers" subtitle="What the community loves most">
          <div style={styles.scrollRow}>
            {bestsellers.map((p) => (
              <div key={p.id} style={{ minWidth: 200, maxWidth: 200 }}>
                <ProductCard p={p} onOpen={openProduct} onBuy={buy} compact />
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section
        title={category === "all" ? "Shop All" : CATEGORIES.find((c) => c.id === category)?.label || "Shop"}
        subtitle={`${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
      >
        <div style={styles.grid2}>
          {filtered.map((p) => (
            <ProductCard key={p.id} p={p} onOpen={openProduct} onBuy={buy} />
          ))}
        </div>
      </Section>

      {!loading && remoteProduct && (
        <Section title="From the Ministry" subtitle="Direct from Prayer & Fire">
          <div
            style={styles.realCard}
            onClick={() => remoteProduct.purchase_url && buy(remoteProduct.purchase_url)}
          >
            <div style={styles.realImageBox}>
              {remoteProduct.image_url ? (
                <img src={remoteProduct.image_url} alt={remoteProduct.name} style={styles.realImage} loading="lazy" />
              ) : (
                <div style={styles.imagePlaceholder}>🔥</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={styles.cardTitle}>{remoteProduct.name}</div>
              <div style={styles.cardDesc}>{remoteProduct.description || "Official Prayer & Fire resource."}</div>
              <button
                style={{ ...styles.primaryBtn, marginTop: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  buy(remoteProduct.purchase_url);
                }}
              >
                <ExternalLink size={15} /> View on Amazon
              </button>
            </div>
          </div>
        </Section>
      )}

      <section style={styles.mission}>
        <div style={styles.missionBadge}>
          <Sparkles size={12} color={ORANGE} />
          <span>Our Mission</span>
        </div>
        <div style={styles.sectionH}>Support the Mission</div>
        <p style={styles.missionText}>
          Prayer &amp; Fire is a global movement dedicated to igniting hearts in prayer, deepening faith,
          and walking together in Christ. Every product you wear or share helps us reach more nations,
          translate the gospel into more languages, and disciple new believers.
        </p>
        <button style={styles.primaryBtnFull} onClick={() => setCategory("tshirts")}>
          <Heart size={16} /> Shop &amp; Support
        </button>
      </section>

      <Section title="Loved by the Community" subtitle="Real stories from real believers">
        <div style={styles.scrollRow}>
          {TESTIMONIALS.map((tst, i) => (
            <div key={i} style={styles.testimonial}>
              <div style={styles.stars}>
                {Array.from({ length: tst.rating }).map((_, k) => (
                  <Star key={k} size={14} fill={ORANGE} color={ORANGE} />
                ))}
              </div>
              <p style={styles.testimonialText}>“{tst.text}”</p>
              <div style={styles.testimonialAuthor}>
                <strong>{tst.name}</strong>
                <span style={{ opacity: 0.6 }}> · {tst.location}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <section style={styles.footerTrust}>
        <div style={styles.footerTrustItem}>
          <Truck size={18} color={ORANGE} />
          <div><strong>Worldwide shipping</strong><br /><span style={{ opacity: 0.7 }}>Delivered to 100+ countries</span></div>
        </div>
        <div style={styles.footerTrustItem}>
          <ShieldCheck size={18} color={ORANGE} />
          <div><strong>Secure checkout</strong><br /><span style={{ opacity: 0.7 }}>Encrypted &amp; PCI compliant</span></div>
        </div>
        <div style={styles.footerTrustItem}>
          <BadgeCheck size={18} color={ORANGE} />
          <div><strong>Quality guarantee</strong><br /><span style={{ opacity: 0.7 }}>Love it or your money back</span></div>
        </div>
      </section>

      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setZoomed(false);
          }
        }}
      >
        <DialogContent className="max-w-md bg-black border-white/10 max-h-[90vh] overflow-y-auto p-0">
          {selected && (
            <>
              <DialogHeader className="px-5 pt-5 pb-2">
                <DialogTitle className="text-xl font-bold text-white text-left">{selected.name}</DialogTitle>
              </DialogHeader>

              <div style={{ position: "relative", margin: "0 16px" }}>
                <div
                  onClick={() => setZoomed((z) => !z)}
                  style={{
                    ...styles.galleryMain,
                    background: galleryFor(selected)[galleryIndex],
                    cursor: "zoom-in",
                    transform: zoomed ? "scale(1.5)" : "scale(1)",
                    transition: "transform 0.3s ease",
                  }}
                >
                  <span style={styles.galleryEmoji}>{selected.emoji}</span>
                  <button style={styles.zoomBtn} aria-label="Zoom">
                    <ZoomIn size={16} />
                  </button>
                </div>
                <button
                  aria-label="Previous image"
                  style={{ ...styles.galleryNav, left: 6 }}
                  onClick={() =>
                    setGalleryIndex((i) => (i - 1 + galleryFor(selected).length) % galleryFor(selected).length)
                  }
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  aria-label="Next image"
                  style={{ ...styles.galleryNav, right: 6 }}
                  onClick={() => setGalleryIndex((i) => (i + 1) % galleryFor(selected).length)}
                >
                  <ChevronRight size={18} />
                </button>
                <div style={styles.thumbs}>
                  {galleryFor(selected).map((g, i) => (
                    <button
                      key={i}
                      onClick={() => setGalleryIndex(i)}
                      style={{
                        ...styles.thumb,
                        background: g,
                        border: galleryIndex === i ? `2px solid ${ORANGE}` : "2px solid rgba(255,255,255,0.1)",
                      }}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div style={{ padding: "16px 20px 100px" }}>
                <div style={styles.priceRow}>
                  <span style={styles.price}>{selected.price}</span>
                  <span style={styles.ratingInline}>
                    <Star size={14} fill={ORANGE} color={ORANGE} /> {selected.rating} ({selected.reviews})
                  </span>
                </div>

                <p style={styles.longDesc}>{selected.longDesc}</p>

                {selected.sizes && (
                  <div style={{ marginTop: 14 }}>
                    <div style={styles.detailLabel}>Sizes</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                      {selected.sizes.map((s) => (
                        <span key={s} style={styles.sizeChip}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>Materials</div>
                  <div style={styles.detailValue}>{selected.materials}</div>
                </div>
                <div style={styles.detailBlock}>
                  <div style={styles.detailLabel}>Shipping</div>
                  <div style={styles.detailValue}>{selected.shipping}</div>
                </div>

                {related.length > 0 && (
                  <div style={{ marginTop: 22 }}>
                    <div style={styles.sectionH}>Related</div>
                    <div style={{ ...styles.scrollRow, marginTop: 10 }}>
                      {related.map((rp) => (
                        <div key={rp.id} style={{ minWidth: 150, maxWidth: 150 }}>
                          <ProductCard p={rp} onOpen={openProduct} onBuy={buy} compact />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.stickyBar}>
                <button style={styles.primaryBtnFull} onClick={() => buy(selected.purchaseUrl)}>
                  <ExternalLink size={16} /> Buy Now — {selected.price}
                </button>
              </div>

              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org/",
                    "@type": "Product",
                    name: selected.name,
                    description: selected.longDesc,
                    brand: { "@type": "Brand", name: "Prayer & Fire" },
                    aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: selected.rating,
                      reviewCount: selected.reviews,
                    },
                    offers: {
                      "@type": "Offer",
                      price: selected.price.replace("$", ""),
                      priceCurrency: "USD",
                      availability: "https://schema.org/InStock",
                      url: selected.purchaseUrl,
                    },
                  }),
                }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHead}>
        <div style={styles.sectionH}>{title}</div>
        {subtitle && <div style={styles.sectionSub}>{subtitle}</div>}
      </div>
      {children}
    </section>
  );
}

function ProductCard({
  p,
  onOpen,
  onBuy,
  compact,
}: {
  p: DemoProduct;
  onOpen: (p: DemoProduct) => void;
  onBuy: (url: string) => void;
  compact?: boolean;
}) {
  return (
    <div style={styles.productCard} onClick={() => onOpen(p)}>
      <div style={{ ...styles.productImage, background: p.gradient, height: compact ? 140 : 170 }}>
        <span style={styles.productEmoji}>{p.emoji}</span>
        {p.badge && <span style={styles.badge}>{p.badge}</span>}
      </div>
      <div style={{ padding: 12 }}>
        <div style={styles.productName}>{p.name}</div>
        <div style={styles.productMeta}>
          <span style={styles.productPrice}>{p.price}</span>
          <span style={styles.ratingInlineSm}>
            <Star size={11} fill={ORANGE} color={ORANGE} /> {p.rating}
          </span>
        </div>
        {!compact && (
          <button
            style={styles.cardBuyBtn}
            onClick={(e) => {
              e.stopPropagation();
              onBuy(p.purchaseUrl);
            }}
          >
            Buy Now
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#000",
    color: "#fff",
    padding: "14px 14px 90px",
    maxWidth: 430,
    margin: "0 auto",
  },
  header: {
    paddingBottom: 14,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandLeft: { display: "flex", alignItems: "center", gap: 12 },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "rgba(255,107,0,0.12)",
    border: "1px solid rgba(255,107,0,0.25)",
    color: ORANGE,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: { fontSize: 22, fontWeight: 900, lineHeight: 1.1 },
  brandSub: { fontSize: 12, opacity: 0.72, marginTop: 2 },

  trustBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    padding: "10px 4px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  trustItem: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    fontWeight: 600,
    opacity: 0.9,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    marginTop: 16,
    padding: "26px 20px",
    borderRadius: 22,
    background:
      "linear-gradient(160deg, rgba(255,107,0,0.18) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.9) 100%)",
    border: "1px solid rgba(255,107,0,0.25)",
    textAlign: "center",
  },
  heroGlow: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 220,
    height: 220,
    background: "rgba(255,107,0,0.25)",
    filter: "blur(80px)",
  },
  heroBadge: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "5px 10px",
    borderRadius: 999,
    background: "rgba(255,107,0,0.12)",
    border: "1px solid rgba(255,107,0,0.3)",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: ORANGE,
  },
  heroTitle: {
    position: "relative",
    fontSize: 34,
    fontWeight: 900,
    lineHeight: 1.05,
    margin: "12px 0 8px",
    letterSpacing: -0.5,
  },
  heroSub: {
    position: "relative",
    fontSize: 14,
    opacity: 0.85,
    lineHeight: 1.45,
    margin: "0 auto 16px",
    maxWidth: 320,
  },
  heroCtas: { position: "relative", display: "flex", justifyContent: "center", gap: 10 },

  categories: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    padding: "16px 0 4px",
    scrollbarWidth: "none",
  },
  categoryPill: {
    padding: "8px 14px",
    borderRadius: 999,
    border: "1px solid",
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s",
  },

  section: { marginTop: 22 },
  sectionHead: { marginBottom: 12 },
  sectionH: { fontSize: 20, fontWeight: 900, letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, opacity: 0.65, marginTop: 2 },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  scrollRow: {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    paddingBottom: 6,
    scrollbarWidth: "none",
    scrollSnapType: "x mandatory",
  },

  productCard: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    overflow: "hidden",
    cursor: "pointer",
    scrollSnapAlign: "start",
  },
  productImage: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  productEmoji: { fontSize: 48, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.6))" },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    background: ORANGE,
    color: "#000",
    fontSize: 10,
    fontWeight: 900,
    padding: "4px 8px",
    borderRadius: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  productName: { fontSize: 14, fontWeight: 800, lineHeight: 1.25, minHeight: 36 },
  productMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  productPrice: { fontSize: 15, fontWeight: 900, color: ORANGE },
  ratingInlineSm: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    fontSize: 11,
    opacity: 0.85,
  },
  cardBuyBtn: {
    marginTop: 10,
    width: "100%",
    background: "rgba(255,107,0,0.12)",
    color: ORANGE,
    border: "1px solid rgba(255,107,0,0.35)",
    borderRadius: 10,
    padding: "9px",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },

  realCard: {
    display: "flex",
    gap: 14,
    padding: 14,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,107,0,0.2)",
    borderRadius: 16,
    cursor: "pointer",
  },
  realImageBox: {
    width: 110,
    minWidth: 110,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  realImage: { width: "100%", height: "100%", objectFit: "contain" },
  imagePlaceholder: { fontSize: 40, opacity: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: 800, lineHeight: 1.2 },
  cardDesc: { fontSize: 13, opacity: 0.75, lineHeight: 1.4, marginTop: 6 },

  mission: {
    marginTop: 28,
    padding: 22,
    borderRadius: 20,
    background: "linear-gradient(160deg, rgba(255,107,0,0.1), rgba(0,0,0,0.6))",
    border: "1px solid rgba(255,107,0,0.22)",
    textAlign: "center",
  },
  missionBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(255,107,0,0.12)",
    border: "1px solid rgba(255,107,0,0.3)",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    color: ORANGE,
    marginBottom: 10,
  },
  missionText: { fontSize: 14, opacity: 0.85, lineHeight: 1.55, marginTop: 8, marginBottom: 16 },

  testimonial: {
    minWidth: 250,
    maxWidth: 250,
    padding: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    scrollSnapAlign: "start",
  },
  stars: { display: "flex", gap: 2, marginBottom: 8 },
  testimonialText: { fontSize: 13, lineHeight: 1.5, opacity: 0.9 },
  testimonialAuthor: { fontSize: 12, marginTop: 10 },

  footerTrust: {
    marginTop: 24,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 16,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16,
  },
  footerTrustItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 13,
  },

  galleryMain: {
    height: 280,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    transformOrigin: "center",
  },
  galleryEmoji: { fontSize: 100, filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6))" },
  zoomBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    width: 32,
    height: 32,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  galleryNav: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 32,
    height: 32,
    borderRadius: 999,
    background: "rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  thumbs: { display: "flex", gap: 8, marginTop: 10, justifyContent: "center" },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    cursor: "pointer",
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  price: { fontSize: 26, fontWeight: 900, color: ORANGE },
  ratingInline: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 13,
    opacity: 0.9,
  },
  longDesc: { fontSize: 14, lineHeight: 1.55, opacity: 0.85, marginTop: 12 },
  sizeChip: {
    padding: "8px 12px",
    borderRadius: 10,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 13,
    fontWeight: 700,
  },
  detailBlock: { marginTop: 14 },
  detailLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: ORANGE,
  },
  detailValue: { fontSize: 13, opacity: 0.85, marginTop: 4, lineHeight: 1.5 },
  stickyBar: {
    position: "sticky",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    background: "rgba(0,0,0,0.95)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
  },

  primaryBtn: {
    background: ORANGE,
    color: "#000",
    border: "none",
    borderRadius: 12,
    padding: "12px 18px",
    fontWeight: 900,
    fontSize: 14,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  ghostBtn: {
    background: "transparent",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 12,
    padding: "12px 18px",
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
  },
  primaryBtnFull: {
    width: "100%",
    background: ORANGE,
    color: "#000",
    border: "none",
    borderRadius: 14,
    padding: "14px",
    fontWeight: 900,
    fontSize: 15,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
};