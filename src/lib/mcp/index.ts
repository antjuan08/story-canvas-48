import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listStoriesTool from "./tools/list-stories";
import getStoryTool from "./tools/get-story";
import createStoryTool from "./tools/create-story";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "storyou-mcp",
  title: "Storyou",
  version: "0.1.0",
  instructions:
    "Tools for Storyou: browse and add stories in the signed-in user's StoryCloud. Use `list_stories` to find stories, `get_story` to read one, and `create_story` to save a new one.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listStoriesTool, getStoryTool, createStoryTool],
});
