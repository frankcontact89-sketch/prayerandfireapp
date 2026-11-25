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

test("selected prayer invitations require group authority and intersect eligible recipients", async () => {
  const groupId = "00000000-0000-4000-8000-000000000001";
  const selected = "00000000-0000-4000-8000-000000000002";
  const other = "00000000-0000-4000-8000-000000000003";
  const ineligible = "00000000-0000-4000-8000-000000000004";
  let handler;
  let canInvite = false;
  let claimed = 0;
  let addressed = [];
  const service = {
    auth: { getUser: async () => ({ data: { user: { id: "caller" } } }) },
    rpc: async (name, args) => {
      assert.equal(name, "community_call_push_targets");
      assert.equal(args._group_id, groupId);
      assert.equal(args._caller_id, "caller");
      claimed++;
      return { data: [{ user_id: selected }, { user_id: other }] };
    },
    from(table) {
      const query = {
        select: () => query,
        eq: () => query,
        in: (column, ids) => {
          assert.equal(table, "user_push_tokens");
          assert.equal(column, "user_id");
          addressed = Array.from(ids);
          return query;
        },
        maybeSingle: async () => ({ data: { user_id: "caller", name: "Group" } }),
        then: resolve => resolve({ data: [] }),
      };
      return query;
    },
  };
  runInNewContext(stripTypeScriptTypes(source.replace(/^import .*;$/gm, "")), {
    Deno: { env: { get: name => name === "SUPABASE_SERVICE_ROLE_KEY" ? "service" : "fixture" }, serve: fn => { handler = fn; } },
    Response, corsHeaders: {},
    createClient: (_, role) => role === "service" ? service : {
      rpc: async (name, args) => {
        assert.equal(name, "is_group_admin");
        assert.equal(args._group_id, groupId);
        assert.equal(args._user_id, "caller");
        return { data: canInvite };
      },
    },
  });
  const invoke = ids => handler(new Request("https://fixture.supabase.co/community-push", {
    method: "POST",
    headers: { Authorization: "Bearer fixture-session" },
    body: JSON.stringify({ kind: "call_selected", group_id: groupId, user_ids: ids }),
  }));
  assert.equal((await invoke(["invalid"])).status, 400);
  assert.equal((await invoke([selected])).status, 403);
  assert.equal(claimed, 0);
  canInvite = true;
  await invoke([selected, selected, ineligible]);
  assert.equal(claimed, 1);
  assert.deepEqual(addressed, [selected]);
});
