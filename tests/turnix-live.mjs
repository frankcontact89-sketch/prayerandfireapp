import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { lookup } from "node:dns/promises";
import { writeFile } from "node:fs/promises";

const base = "https://xikmhnulxksadgvzajdk.supabase.co";
const apikey = process.env.PRAYER_TEST_PUBLISHABLE_KEY;
const output = process.env.PRAYER_TEST_ICE_FILE;
assert.ok(apikey?.startsWith("sb_publishable_") && output, "Test configuration missing");

async function post(path, payload, accessToken) {
  const response = await fetch(base + path, {
    method: "POST",
    headers: { apikey, "Content-Type": "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });
  assert.ok(response.ok, `Request to ${path} failed with HTTP ${response.status}`);
  return response.json();
}

const auth = await post("/auth/v1/signup", {
  email: `pf-turn-relay-${randomUUID()}@example.com`,
  password: `Ax!9-${randomBytes(24).toString("hex")}`,
});
const id = auth.user?.id ?? auth.id;
if (/^[a-f0-9-]{36}$/.test(id ?? "")) console.log(`Temporary test user for cleanup: ${id}`);
assert.ok(auth.access_token, "Test-project registration did not return a session");
const credentials = {};
for (const name of ["alice", "bob"]) {
  const result = await post("/functions/v1/community-push", { kind: "ice", group_id: "community-general" }, auth.access_token);
  const turn = result.iceServers?.find(server => server.urls.some(url => /^turns?:/i.test(url)));
  assert.ok(turn?.username && turn?.credential, "Function returned no TURN credentials");
  for (const url of turn.urls) {
    if (!/^turns?:/i.test(url)) continue;
    const host = new URL(url.replace(/^turns?:/i, "https://")).hostname;
    await lookup(host);
  }
  console.log(`${name}: HTTP 200, ${result.iceServers.length} ICE entries; TURN DNS resolved`);
  credentials[name] = result;
}
await writeFile(output, JSON.stringify(credentials), { mode: 0o600, flag: "wx" });
