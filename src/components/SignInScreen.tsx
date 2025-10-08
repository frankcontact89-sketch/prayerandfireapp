import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SignInScreenProps {
  setUser: (user: any) => void;
  t: (en: string, es: string) => string;
}

export function SignInScreen({ setUser, t }: SignInScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = () => {
    setUser({ id: 1, name: "Guest", email: "guest@prayerfire.app" });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Fire_icon.svg/512px-Fire_icon.svg.png"
              alt="Fire Icon"
              className="w-24 h-24"
            />
          </div>
          <h1 className="text-5xl font-extrabold text-primary tracking-tight">
            PRAYER & FIRE
          </h1>
        </div>

        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email or Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12"
          />

          <Button onClick={handleSignIn} className="w-full h-12 text-base font-bold">
            Sign In
          </Button>

          <Button variant="outline" className="w-full h-12 text-base font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Create Account
          </Button>

          <button className="w-full text-center text-primary font-bold text-sm">
            Forgot Password / Username?
          </button>
        </div>
      </div>
    </div>
  );
}
