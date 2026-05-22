import React, { useState, useEffect, useCallback } from "react";
import { SignInScreen } from "@/components/SignInScreen";
import { HomeScreen } from "@/components/HomeScreen";
import { EventsScreen } from "@/components/EventsScreen";
import { GivingScreen } from "@/components/GivingScreen";
import { ShoppingScreen } from "@/components/ShoppingScreen";
import { SettingsScreen } from "@/components/SettingsScreen";
import { AdminPanel } from "@/components/AdminPanel";
import { SocialLinksScreen } from "@/components/SocialLinksScreen";
import { LanguagesScreen } from "@/components/LanguagesScreen";
import { ProfileScreen } from "@/components/ProfileScreen";
import { NotificationsScreen } from "@/components/NotificationsScreen";
import { LegalCenter } from "@/components/LegalCenter";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { SubmissionForm } from "@/components/SubmissionForm";
import { BibleStudyScreen } from "@/components/BibleStudyScreen";
import { Heart, Settings, Share2, ShoppingBag, Flame, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { translations, SupportedLanguage } from "@/config/translations";
import { useToast } from "@/hooks/use-toast";
import { getLastReadAtMs, setLastReadAtNow } from "@/lib/notifications-last-seen";

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState("home");
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [language, setLanguage] = useState<string>(() => {
    const saved = localStorage.getItem("pf_lang");
    return saved && ["en", "es", "pt"].includes(saved) ? saved : "en";
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("pf_dark_mode");
    return saved === "true" || saved === null;
  });
  const [loading, setLoading] = useState(true);
  const [userName] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  const t = (key: keyof typeof translations.en): string => {
    const lang = language as SupportedLanguage;
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("pf_dark_mode", String(newMode));
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setUser(currentSession?.user ?? null);
      if (event === "SIGNED_OUT") {
        setShowWelcome(false);
        setWelcomeChecked(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    const lastReadAtMs = getLastReadAtMs();
    const lastReadAtISO = lastReadAtMs > 0 ? new Date(lastReadAtMs).toISOString() : null;

    const { count: userUnread } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    let broadcastUnread = 0;

    if (lastReadAtISO) {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .is("user_id", null)
        .gt("created_at", lastReadAtISO);
      broadcastUnread = count || 0;
    } else {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .is("user_id", null);
      broadcastUnread = count || 0;
    }

    setUnreadNotifications((userUnread || 0) + broadcastUnread);
  }, [user]);

  useEffect(() => {
    if (user) {
      checkWelcomeSeen();
      fetchUnreadCount();
    }
  }, [user, fetchUnreadCount]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-inserts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const notification = payload.new as any;

        if (notification.user_id === null || notification.user_id === user.id) {
          toast({
            title: notification.title || "🔔 New Notification",
            description: notification.message?.substring(0, 100) || "",
          });
          setUnreadNotifications((prev) => prev + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const checkWelcomeSeen = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setWelcomeChecked(true);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("welcome_seen")
      .eq("id", currentUser.id)
      .maybeSingle();

    setShowWelcome(!!profile && profile.welcome_seen === false);
    setWelcomeChecked(true);
  };

  const markWelcomeSeen = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) return;

    await supabase.from("profiles").update({ welcome_seen: true }).eq("id", currentUser.id);
    setShowWelcome(false);
  };

  const openNotifications = () => {
    if (!user) return;
    setLastReadAtNow();
    setUnreadNotifications(0);
    setPage("notifications");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-primary text-lg">{t("loading")}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <SignInScreen
        setUser={setUser}
        t={t}
        onShowLanguages={() => setShowLanguages(true)}
        currentLanguage={language}
        onContinueAsGuest={() => {}}
      />
    );
  }

  if (welcomeChecked && showWelcome) {
    return (
      <WelcomeScreen
        t={t}
        onContinue={() => {
          markWelcomeSeen();
          setPage("home");
        }}
        onExploreStore={() => {
          markWelcomeSeen();
          setPage("shopping");
        }}
      />
    );
  }

  if (showLanguages) {
    return (
      <LanguagesScreen
        t={t}
        currentLanguage={language}
        onLanguageChange={(code) => {
          localStorage.setItem("pf_lang", code);
          setLanguage(code);
          setShowLanguages(false);
        }}
        onBack={() => setShowLanguages(false)}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <div className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border/50 pt-[env(safe-area-inset-top)]">
        <div className="flex justify-between items-center px-5 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setPage("settings")} className="text-orange-500">
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={openNotifications}
              className={`relative transition-colors duration-300 ${
                unreadNotifications > 0 ? "text-blue-500" : "text-orange-500"
              }`}
            >
              <Bell className="w-5 h-5" />

              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 shadow-[0_0_10px_rgba(59,130,246,0.7)]">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </button>
          </div>

          <div />

          <button onClick={() => setPage("social")} className="text-orange-500">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {page === "home" && <HomeScreen t={t} />}
        {page === "giving" && <GivingScreen t={t} />}
        {page === "shopping" && <ShoppingScreen t={t} />}
        {page === "settings" && (
          <SettingsScreen
            t={t}
            language={language}
            setLanguage={() => setShowLanguages(true)}
            userName={userName}
            userEmail={user?.email || ""}
            onAdminClick={() => setPage("admin")}
            onProfileClick={() => setPage("profile")}
            onNotificationsClick={openNotifications}
            onLegalClick={() => setPage("legal")}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onSignOut={async () => {
              await supabase.auth.signOut();
              setUser(null);
            }}
            isGuest={false}
          />
        )}

        {page === "legal" && <LegalCenter t={t} onBack={() => setPage("settings")} />}

        {page === "social" && (
          <SocialLinksScreen t={t} onBack={() => setPage("home")} onNavigateToEvents={() => setPage("events")} />
        )}

        {page === "events" && <EventsScreen t={t} />}

        {page === "prayer_request" && (
          <SubmissionForm
            type="prayer_request"
            title="Prayer Request"
            description="Share your prayer request with the Prayer & Fire ministry. Our team will lift it up in prayer."
            messageLabel="Your prayer request"
            messagePlaceholder="Share what you'd like us to pray for..."
            submitLabel="Send Prayer Request"
            successMessage="Prayer request sent. We are praying with you."
            onBack={() => setPage("home")}
          />
        )}

        {page === "testimony" && (
          <SubmissionForm
            type="testimony"
            title="Share a Testimony"
            description="Tell us what God has done. Your testimony encourages others in their walk of faith."
            messageLabel="Your testimony"
            messagePlaceholder="Share your story..."
            submitLabel="Send Testimony"
            successMessage="Thank you for sharing your testimony."
            onBack={() => setPage("home")}
          />
        )}

        {page === "contact" && (
          <SubmissionForm
            type="contact"
            title="Contact Ministry"
            description="Send a message to the Prayer & Fire ministry team."
            messageLabel="Message"
            messagePlaceholder="How can we help you?"
            submitLabel="Send Message"
            successMessage="Message sent. Thank you for reaching out."
            onBack={() => setPage("home")}
          />
        )}

        {page === "bible_study" && (
          <BibleStudyScreen onBack={() => setPage("home")} onContact={() => setPage("contact")} />
        )}

        {page === "admin" && <AdminPanel t={t} onBack={() => setPage("settings")} />}

        {page === "profile" && (
          <ProfileScreen
            t={t}
            language={language}
            setLanguage={setLanguage}
            onBack={() => setPage("settings")}
            signOut={async () => {
              await supabase.auth.signOut();
              setUser(null);
            }}
          />
        )}

        {page === "notifications" && <NotificationsScreen t={t} onBack={() => setPage("settings")} />}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <nav className="flex justify-around items-center py-3 px-4 max-w-2xl mx-auto">
          <button
            onClick={() => setPage("home")}
            className={page === "home" ? "text-orange-500" : "text-muted-foreground"}
          >
            <Flame className="w-6 h-6" />
          </button>

          <button
            onClick={() => setPage("giving")}
            className={page === "giving" ? "text-orange-500" : "text-muted-foreground"}
          >
            <Heart className="w-6 h-6" />
          </button>

          <button
            onClick={() => setPage("shopping")}
            className={page === "shopping" ? "text-orange-500" : "text-muted-foreground"}
          >
            <ShoppingBag className="w-6 h-6" />
          </button>
        </nav>
      </div>
    </div>
  );
}
