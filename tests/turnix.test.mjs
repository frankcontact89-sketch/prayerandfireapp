import assert from "node:assert/strict";
import test from "node:test";
import { turnixCredentials } from "../supabase/functions/community-push/turnix.ts";

const token = "fixture-project-token";
const request = new Request("https://example.supabase.co/functions/v1/community-push", {
  headers: { "cf-connecting-ip": "8.8.4.4", "x-forwarded-for": "1.1.1.1" },
});

test("forwards trusted IP and project token, returns only short-lived ICE configuration", async t => {
  const expiresAt = new Date(Date.now() + 3600_000).toISOString();
  const iceServers = [
    { urls: ["stun:stun.turnix.io:3478"] },
    { urls: ["turn:us.turnix.io:3478?transport=udp"], username: "session", credential: "temporary" },
  ];
  const fetchMock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://turnix.io/api/v1/credentials/ice");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.get("Authorization"), `Bearer ${token}`);
    assert.equal(options.headers.get("X-TURN-CLIENT-IP"), "8.8.4.4");
    assert.ok(options.signal instanceof AbortSignal);
    assert.deepEqual(JSON.parse(options.body), { ttl: 3600, room: "room-123_", initiator_client: "user_42" });
    return Response.json({ iceServers, expiresAt, token });
  });

  const response = await turnixCredentials(request, "room-123_!", "user_42?", token, {});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  const body = await response.text();
  assert.equal(body.includes(token), false);
  assert.deepEqual(JSON.parse(body), { iceServers, expiresAt });
  assert.equal(fetchMock.mock.callCount(), 1);
});

test("maps missing token and upstream errors without exposing provider bodies", async t => {
  const log = t.mock.method(console, "error", () => {});
  const fetchMock = t.mock.method(globalThis, "fetch");
  const missing = await turnixCredentials(request, "room", "user", undefined, {});
  assert.equal(missing.status, 500);
  assert.equal(fetchMock.mock.callCount(), 0);
  for (const [upstream, expected] of [[401, 502], [422, 502], [429, 503]]) {
    fetchMock.mock.mockImplementation(async () => Response.json({ error: token }, { status: upstream }));
    const response = await turnixCredentials(request, "room", "user", token, {});
    assert.equal(response.status, expected);
    const body = await response.text();
    assert.equal(body.includes(token), false);
    if (upstream === 429) assert.deepEqual(JSON.parse(body), { error: "TURN usage limit reached" });
  }
  assert.equal(JSON.stringify(log.mock.calls.map(call => call.arguments)).includes(token), false);
});

test("ignores untrusted forwarding and rejects expired provider credentials", async t => {
  const forwarded = new Request(request.url, { headers: { "x-forwarded-for": "1.1.1.1" } });
  const fetchMock = t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.headers.has("X-TURN-CLIENT-IP"), false);
    return Response.json({
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      iceServers: [{ urls: ["turn:us.turnix.io:3478"], username: "old", credential: "old" }],
    });
  });
  assert.equal((await turnixCredentials(forwarded, "room", "user", token, {})).status, 502);
  assert.equal(fetchMock.mock.callCount(), 1);
});
