import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const oauthApi = (): OAuthApi => (supabase.auth as any).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [needSignIn, setNeedSignIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    if (!authorizationId) return setError("Missing authorization_id in URL.");
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      setNeedSignIn(true);
      return;
    }
    setSessionUser(sess.session.user);
    setNeedSignIn(false);
    try {
      const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (error) return setError(error.message || "Could not load this authorization request.");
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    } catch (e: any) {
      setError(e?.message || "Could not load this authorization request.");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorizationId]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSignInError(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        setSignInError(error.message);
        setBusy(false);
        return;
      }
      setBusy(false);
      await load();
    } catch (err: any) {
      setSignInError(err?.message || "Sign-in failed.");
      setBusy(false);
    }
  }

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    try {
      const { data, error } = approve
        ? await oauthApi().approveAuthorization(authorizationId)
        : await oauthApi().denyAuthorization(authorizationId);
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setError("No redirect returned by the authorization server.");
        setBusy(false);
        return;
      }
      window.location.href = target;
    } catch (e: any) {
      setError(e?.message || "Authorization failed.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <h1 className="text-xl font-bold text-foreground">Prayer & Fire</h1>
        </div>

        {error && (
          <div className="text-sm text-destructive border border-destructive/40 rounded-lg p-3">
            {error}
          </div>
        )}

        {needSignIn && !error && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Sign in to continue</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to your Prayer & Fire account to authorize this connection.
              </p>
            </div>
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {signInError && <p className="text-sm text-destructive">{signInError}</p>}
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </>
        )}

        {!needSignIn && !error && !details && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}

        {!needSignIn && details && (
          <>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Connect {details.client?.name ?? "an app"} to your account
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                This lets {details.client?.name ?? "the client"} use Prayer & Fire tools as you
                {sessionUser?.email ? ` (${sessionUser.email})` : ""}.
              </p>
            </div>

            <div className="text-sm text-muted-foreground border border-border rounded-lg p-3 space-y-1">
              <p>The client can:</p>
              <ul className="list-disc pl-5">
                <li>Read your profile, notifications, and purchases</li>
                <li>List upcoming events</li>
                <li>RSVP to events on your behalf</li>
              </ul>
              <p className="text-xs mt-2">
                This does not bypass Prayer & Fire's permissions or backend policies.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={busy}
                onClick={() => decide(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={busy}
                onClick={() => decide(true)}
              >
                {busy ? "Working…" : "Approve"}
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}