import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Trash2, BookmarkPlus, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import bannerPrayer from "@/assets/course-prayer-foundations.jpg";
import bannerDiscipline from "@/assets/course-spiritual-discipline.jpg";
import bannerBible from "@/assets/course-bible-study.jpg";
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

interface DbCourse {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  button_label: string | null;
  link_url: string | null;
  link_type: string;
}

const fallbackBanner = (title: string) => {
  const key = title.toLowerCase();
  if (key.includes("spiritual") || key.includes("discipline")) return bannerDiscipline;
  if (key.includes("bible")) return bannerBible;
  return bannerPrayer;
};

const fallbackButtonLabel = (title: string) => {
  const key = title.toLowerCase();
  if (key.includes("spiritual") || key.includes("discipline")) return "Start Journey";
  if (key.includes("bible")) return "Begin Study";
  if (key.includes("prayer foundation")) return "Open Course";
  return "Open Course";
};

const defaultCourses: DbCourse[] = [
  {
    id: "prayer-foundations",
    title: "Prayer Foundations",
    description: "Learn the foundations of a powerful and consistent prayer life.",
    image_url: bannerPrayer,
    button_label: "Open Course",
    link_url: null,
    link_type: "info",
  },
  {
    id: "spiritual-discipline",
    title: "Spiritual Discipline",
    description: "Build daily habits that strengthen your walk with God.",
    image_url: bannerDiscipline,
    button_label: "Start Journey",
    link_url: null,
    link_type: "info",
  },
  {
    id: "bible-study-basics",
    title: "Bible Study Basics",
    description: "Discover practical tools to understand and apply Scripture.",
    image_url: bannerBible,
    button_label: "Begin Study",
    link_url: null,
    link_type: "info",
  },
];

export function Module2Screen({ t, onBack, onGoToStore }: Module2ScreenProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [courses, setCourses] = useState<DbCourse[]>(defaultCourses);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchCourses(), fetchPurchases()]);
    setLoading(false);
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("id,title,description,image_url,button_label,link_url,link_type")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching courses:", error);
      return;
    }

    if (data && data.length > 0) setCourses(data as DbCourse[]);
  };

  const fetchPurchases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("purchases")
      .select(`*, products (id, name, description, image_url, price)`)
      .eq("user_id", user.id)
      .order("purchase_date", { ascending: false });
    
    if (error) {
      console.error("Error fetching purchases:", error);
    }
    setPurchases(data || []);
  };

  const handleCourseAction = (course: DbCourse) => {
    toast(t("courseContentSoon"));
  };

  const getButtonLabel = (course: DbCourse) => {
    const label = course.button_label?.trim();
    if (!label || label === "Learn More" || label === "View Course") return fallbackButtonLabel(course.title);
    return label;
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
              {courses.map((c) => (
                <Card key={c.id} className="p-4 space-y-3 bg-card border-border/20 hover:border-primary/40 transition-colors">
                  <div className="w-full h-36 rounded-lg overflow-hidden bg-muted/20">
                    <img
                      src={c.image_url || fallbackBanner(c.title)}
                      alt={c.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{c.title}</h3>
                    {c.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mt-1">{c.description}</p>
                    )}
                  </div>
                  <Button onClick={() => handleCourseAction(c)} className="w-full">{getButtonLabel(c)}</Button>
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
