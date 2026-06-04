import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import entryLogo from "@/assets/prayer-fire-entry-logo.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      toast({ title: "Error", description: "Please enter your new password", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error("Password update error:", error);
        toast({
          title: "Error",
          description: "We could not update your password. Please request a new reset link and try again.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Password updated", description: "Please sign in with your new password." });
      await supabase.auth.signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Unexpected password update error:", error);
      toast({
        title: "Error",
        description: "We could not update your password. Please request a new reset link and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <main className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <img src={entryLogo} alt="Prayer & Fire Logo" className="h-28 w-28 object-contain" />
          <h1 className="mt-6 text-[32px] font-bold text-foreground">Set New Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter a new password for your account.</p>
        </div>

        <div className="space-y-4">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl bg-card text-foreground"
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 rounded-xl bg-card text-foreground"
          />
          <Button onClick={handleUpdatePassword} disabled={loading} className="h-12 w-full rounded-xl">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;