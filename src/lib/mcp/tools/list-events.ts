declare const process: { env: Record<string, string | undefined> };
import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function client(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_events",
  title: "List upcoming events",
  description: "List upcoming Prayer & Fire events (active, ordered by date).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max events to return. Default 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await client(ctx)
      .from("events")
      .select("id, title, description, event_date, end_date, location, is_online, registration_url")
      .eq("is_active", true)
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { events: data ?? [] },
    };
  },
});