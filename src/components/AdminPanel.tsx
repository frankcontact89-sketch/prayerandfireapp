import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLinks } from "./admin/AdminLinks";
import { AdminVideos } from "./admin/AdminVideos";
import { AdminEvents } from "./admin/AdminEvents";
import { AdminNotifications } from "./admin/AdminNotifications";
import { AdminProducts } from "./admin/AdminProducts";
import { AdminStaff } from "./admin/AdminStaff";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

interface AdminPanelProps {
  t: (en: string, es: string) => string;
  onBack: () => void;
}

export function AdminPanel({ t, onBack }: AdminPanelProps) {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
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
          <h1 className="text-3xl font-extrabold text-foreground">
            {t("Admin Panel", "Panel de Administración")}
          </h1>
        </div>
      </div>

      <Tabs defaultValue="links" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-muted">
          <TabsTrigger value="links">{t("Links", "Enlaces")}</TabsTrigger>
          <TabsTrigger value="videos">{t("Videos", "Videos")}</TabsTrigger>
          <TabsTrigger value="events">{t("Events", "Eventos")}</TabsTrigger>
          <TabsTrigger value="products">{t("Products", "Productos")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("Notifications", "Notificaciones")}</TabsTrigger>
          <TabsTrigger value="staff">{t("Staff", "Personal")}</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="mt-6">
          <AdminLinks t={t} />
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          <AdminVideos t={t} />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <AdminEvents t={t} />
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <AdminProducts t={t} />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <AdminNotifications t={t} />
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <AdminStaff t={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
