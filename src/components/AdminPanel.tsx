import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLinks } from "./admin/AdminLinks";
import { AdminEvents } from "./admin/AdminEvents";
import { AdminNotifications } from "./admin/AdminNotifications";
import { AdminProducts } from "./admin/AdminProducts";
import { AdminCourses } from "./admin/AdminCourses";
import { ProductionChecklist } from "./ProductionChecklist";
import { Shield, ArrowLeft, Lock, ClipboardCheck } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface AdminPanelProps {
  t: (key: string) => string;
  onBack: () => void;
}

const ADMIN_PIN = "1234"; // 4-digit PIN for admin access

export function AdminPanel({ t, onBack }: AdminPanelProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const handlePinSubmit = () => {
    if (pin === ADMIN_PIN) {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin("");
    }
  };

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 4);
    setPin(numericValue);
    setPinError(false);
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Lock className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Admin Access</h1>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <p className="text-muted-foreground text-center">
            Enter the 4-digit PIN to access the admin panel
          </p>
          <Input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => handlePinChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
            className={`text-center text-2xl tracking-widest h-14 ${pinError ? "border-destructive" : ""}`}
            maxLength={4}
          />
          {pinError && (
            <p className="text-destructive text-sm text-center">Incorrect PIN. Try again.</p>
          )}
          <Button onClick={handlePinSubmit} className="w-full h-12" disabled={pin.length !== 4}>
            Unlock Admin Panel
          </Button>
        </div>
      </div>
    );
  }

  if (showChecklist) {
    return <ProductionChecklist onBack={() => setShowChecklist(false)} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
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
              Admin Panel
            </h1>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowChecklist(true)}
          className="flex items-center gap-2"
        >
          <ClipboardCheck className="w-4 h-4" />
          Checklist
        </Button>
      </div>

      <Tabs defaultValue="links" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-muted">
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

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

        <TabsContent value="notifications" className="mt-6">
          <AdminNotifications t={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
