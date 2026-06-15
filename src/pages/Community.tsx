import { useEffect, useState } from "react";
import { TabNav } from "@/components/nav/TabNav";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

type Post = {
  id: string;
  user_id: string;
  story_id: string | null;
  caption: string | null;
  created_at: string;
};

type Profile = { id: string; full_name: string | null; avatar_url: string | null; title: string | null };

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      const list = (data ?? []) as Post[];
      setPosts(list);
      const userIds = Array.from(new Set(list.map((p) => p.user_id)));
      if (userIds.length) {
        const { data: profs } = await supabase.rpc("get_public_profiles", { user_ids: userIds });
        const map: Record<string, Profile> = {};
        (profs ?? []).forEach((p: any) => { map[p.id] = p; });
        setProfiles(map);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <SEO
        title="Community · StoryYou"
        description="Read and share stories from the StoryYou community of storytellers, speakers, and creators."
        path="/community"
        jsonLd={posts.slice(0, 20).map((p) => ({
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          headline: p.caption?.slice(0, 80) ?? "Community story",
          author: { "@type": "Person", name: profiles[p.user_id]?.full_name ?? "Storyteller" },
          datePublished: p.created_at,
        }))}
      />
      <TabNav active="Stories" />
      <div className="max-w-3xl mx-auto px-6 pt-10 pb-20">
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-foreground/50 mb-3">Community</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">
            Stories from the storytellers.
          </h1>
          <p className="text-foreground/60 mt-3 max-w-xl">
            Read and share what's been told. Open to everyone on every plan.
          </p>
        </header>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-foreground/50" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 font-serif text-xl text-foreground/50">
            No stories shared yet. Be the first.
          </div>
        ) : (
          <ul className="space-y-6">
            {posts.map((p) => {
              const prof = profiles[p.user_id];
              return (
                <li key={p.id} className="rounded-3xl border border-foreground/10 bg-background/70 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-9 w-9">
                      {prof?.avatar_url ? <AvatarImage src={prof.avatar_url} /> : null}
                      <AvatarFallback className="bg-foreground/10 text-xs">
                        {(prof?.full_name ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{prof?.full_name ?? "Storyteller"}</div>
                      <div className="text-[11px] text-foreground/50">
                        {prof?.title ?? new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {p.caption && <p className="font-serif text-lg leading-relaxed">{p.caption}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
