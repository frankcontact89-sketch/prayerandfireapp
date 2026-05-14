import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Trash2, BookmarkPlus, Package, Flame, BookOpen, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Module2ScreenProps { t: (key: string) => string; onBack: () => void; onGoToStore?: () => void; }

interface Purchase {
  id: string;
  product_id: string;
  purchase_date: string;
  price_paid: number | null;
  products: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    price: number | null;
  };
}

export function Module2Screen({ t, onBack, onGoToStore }: Module2ScreenProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchPurchases(); }, []);

  const fetchPurchases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("purchases")
      .select(`*, products (id, name, description, image_url, price)`)
      .eq("user_id", user.id)
      .order("purchase_date", { ascending: false });
    
    if (error) {
      console.error("Error fetching purchases:", error);
    }
    setPurchases(data || []);
    setLoading(false);
  };

  const handleDelete = async (purchaseId: string) => {
    const { error } = await supabase.from("purchases").delete().eq("id", purchaseId);
    if (error) {
      toast({ title: t("error"), description: t("couldNotDelete"), variant: "destructive" });
    } else {
      setPurchases(purchases.filter(p => p.id !== purchaseId));
      toast({ title: t("deleted"), description: t("purchaseRemoved") });
    }
    setDeleteId(null);
  };

  if (loading) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6"><div className="text-muted-foreground">{t("loading")}</div></div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>←</Button>
          <div className="flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{t("myCourses")}</h1>
          </div>
        </div>

        {/* Empty State */}
        {purchases.length === 0 && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">Featured courses to grow your faith and prayer life.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: <Flame className="w-10 h-10 text-primary" />, title: "Prayer Foundations", desc: "Build a daily, fire-filled prayer life from the ground up." },
                { icon: <Sparkles className="w-10 h-10 text-primary" />, title: "Spiritual Discipline", desc: "Cultivate fasting, worship, and the Word as lifelong habits." },
                { icon: <BookOpen className="w-10 h-10 text-primary" />, title: "Bible Study Basics", desc: "Learn how to read, understand, and live the Scriptures." },
              ].map((c) => (
                <Card key={c.title} className="p-4 space-y-3 bg-card border-border/20 hover:border-primary/40 transition-colors">
                  <div className="w-full h-32 rounded-lg bg-gradient-to-br from-primary/15 to-transparent border border-primary/20 flex items-center justify-center">
                    {c.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{c.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{c.desc}</p>
                  </div>
                  <Button onClick={onGoToStore || onBack} className="w-full">View Course</Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Purchased Products Grid */}
        {purchases.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="p-4 space-y-3 hover:shadow-lg transition-shadow bg-card border-border/20">
                {/* Product Image */}
                <div className="w-full h-32 rounded-lg overflow-hidden bg-muted/20 flex items-center justify-center">
                  {purchase.products?.image_url ? (
                    <img 
                      src={purchase.products.image_url} 
                      alt={purchase.products?.name || "Product"} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-muted-foreground/50" />
                  )}
                </div>

                {/* Product Info */}
                <div>
                  <h3 className="font-bold text-foreground truncate">{purchase.products?.name || t("unknownProduct")}</h3>
                  {purchase.products?.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{purchase.products.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    {t("purchasedOn")}: {new Date(purchase.purchase_date).toLocaleDateString()}
                  </div>
                  {purchase.price_paid && (
                    <div className="text-sm font-semibold text-primary mt-1">${purchase.price_paid.toFixed(2)}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 gap-2"
                    onClick={() => toast({ title: t("saved"), description: t("productSaved") })}
                  >
                    <BookmarkPlus size={16} /> {t("save")}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setDeleteId(purchase.id)}
                  >
                    <Trash2 size={16} /> {t("delete")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
              <AlertDialogDescription>{t("deleteWarning")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
                {t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
