import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, BookOpen, Video, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

interface Module2ScreenProps { t: (key: string) => string; onBack: () => void; }

export function Module2Screen({ t, onBack }: Module2ScreenProps) {
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkPurchase(); }, []);

  const checkPurchase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("purchases").select(`*, products!inner(name)`).eq("user_id", user.id).eq("products.name", "Cursos Prayer & Fire");
    if (data && data.length > 0) setHasPurchased(true);
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6"><div className="text-muted-foreground">{t("loading")}</div></div>;
  
  // If not purchased, this screen should not be accessible (nav is hidden)
  // But as fallback, show empty state
  if (!hasPurchased) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={onBack}>←</Button>
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{t("myCourses")}</h1>
            </div>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t("noCoursesYet")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>←</Button>
            <div className="flex items-center gap-3"><GraduationCap className="w-8 h-8 text-primary" /><h1 className="text-3xl font-extrabold text-foreground">{t("myCourses")}</h1></div>
          </div>
        </div>
        <div className="text-center space-y-2 max-w-3xl mx-auto"><p className="text-lg text-muted-foreground">{t("welcomeToCourses")}</p></div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow"><div className="flex justify-center"><BookOpen className="w-16 h-16 text-primary" /></div><h3 className="text-xl font-bold text-foreground text-center">{t("prayerFundamentals")}</h3><p className="text-sm text-muted-foreground text-center">{t("prayerFundamentalsDesc")}</p><Button className="w-full" variant="outline">{t("startCourse")}</Button></Card>
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow"><div className="flex justify-center"><Video className="w-16 h-16 text-primary" /></div><h3 className="text-xl font-bold text-foreground text-center">{t("fastingDiscipline")}</h3><p className="text-sm text-muted-foreground text-center">{t("fastingDisciplineDesc")}</p><Button className="w-full" variant="outline">{t("startCourse")}</Button></Card>
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow"><div className="flex justify-center"><FileText className="w-16 h-16 text-primary" /></div><h3 className="text-xl font-bold text-foreground text-center">{t("worshipIntimacy")}</h3><p className="text-sm text-muted-foreground text-center">{t("worshipIntimacyDesc")}</p><Button className="w-full" variant="outline">{t("startCourse")}</Button></Card>
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow"><div className="flex justify-center"><BookOpen className="w-16 h-16 text-primary" /></div><h3 className="text-xl font-bold text-foreground text-center">{t("spiritualWarfare")}</h3><p className="text-sm text-muted-foreground text-center">{t("spiritualWarfareDesc")}</p><Button className="w-full" variant="outline">{t("startCourse")}</Button></Card>
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow"><div className="flex justify-center"><Video className="w-16 h-16 text-primary" /></div><h3 className="text-xl font-bold text-foreground text-center">{t("propheticVoice")}</h3><p className="text-sm text-muted-foreground text-center">{t("propheticVoiceDesc")}</p><Button className="w-full" variant="outline">{t("startCourse")}</Button></Card>
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow"><div className="flex justify-center"><FileText className="w-16 h-16 text-primary" /></div><h3 className="text-xl font-bold text-foreground text-center">{t("livingInSpirit")}</h3><p className="text-sm text-muted-foreground text-center">{t("livingInSpiritDesc")}</p><Button className="w-full" variant="outline">{t("startCourse")}</Button></Card>
        </div>
      </div>
    </div>
  );
}
