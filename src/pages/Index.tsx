import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader2, X } from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/prayerandfire/";
const YOUTUBE_URL = "https://youtube.com/";
const ZOOM_URL = "https://zoom.us/";
const WHATSAPP_MESSAGE = "🔥 Check out the Prayer & Fire App! https://lovable.app/prayerandfire";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showInstagram, setShowInstagram] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, "_blank");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
  };

  // Loading state
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading…</p>
      </div>
    );
  }

  // Auth screen
  if (!user) {
    return <AuthScreen />;
  }

  // Main app content
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 pb-16">
        {/* HEADER */}
        <div className="text-center space-y-4">
          <img
            src="https://i.imgur.com/4Q9QpMo.png"
            alt="Prayer & Fire Logo"
            className="w-24 h-24 mx-auto object-contain"
          />
          <h1 className="text-xl font-bold text-primary">
            Welcome to Prayer & Fire 🔥
          </h1>
        </div>

        {/* MAIN BUTTONS */}
        <div className="space-y-5 w-full">
          <Button
            onClick={() => window.open(YOUTUBE_URL, "_blank")}
            className="w-full h-14 text-base font-bold gap-3"
            size="lg"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
              alt="YouTube"
              className="w-6 h-6 brightness-0 invert"
            />
            Live Service
          </Button>

          <Button
            onClick={() => window.open(ZOOM_URL, "_blank")}
            className="w-full h-14 text-base font-bold gap-3"
            size="lg"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/882/882704.png"
              alt="Zoom"
              className="w-6 h-6 brightness-0 invert"
            />
            Zoom
          </Button>

          <Button
            onClick={() => setShowInstagram(true)}
            className="w-full h-14 text-base font-bold gap-3"
            size="lg"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
              alt="Instagram"
              className="w-6 h-6 brightness-0 invert"
            />
            Instagram
          </Button>
        </div>

        {/* WHATSAPP BUTTON */}
        <button
          onClick={shareOnWhatsApp}
          className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold py-4 px-5 rounded-xl transition-colors"
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/733/733585.png"
            alt="WhatsApp"
            className="w-6 h-6 brightness-0 invert"
          />
          Share this app on WhatsApp
        </button>

        {/* SIGN OUT BUTTON */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="lg"
          className="w-full font-bold"
        >
          Sign Out
        </Button>

        {/* FOOTER */}
        <p className="text-center text-muted-foreground text-sm mt-10">
          Powered by Prayer & Fire
        </p>
      </div>

      {/* INSTAGRAM MODAL */}
      {showInstagram && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          <div className="bg-card p-3 flex justify-end border-b border-border">
            <Button
              onClick={() => setShowInstagram(false)}
              variant="ghost"
              size="sm"
              className="gap-2 text-primary hover:text-primary"
            >
              <X className="w-5 h-5" />
              Close
            </Button>
          </div>
          <iframe
            src={INSTAGRAM_URL}
            className="flex-1 w-full h-full border-0"
            title="Instagram"
          />
        </div>
      )}
    </div>
  );
};

// ============ AUTH SCREEN ============
function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      toast({
        title: "Invalid input",
        description: "Enter a valid email and password (min 6 characters)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      toast({
        title: "Invalid input",
        description: "Enter a valid email and password (min 6 characters)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome!",
        description: "Account created successfully",
      });
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/`,
    });

    if (error) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We sent you a password reset link",
      });
      setMode("signin");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <img
        src="https://i.imgur.com/4Q9QpMo.png"
        alt="Prayer & Fire Logo"
        className="w-40 h-40 mb-3 object-contain"
      />
      <h1 className="text-3xl font-extrabold text-primary mb-6">
        Prayer & Fire
      </h1>

      {/* Language pill */}
      <div className="mb-4">
        <button
          onClick={() =>
            toast({
              title: "Language",
              description: "English is set as the primary language.",
            })
          }
          className="bg-card border border-border px-4 py-2 rounded-full text-xs font-bold text-muted-foreground tracking-wide hover:bg-accent transition-colors"
        >
          English
        </button>
      </div>

      <form
        onSubmit={
          mode === "signin"
            ? handleSignIn
            : mode === "signup"
            ? handleSignUp
            : handleReset
        }
        className="w-full max-w-md space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email" className="text-muted-foreground font-bold">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-card border-border"
            required
          />
        </div>

        {mode !== "reset" && (
          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground font-bold">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-card border-border"
              required
            />
          </div>
        )}

        {mode === "signin" && (
          <>
            <Button
              type="submit"
              size="lg"
              className="w-full font-extrabold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In…
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="flex items-center justify-center gap-3 mt-4 text-sm">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-blue-400 font-bold hover:underline"
              >
                Create Account
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={() => setMode("reset")}
                className="text-blue-400 font-bold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </>
        )}

        {mode === "signup" && (
          <>
            <Button
              type="submit"
              size="lg"
              className="w-full font-extrabold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            <Button
              type="button"
              onClick={() => setMode("signin")}
              variant="outline"
              size="lg"
              className="w-full font-bold"
            >
              Back to Sign In
            </Button>
          </>
        )}

        {mode === "reset" && (
          <>
            <Button
              type="submit"
              size="lg"
              className="w-full font-extrabold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
            <Button
              type="button"
              onClick={() => setMode("signin")}
              variant="outline"
              size="lg"
              className="w-full font-bold"
            >
              Back to Sign In
            </Button>
          </>
        )}
      </form>

      <p className="text-center text-muted-foreground text-sm mt-16">
        Powered by Prayer & Fire
      </p>
    </div>
  );
}

export default Index;
