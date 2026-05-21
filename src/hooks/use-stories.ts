import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";

export type Story = Database["public"]["Tables"]["stories"]["Row"];
export type StoryInsert = Database["public"]["Tables"]["stories"]["Insert"];
export type Folder = Database["public"]["Tables"]["folders"]["Row"];

/** Heuristic A–D grade based on completeness. */
export function gradeStory(s: Story): "A" | "B" | "C" | "D" {
  let score = 0;
  if (s.title?.trim()) score += 10;
  if (s.body && s.body.length > 200) score += 30;
  else if (s.body && s.body.length > 50) score += 15;
  if (s.image_url) score += 15;
  if (s.audio_url) score += 15;
  if (s.video_url) score += 10;
  if (s.tags && s.tags.length > 0) score += 10;
  if (s.category) score += 5;
  if (s.is_public) score += 5;
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 35) return "C";
  return "D";
}

export function useStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setStories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (!error && data) setStories(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { stories, loading, refetch };
}

export function useFolders(context: "vault" | "stage" | "recordings" = "vault") {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);

  const refetch = useCallback(async () => {
    if (!user) return setFolders([]);
    const { data } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", user.id)
      .eq("context", context)
      .order("name");
    if (data) setFolders(data);
  }, [user, context]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { folders, refetch };
}

/** Upload a file to the story-media bucket. Returns public URL. */
export async function uploadStoryMedia(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("story-media").upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("story-media").getPublicUrl(path);
  return data.publicUrl;
}
