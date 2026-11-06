import { supabase } from "@/integrations/supabase/client";
import type { AcademyAccess } from "./abbaAcademy";

/**
 * A future trusted backend must verify the Prayer & Fire JWT, map the identity
 * to an ABBA student and enforce enrollment using server-side credentials.
 * Never send an app access token to the public Academy website or arbitrary URLs.
 */
const BRIDGE_ORIGIN = "https://prayerandfire.org";
const BRIDGE_PATH = "/api/mobile/academy";

export async function loadAcademyAccess(signal?: AbortSignal): Promise<AcademyAccess> {
  // Disabled until the authenticated endpoint is deployed and verified.
  // This prevents accidental requests to a nonexistent endpoint or a public site.
  if (import.meta.env.VITE_ABBA_NATIVE_BRIDGE_ENABLED !== "true") {
    return { status: "unavailable" };
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token) return { status: "unavailable" };

  try {
    const url = new URL(BRIDGE_PATH, BRIDGE_ORIGIN);
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal,
    });
    if (!response.ok) return { status: "unavailable" };
    const body: unknown = await response.json();
    if (!body || typeof body !== "object" || !("status" in body)) {
      return { status: "unavailable" };
    }
    const value = body as Record<string, unknown>;
    if (value.status === "not_enrolled" && Array.isArray(value.courses)) {
      return { status: "not_enrolled", courses: value.courses as Extract<AcademyAccess, { status: "not_enrolled" }>["courses"] };
    }
    if (value.status === "enrolled" && Array.isArray(value.courses) &&
        Array.isArray(value.lessons) && Array.isArray(value.progress)) {
      return {
        status: "enrolled",
        courses: value.courses as Extract<AcademyAccess, { status: "enrolled" }>["courses"],
        lessons: value.lessons as Extract<AcademyAccess, { status: "enrolled" }>["lessons"],
        progress: value.progress as Extract<AcademyAccess, { status: "enrolled" }>["progress"],
      };
    }
  } catch {
    // Network, parsing and aborted requests must not bypass enrollment.
  }
  return { status: "unavailable" };
}
