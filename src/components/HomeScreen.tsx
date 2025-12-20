import React from "react";
import realisticFlame from "@/assets/realistic-flame.png";
import alineRamiro from "@/assets/aline-ramiro.jpg";
import franciscoRivera from "@/assets/francisco-rivera.jpg";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HomeScreenProps {
  t: (key: string) => string;
}

export function HomeScreen({ t }: HomeScreenProps) {
  const { toast } = useToast();

  const addMeetingToCalendar = (leaderName: string, role: string) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Schedule for next week
    startDate.setHours(10, 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Meeting with ${leaderName} - ${role}`)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(`Scheduled meeting with ${leaderName}, ${role} of Prayer Fire Ministry.`)}`;
    
    window.open(calendarUrl, '_blank');
    toast({
      title: t("addedToCalendar"),
      description: t("calendarOpened"),
    });
  };

  return (
    <div className="relative min-h-screen py-8 px-4">
      {/* Fire background */}
      <div 
        className="fixed inset-0 z-0 opacity-30 dark:opacity-15"
        style={{
          backgroundImage: `url(${realisticFlame})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <h1 className="text-4xl font-bold text-foreground tracking-tight text-center">{t("appName")}</h1>
          <p className="text-lg text-muted-foreground text-center max-w-md">
            {t("welcome")}
          </p>
        </div>

        {/* Leadership Section */}
        <section className="mt-12 pt-6 border-t border-border/30 text-center">
          <h3 className="text-xl font-semibold text-foreground mb-8">
            {t("leadership")}
          </h3>

          <div className="flex flex-col gap-8 items-center">
            {/* Fundadora */}
            <div className="flex flex-col items-center">
              <img
                src={alineRamiro}
                alt="Aline Ramiro"
                className="w-36 h-36 rounded-full object-cover mb-3 border-2 border-primary/30 shadow-lg"
              />
              <strong className="text-primary text-sm">{t("founder")}</strong>
              <p className="text-foreground font-medium">Aline Ramiro</p>
              <Button 
                onClick={() => addMeetingToCalendar("Aline Ramiro", t("founder"))} 
                variant="outline" 
                size="sm" 
                className="mt-2 flex items-center gap-1"
              >
                <CalendarPlus className="w-4 h-4" />
                {t("addToCalendar")}
              </Button>
            </div>

            {/* Presidente General */}
            <div className="flex flex-col items-center">
              <img
                src={franciscoRivera}
                alt="Francisco Rivera"
                className="w-36 h-36 rounded-full object-cover mb-3 border-2 border-primary/30 shadow-lg"
              />
              <strong className="text-primary text-sm">{t("generalPresident")}</strong>
              <p className="text-foreground font-medium">Francisco Rivera</p>
              <Button 
                onClick={() => addMeetingToCalendar("Francisco Rivera", t("generalPresident"))} 
                variant="outline" 
                size="sm" 
                className="mt-2 flex items-center gap-1"
              >
                <CalendarPlus className="w-4 h-4" />
                {t("addToCalendar")}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
