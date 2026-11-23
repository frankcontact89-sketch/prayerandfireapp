// Run with Node 24. Install jsdom@26.1.0 in a temporary prefix and put it on NODE_PATH.
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { stripTypeScriptTypes } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");
const session = "fixture-supabase-access-token";
const appUser = "fixture-app-user";
const student = "fixture-student";
const course = { id: "fixture-course", slug: "fixture-only", title: "Fixture course", description: null, total_lessons: 2, is_published: true };
const lesson = (number, title) => ({
  id: `00000000-0000-4000-8000-00000000000${number}`, course_id: course.id, lesson_number: number, title,
  description: null, summary: null, duration_minutes: 8, release_at: null, is_published: true,
  mux_playback_id: "synthetic_video", videos: [{ name: "Video two", playback_id: "synthetic_extra" }],
  attachments: [{ name: "Fixture audio", type: "audio", path: "test-only/audio.wav" }],
});
const first = lesson(1, "Fixture first"), second = lesson(2, "Fixture second"), locked = lesson(3, "Fixture locked");
const audioUrl = "https://yecywtxbuhfukergbwfc.supabase.co/storage/v1/object/sign/abba-course-files/test-only/audio.wav?token=fixture";
const rows = {
  abba_courses: [course], abba_lessons: [second, locked, first],
  abba_mobile_identity_links: [{ prayer_fire_user_id: appUser, academy_user_id: student, revoked_at: null }],
  abba_enrollments: [{ user_id: student, course_id: course.id, status: "active", expires_at: null }],
  abba_lesson_progress: [],
};

function dbQuery(table) {
  let filtered = rows[table].slice();
  const query = {
    select: () => query,
    eq: (key, value) => { filtered = filtered.filter(row => row[key] === value); return query; },
    is: (key, value) => query.eq(key, value),
    in: (key, values) => { filtered = filtered.filter(row => values.includes(row[key])); return query; },
    order: key => { filtered = filtered.sort((a,b) => a[key] > b[key] ? 1 : -1); return query; },
    maybeSingle: async () => ({ data: filtered[0] ?? null }),
    then: resolve => resolve({ data: filtered }),
    upsert: async next => {
      assert.equal(table, "abba_lesson_progress");
      assert.equal(next.user_id, student);
      rows[table] = rows[table].filter(row => row.user_id !== next.user_id || row.lesson_id !== next.lesson_id);
      rows[table].push(next);
      return {};
    },
  };
  return query;
}

const source = await readFile("supabase/academy/abba-mobile-bridge-independent/index.ts", "utf8");
let handle;
const appUrl = "https://xikmhnulxksadgvzajdk.supabase.co";
const mockDb = {
  from: dbQuery,
  storage: { from(bucket) {
    assert.equal(bucket, "abba-course-files");
    return { createSignedUrl: async path => {
      assert.equal(path, "test-only/audio.wav");
      return { data: { signedUrl: audioUrl } };
    } };
  } },
};
runInNewContext(stripTypeScriptTypes(source.replace(/^import .*;$/m, "")), {
  Response,
  console,
  Deno: { serve: fn => { handle = fn; }, env: { get: name => name } },
  createClient: url => url === appUrl ? {
    auth: { getUser: async token => ({ data: { user: token === session ? { id: appUser } : null } }) },
  } : mockDb,
});

test("Academy app opens and navigates linked enrollment, resolves media and reloads saved progress", async () => {
  const dir = await mkdtemp(join(tmpdir(), "pf-abba-ui-"));
  const dom = new JSDOM('<main id="root"></main>', { url: "https://localhost", pretendToBeVisual: true });
  const originalFetch = globalThis.fetch;
  const request = (path, init) => handle(new Request(path, init));
  const url = "https://yecywtxbuhfukergbwfc.supabase.co/functions/v1/abba-mobile-bridge-independent";
  const auth = { Authorization: `Bearer ${session}`, "Content-Type": "application/json" };
  const call = data => request(url, { method: "POST", headers: auth, body: JSON.stringify(data) });
  assert.equal((await request(url)).status, 401);
  assert.equal((await request(url, { headers: { ...auth, Origin: "https://unexpected.example" } })).status, 403);
  assert.equal((await call({ action: "lesson_content", lesson_id: locked.id })).status, 403);
  const enrollment = rows.abba_enrollments[0];
  enrollment.expires_at = "2000-01-01T00:00:00Z";
  assert.equal((await (await request(url, { headers: auth })).json()).status, "not_enrolled");
  assert.equal((await call({ action: "save_position", lesson_id: first.id, position_seconds: 20 })).status, 200);
  assert.equal(rows.abba_lesson_progress.length, 0, "Expired enrollment wrote no data");
  enrollment.expires_at = null;

  let ui;
  try {
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.fetch = (path, init) => {
      assert.equal(String(path), url, "Only the independent, allowlisted bridge is called");
      assert.equal(init.headers.Authorization, auth.Authorization, "Uses the existing app session");
      return request(path, init);
    };
    const outfile = join(dir, "academy.cjs");
    await build({
      stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
        import React from "react";
        import { createRoot } from "react-dom/client";
        import { AbbaAcademyPortalScreen } from "./src/components/ChristianLibraryScreen";
        const root = createRoot(document.getElementById("root"));
        root.render(<AbbaAcademyPortalScreen onBack={() => {}} language="en" />);
        export const unmount = () => root.unmount();
      ` },
      bundle: true, platform: "node", outfile, format: "cjs",
      define: { "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(appUrl) },
      plugins: [{ name: "mock-supabase-session", setup(plugin) {
        plugin.onResolve({ filter: /^@\/integrations\/supabase\/client$/ }, () => ({ path: "fixture", namespace: "test-auth" }));
        plugin.onLoad({ filter: /.*/, namespace: "test-auth" }, () => ({ contents: `
          export const supabase = { auth: {
            getSession: async () => ({data:{session:{access_token:${JSON.stringify(session)}}}}),
            getUser: async () => ({data:{user:{id:${JSON.stringify(appUser)}}}}),
            onAuthStateChange: () => ({data:{subscription:{unsubscribe(){}}}})
          }};
        ` }));
      } }],
    });
    ui = require(outfile);
    async function until(check, label) {
      for (let i = 0; i < 120; i++) {
        const value = check();
        if (value) return value;
        await sleep(15);
      }
      assert.fail(label);
    }
    const button = label => until(() => [...document.querySelectorAll("button")].find(el => el.textContent.includes(label)), "Missing button " + label);
    (await button("Fixture course")).click();
    (await button("Continue studying")).click();
    const video = await until(() => document.querySelector("video"), "Missing video");
    assert.match(video.src, /synthetic_video\.m3u8$/);
    assert.equal(document.querySelectorAll("video").length, 2);
    assert.equal(document.querySelector('a[href*="audio.wav"]').href, audioUrl);
    assert.equal(document.querySelector('input[type="password"]'), null);
    video.currentTime = 31;
    video.dispatchEvent(new dom.window.Event("pause"));
    await until(() => rows.abba_lesson_progress.some(row => row.last_position_seconds === 31), "Playback position was not saved");
    (await button("Mark lesson complete")).click();
    await until(() => document.querySelector('[role="progressbar"]')?.getAttribute("aria-valuenow") === "50", "Progress was not reloaded");
    (await button("Next lesson")).click();
    await until(() => document.querySelector("h3")?.textContent === "Fixture second", "Next lesson did not open");
    (await button("Previous lesson")).click();
    await until(() => document.body.textContent.includes("0:31"), "Saved position was not shown on return");
    assert.equal(document.body.textContent.includes("Fixture locked"), false);
  } finally {
    ui?.unmount();
    dom.window.close();
    globalThis.fetch = originalFetch;
    delete globalThis.window;
    delete globalThis.document;
    await rm(dir, { recursive: true, force: true });
  }
});
