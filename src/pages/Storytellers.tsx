import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { useCommunityFeed } from "@/hooks/use-community";
import { CommunityPostCard } from "@/components/storytellers/CommunityPostCard";
import { LicenseRequestsPanel } from "@/components/storytellers/LicenseRequestsPanel";
import { SharePostDialog } from "@/components/storytellers/SharePostDialog";

export function Storytellers() {
  const { posts, loading, refresh } = useCommunityFeed();
  const [shareOpen, setShareOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = posts.filter((p) => {
    if (!q) return true;
    const hay = `${p.caption ?? ""} ${p.story?.title ?? ""} ${p.story?.tags?.join(" ") ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storytellers</h1>
          <p className="text-muted-foreground mt-1">Discover, license, and cross-post stories from the community.</p>
        </div>
        <Button onClick={() => setShareOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Share a Story
        </Button>
      </div>

      <Tabs defaultValue="feed">
        <TabsList>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="licensing">Licensing</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4 mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, stories, tags..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading feed...</p>
          ) : filtered.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground">Be the first to share a story with the community.</p>
            </div>
          ) : (
            <div className="grid gap-4 max-w-2xl mx-auto">
              {filtered.map((p) => (
                <CommunityPostCard key={p.id} post={p} onChanged={refresh} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="licensing" className="mt-4">
          <LicenseRequestsPanel />
        </TabsContent>
      </Tabs>

      <SharePostDialog open={shareOpen} onOpenChange={setShareOpen} onPosted={refresh} />
    </div>
  );
}
