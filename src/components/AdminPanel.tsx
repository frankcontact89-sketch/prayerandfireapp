import React, { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLinks } from "./admin/AdminLinks";
import { AdminBranding } from "./admin/AdminBranding";
import { AdminEvents } from "./admin/AdminEvents";
import { AdminNotifications } from "./admin/AdminNotifications";
import { AdminProducts } from "./admin/AdminProducts";
import { AdminCourses } from "./admin/AdminCourses";
import { AdminContent } from "./admin/AdminContent";
import { AdminVerses } from "./admin/AdminVerses";
import { AdminSolas } from "./admin/AdminSolas";
import { AdminGreekWords } from "./admin/AdminGreekWords";
import { AdminDevotionals } from "./admin/AdminDevotionals";
import { AdminReadingPlans } from "./admin/AdminReadingPlans";
import { AdminLibrary } from "./admin/AdminLibrary";
import { ProductionChecklist } from "./ProductionChecklist";
import { Shield, ArrowLeft, Lock, ClipboardCheck } from "lucide-react";
import { Button } from "./ui/button";

interface AdminPanelProps {
  t: (key: string) => string;
  onBack: () => void;
}

export function AdminPanel({ t, onBack }: AdminPanelProps) {
  const { isAdmin, loading } = useUserRole();
  const [showChecklist, setShowChecklist] = useState(false);

  if (loading || !isAdmin) {
    return (
      <div className="mx-auto max-w-md p-6 space-y-5">
        <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 text-[#DBB375]">
          <ArrowLeft className="h-5 w-5" /> {t("back")}
        </button>
        <div className="rounded-2xl border border-[#DBB375]/20 bg-[#190E16] p-6 text-center">
          <Lock className="mx-auto mb-3 h-7 w-7 text-[#DBB375]" />
          <h1 className="text-lg font-semibold text-white">{loading ? "Checking administrator access…" : "Administrator access required"}</h1>
          <p className="mt-2 text-sm text-zinc-400">{loading ? "Verifying your account permissions." : "Your account does not have permission to access this panel."}</p>
        </div>
      </div>
    );
  }

  if (showChecklist) {
    return <ProductionChecklist onBack={() => setShowChecklist(false)} />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground whitespace-nowrap">
              Admin Panel
            </h1>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowChecklist(true)}
          className="shrink-0 flex items-center gap-1.5 px-2.5 text-xs"
        >
          <ClipboardCheck className="w-4 h-4" />
          Checklist
        </Button>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <div className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1.5 rounded-2xl bg-[#170D14] p-2 sm:grid-cols-4"> 
            <TabsTrigger value="branding" className="min-h-11 rounded-xl px-1.5 py-2 text-center text-xs text-zinc-300 data-[state=active]:bg-[#5C061F] data-[state=active]:text-[#F3D5A3]">Logo</TabsTrigger>
            <TabsTrigger value="links" className="min-h-11 whitespace-normal break-words rounded-xl px-1.5 py-2 text-center text-xs leading-tight text-zinc-300 data-[state=active]:bg-[#681B3D] data-[state=active]:text-[#F3D5A3] data-[state=active]:shadow-sm">Links</TabsTrigger>
            <TabsTrigger value="events" className="min-h-11 whitespace-normal break-words rounded-xl px-1.5 py-2 text-center text-xs leading-tight text-zinc-300 data-[state=active]:bg-[#681B3D] data-[state=active]:text-[#F3D5A3] data-[state=active]:shadow-sm">Events</TabsTrigger>
            <TabsTrigger value="products" className="min-h-11 whitespace-normal break-words rounded-xl px-1.5 py-2 text-center text-xs leading-tight text-zinc-300 data-[state=active]:bg-[#681B3D] data-[state=active]:text-[#F3D5A3] data-[state=active]:shadow-sm">Products</TabsTrigger>
            <TabsTrigger value="courses" className="min-h-11 whitespace-normal break-words rounded-xl px-1.5 py-2 text-center text-xs leading-tight text-zinc-300 data-[state=active]:bg-[#681B3D] data-[state=active]:text-[#F3D5A3] data-[state=active]:shadow-sm">Courses</TabsTrigger>
            <TabsTrigger value="content" className="min-h-11 whitespace-normal break-words rounded-xl px-1.5 py-2 text-center text-xs leading-tight text-zinc-300 data-[state=active]:bg-[#681B3D] data-[state=active]:text-[#F3D5A3] data-[state=active]:shadow-sm">Content</TabsTrigger>
            <TabsTrigger value="verses" className="min-h-11 whitespace-normal break-words rounded-xl px-1.5 py-2 text-center text-xs leading-tight text-zinc-300 data-[state=active]:bg-[#681B3D] data-[state=active]:text-[#F3D5A3] data-[state=active]:shadow-sm">Verses</TabsTrigger>
            <TabsTrigger value="devotionals" className="min-h-11 whitespace-normal break-words rounded-xl px-1.5 py-2 text-center text-xs leading-tight text-zinc-300 data-[state=active]:bg-[#681B3D] data-[state=active]:text-[#F3D5A3] data-[state=active]:shadow-sm">Devotionals</TabsTrigger>
            <TabsTrigger value="plans" className="min-h-11 whitespace-normal break-words rounded-xl px-1.5 py-2 text-center text-xs leading-tight text-zinc-300 data-[state=active]:bg-[#681B3D] data-[state=active]:text-[#F3D5A3] data-[state=active]:shadow-sm">Reading Plans</TabsTrigger>
            <TabsTrigger value="library" className="min-h-11 whitespace-normal break-words rounded-xl px-1.5 py-2 text-center text-xs leading-tight text-zinc-300 data-[state=active]:bg-[#681B3D] data-[state=active]:text-[#F3D5A3] data-[state=active]:shadow-sm">Library</TabsTrigger>
            <TabsTrigger value="solas" className="min-h-11 whitespace-normal break-words rounded-xl px-1.5 py-2 text-center text-xs leading-tight text-zinc-300 data-[state=active]:bg-[#681B3D] data-[state=active]:text-[#F3D5A3] data-[state=active]:shadow-sm">Solas</TabsTrigger>
            <TabsTrigger value="greek" className="min-h-11 whitespace-normal break-words rounded-xl px-1.5 py-2 text-center text-xs leading-tight text-zinc-300 data-[state=active]:bg-[#681B3D] data-[state=active]:text-[#F3D5A3] data-[state=active]:shadow-sm">Greek</TabsTrigger>
            <TabsTrigger value="notifications" className="min-h-11 whitespace-normal break-words rounded-xl px-1.5 py-2 text-center text-xs leading-tight text-zinc-300 data-[state=active]:bg-[#681B3D] data-[state=active]:text-[#F3D5A3] data-[state=active]:shadow-sm">Notifications</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="branding" className="mt-6"><AdminBranding /></TabsContent>
        <TabsContent value="links" className="mt-6">
          <AdminLinks t={t} />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <AdminEvents t={t} />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <AdminProducts t={t} />
        </TabsContent>

        <TabsContent value="courses" className="mt-6">
          <AdminCourses t={(en, es) => en} />
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <AdminContent t={(en, es) => en} />
        </TabsContent>

        <TabsContent value="verses" className="mt-6">
          <AdminVerses t={(en, es) => en} />
        </TabsContent>

        <TabsContent value="devotionals" className="mt-6">
          <AdminDevotionals />
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <AdminReadingPlans />
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          <AdminLibrary />
        </TabsContent>

        <TabsContent value="solas" className="mt-6">
          <AdminSolas />
        </TabsContent>

        <TabsContent value="greek" className="mt-6">
          <AdminGreekWords />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <AdminNotifications t={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
