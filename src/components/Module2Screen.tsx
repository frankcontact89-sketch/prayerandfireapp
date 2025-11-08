import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, ShoppingBag, BookOpen, Video, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

interface Module2ScreenProps {
  t: (key: string) => string;
  onBack: () => void;
}

export function Module2Screen({ t, onBack }: Module2ScreenProps) {
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPurchase();
  }, []);

  const checkPurchase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("purchases")
      .select(`
        *,
        products!inner(name)
      `)
      .eq("user_id", user.id)
      .eq("products.name", "Cursos Prayer & Fire");

    if (!error && data && data.length > 0) {
      setHasPurchased(true);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!hasPurchased) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <Button
          onClick={onBack}
          size="lg"
        >
          My Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
            >
              ←
            </Button>
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-extrabold text-foreground">
                My Courses
              </h1>
            </div>
          </div>
        </div>

        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <p className="text-lg text-muted-foreground">
            Welcome to your spiritual growth journey. Explore our courses to deepen your faith.
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Course 1: Prayer Fundamentals */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-center">
              <BookOpen className="w-16 h-16 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground text-center">
              Prayer Fundamentals
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Learn the basics of effective prayer and how to build a consistent prayer life.
            </p>
            <Button className="w-full" variant="outline">
              Start Course
            </Button>
          </Card>

          {/* Course 2: Fasting & Spiritual Discipline */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-center">
              <Video className="w-16 h-16 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground text-center">
              Fasting & Spiritual Discipline
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Discover the power of fasting and how to incorporate spiritual disciplines.
            </p>
            <Button className="w-full" variant="outline">
              Start Course
            </Button>
          </Card>

          {/* Course 3: Worship & Intimacy with God */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-center">
              <FileText className="w-16 h-16 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground text-center">
              Worship & Intimacy with God
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Explore true worship and how to cultivate deeper intimacy with God.
            </p>
            <Button className="w-full" variant="outline">
              Start Course
            </Button>
          </Card>

          {/* Course 4: Spiritual Warfare */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-center">
              <BookOpen className="w-16 h-16 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground text-center">
              Spiritual Warfare
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Understand spiritual warfare and how to stand firm in your faith.
            </p>
            <Button className="w-full" variant="outline">
              Start Course
            </Button>
          </Card>

          {/* Course 5: Prophetic Voice */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-center">
              <Video className="w-16 h-16 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground text-center">
              Prophetic Voice
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Learn to hear God's voice and grow in prophetic gifting.
            </p>
            <Button className="w-full" variant="outline">
              Start Course
            </Button>
          </Card>

          {/* Course 6: Living in the Spirit */}
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-center">
              <FileText className="w-16 h-16 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground text-center">
              Living in the Spirit
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Discover how to walk daily in the power and guidance of the Holy Spirit.
            </p>
            <Button className="w-full" variant="outline">
              Start Course
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
