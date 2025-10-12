import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import prayerFireLogo from "@/assets/prayer-fire-logo-new.jpg";

interface SignInScreenProps {
  setUser: (user: any) => void;
  t: (key: string) => string;
}

export function SignInScreen({ setUser, t }: SignInScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuth = async () => {
    if (isForgotPassword) {
      if (!email) {
        toast({
          title: "Error",
          description: "Please enter your email",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });

        if (error) throw error;

        toast({
          title: "Email sent!",
          description: "Check your email to reset your password",
        });
        setIsForgotPassword(false);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        if (data.user) {
          // Create profile
          await supabase.from("profiles").insert([
            {
              id: data.user.id,
              email: data.user.email,
              username: email.split("@")[0],
            },
          ]);

          toast({
            title: "Account created!",
            description: "You can now sign in",
          });
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-6">
      <div className="w-full max-w-md">
        <div className="flex justify-center mt-[100px]">
          <img 
            src={prayerFireLogo} 
            alt="Prayer & Fire Logo" 
            className="w-[120px] h-[120px] object-contain"
          />
        </div>
        
        <h1 className="text-[28px] font-bold text-[#FF6A00] text-center mt-5">
          Prayer & Fire
        </h1>

        <div className="mt-10 space-y-[15px]">
          <Input
            type="email"
            placeholder="Email or Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#1A1A1A] border-0 rounded-[10px] text-white h-12 px-3"
          />
          
          {!isForgotPassword && (
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A1A1A] border-0 rounded-[10px] text-white h-12 px-3"
            />
          )}

          <Button 
            onClick={handleAuth} 
            className="w-full bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white rounded-[10px] h-12 text-base font-medium mt-[25px]"
            disabled={loading}
          >
            {loading ? t("loading") : 
              isForgotPassword ? t("send") :
              (isSignUp ? t("signup") : "Sign In")}
          </Button>

          {!isForgotPassword && (
            <Button 
              variant="outline" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full bg-transparent border-2 border-[#FF6A00] text-[#FF6A00] hover:bg-[#FF6A00] hover:text-white rounded-[10px] h-12 text-base font-medium"
              disabled={loading}
            >
              {isSignUp ? "Already have account?" : "Register"}
            </Button>
          )}

          <button
            onClick={() => {
              setIsForgotPassword(!isForgotPassword);
              setIsSignUp(false);
            }}
            className="w-full text-sm text-[#999999] hover:text-[#FF6A00] transition-colors text-center mt-[15px] block"
            disabled={loading}
          >
            {isForgotPassword ? t("back") : "Forgot Password?"}
          </button>

          <div className="text-center mt-[30px]">
            <span className="text-white text-sm">English ▸</span>
          </div>
        </div>
      </div>
    </div>
  );
}
