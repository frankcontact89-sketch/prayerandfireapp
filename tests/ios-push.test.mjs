import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = await readFile("supabase/functions/community-push/index.ts", "utf8");

test("push checks group ownership as the authenticated caller and signs a production APNs request", async () => {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const key = Buffer.from(await crypto.subtle.exportKey("pkcs8", pair.privateKey)).toString("base64");
  const env = {
    SUPABASE_URL: "https://fixture.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "fixture-service",
    SUPABASE_ANON_KEY: "fixture-public", APNS_KEY_ID: "fixture-key-id", APNS_TEAM_ID: "fixture-team-id",
    APNS_PRIVATE_KEY: `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`,
  };
  let handler;
  let groupAdmin = false;
  let posts = 0;
  const tables = {
    community_group_members: [{ user_id: "recipient" }],
    community_groups: [{ name: "Fixture group" }],
    user_push_tokens: [{ token: "fixture-device", user_id: "recipient", platform: "ios" }],
  };
  const db = {
    auth: { getUser: async token => ({ data: { user: token === "fixture-session" ? { id: "owner" } : null } }) },
    rpc: () => assert.fail("Authorization used a service-role RPC"),
    from(table) {
      const rows = tables[table];
      const query = {
        select: () => query, eq: () => query, in: () => query,
        maybeSingle: async () => ({ data: rows[0] }), then: resolve => resolve({ data: rows }),
      };
      return query;
    },
  };
  runInNewContext(stripTypeScriptTypes(source.replace(/^import .*;$/gm, "")), {
    Deno: { env: { get: name => env[name] }, serve: fn => { handler = fn; } },
    crypto, btoa, atob, Uint8Array, TextEncoder, Response, corsHeaders: {},
    createClient: (_, secret, options) => {
      if (secret === env.SUPABASE_SERVICE_ROLE_KEY) return db;
      assert.equal(secret, env.SUPABASE_ANON_KEY);
      assert.equal(options.global.headers.Authorization, "Bearer fixture-session");
      return { rpc: async (name, input) => {
        assert.equal(name, "is_group_admin");
        assert.equal(input._user_id, "owner");
        assert.equal(input._group_id, "fixture-group");
        return { data: groupAdmin };
      } };
    },
    fetch: async (url, options) => {
      posts++;
      assert.equal(url, "https://api.push.apple.com/3/device/fixture-device");
      assert.equal(options.headers["apns-topic"], "com.frankcontact89.prayerandfiremobile");
      assert.equal(options.headers["apns-push-type"], "alert");
      const [header, claims, signature] = options.headers.authorization.slice(7).split(".");
      const decode = value => JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
      assert.equal(decode(header).kid, env.APNS_KEY_ID);
      assert.equal(decode(claims).iss, env.APNS_TEAM_ID);
      assert.ok(await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pair.publicKey,
        Buffer.from(signature, "base64url"), new TextEncoder().encode(`${header}.${claims}`)));
      assert.equal(JSON.parse(options.body).group_id, "fixture-group");
      return new Response(null, { status: 200 });
    },
  });

  const invoke = token => handler(new Request("https://fixture.supabase.co/functions/v1/community-push", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ kind: "invite", group_id: "fixture-group", user_ids: ["recipient"] }),
  }));
  assert.equal((await invoke("bad-session")).status, 401);
  assert.equal((await invoke("fixture-session")).status, 403);
  assert.equal(posts, 0);
  groupAdmin = true;
  const result = await (await invoke("fixture-session")).json();
  assert.equal(result.dispatched, 1);
  assert.equal(posts, 1);
});
