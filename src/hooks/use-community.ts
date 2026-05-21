import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface CommunityPost {
  id: string;
  user_id: string;
  story_id: string | null;
  caption: string | null;
  created_at: string;
  story?: {
    id: string;
    title: string;
    body: string | null;
    image_url: string | null;
    audio_url: string | null;
    video_url: string | null;
    tags: string[] | null;
    category: string | null;
    is_licensable: boolean;
    is_public: boolean;
    user_id: string;
  } | null;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    title: string | null;
  } | null;
}

export function useCommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: postsData, error } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error || !postsData) {
      setPosts([]);
      setLoading(false);
      return;
    }
    const storyIds = postsData.map((p) => p.story_id).filter(Boolean) as string[];
    const userIds = Array.from(new Set(postsData.map((p) => p.user_id)));

    const [storiesRes, profilesRes] = await Promise.all([
      storyIds.length
        ? supabase.from("stories").select("*").in("id", storyIds)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("profiles").select("id, full_name, avatar_url, title").in("id", userIds),
    ]);

    const storiesMap = new Map((storiesRes.data ?? []).map((s: any) => [s.id, s]));
    const profilesMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));

    setPosts(
      postsData.map((p) => ({
        ...p,
        story: p.story_id ? storiesMap.get(p.story_id) ?? null : null,
        author: profilesMap.get(p.user_id) ?? null,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { posts, loading, refresh: load };
}

export function useLicenseRequests() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [inc, out] = await Promise.all([
      supabase.from("license_requests").select("*, story:stories(*)").eq("owner_id", user.id).order("created_at", { ascending: false }),
      supabase.from("license_requests").select("*, story:stories(*)").eq("requester_id", user.id).order("created_at", { ascending: false }),
    ]);
    setIncoming(inc.data ?? []);
    setOutgoing(out.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { incoming, outgoing, loading, refresh: load };
}
