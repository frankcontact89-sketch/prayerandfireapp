import { isIP } from "node:net";

const sanitize = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, "");

export async function turnixCredentials(request: Request, room: string, userId: string, token: string | undefined, cors: HeadersInit) {
  const headers = new Headers(cors);
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  const reply = (body: unknown, status = 200) => Response.json(body, { status, headers });
  if (!token?.trim()) {
    console.error("[community-push] TURNIX_API_TOKEN is missing");
    return reply({ error: "TURN is not configured" }, 500);
  }

  const upstreamHeaders = new Headers({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });
  // Supabase hosted ingress: use the Cloudflare client IP, never a caller-supplied forwarding chain.
  const ip = request.headers.get("cf-connecting-ip")?.trim();
  if (ip && isIP(ip)) upstreamHeaders.set("X-TURN-CLIENT-IP", ip);

  try {
    const response = await fetch("https://turnix.io/api/v1/credentials/ice", {
      method: "POST",
      headers: upstreamHeaders,
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({ ttl: 3600, room: sanitize(room), initiator_client: sanitize(userId) }),
    });
    if (response.status === 401) {
      console.error("[community-push] Turnix API token is invalid");
      return reply({ error: "TURN credentials unavailable" }, 502);
    }
    if (response.status === 429) return reply({ error: "TURN usage limit reached" }, 503);
    if (!response.ok) {
      console.warn("[community-push] Turnix request failed", response.status);
      return reply({ error: "TURN credentials unavailable" }, 502);
    }
    const { iceServers, expiresAt } = await response.json();
    if (!Array.isArray(iceServers) || typeof expiresAt !== "string" || !(Date.parse(expiresAt) > Date.now() + 60_000)) {
      return reply({ error: "Invalid TURN provider response" }, 502);
    }
    const servers = iceServers.flatMap(server => {
      const urls = [server?.urls].flat().filter(url => typeof url === "string" && /^(stun|turn|turns):[^\s]+$/i.test(url));
      if (!urls.length) return [];
      if (urls.some(url => /^turns?:/i.test(url))) {
        if (typeof server.username !== "string" || !server.username || typeof server.credential !== "string" || !server.credential) return [];
        return [{ urls, username: server.username, credential: server.credential }];
      }
      return [{ urls }];
    });
    if (!servers.some(server => "credential" in server)) return reply({ error: "Invalid TURN provider response" }, 502);
    return reply({ iceServers: servers, expiresAt });
  } catch {
    console.warn("[community-push] Turnix request could not be completed");
    return reply({ error: "TURN credentials unavailable" }, 502);
  }
}
