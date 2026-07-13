declare const process: { env: Record<string, string | undefined> };
import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_story",
  title: "Create story",
  description: "Save a new story to the signed-in user's StoryCloud.",
  inputSchema: {
    title: z.string().trim().min(1).max(200).describe("Story title."),
    body: z.string().trim().min(1).describe("Full story text."),
    tags: z.array(z.string().trim().min(1)).max(20).optional().describe("Optional tags."),
    category: z.string().trim().optional().describe("Optional category label."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, body, tags, category }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("stories")
      .insert({ user_id: ctx.getUserId(), title, body, tags: tags ?? null, category: category ?? null })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Created story ${data.id}` }],
      structuredContent: { story: data },
    };
  },
});
