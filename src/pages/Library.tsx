import { useState } from "react";
import { Image as ImageIcon, Music, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMediaStore } from "@/stores/mediaStore";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UploadZone } from "@/components/media/UploadZone";
import { MediaCard } from "@/components/media/MediaCard";

export function Library() {
  const items = useMediaStore((s) => s.items);
  const [q, setQ] = useState("");
  const filtered = items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));
  const images = filtered.filter((i) => i.kind === "image");
  const audio = filtered.filter((i) => i.kind === "audio");

  const Grid = ({ list }: { list: typeof items }) =>
    list.length === 0 ? (
      <div className="glass-card p-12 text-center text-muted-foreground">
        <Sparkles className="h-8 w-8 mx-auto mb-3 text-gradient-primary" />
        Nothing here yet. Upload above to get started.
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map((i) => <MediaCard key={i.id} item={i} />)}
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Library</h1>
        <p className="text-muted-foreground mt-1">
          Your CMS for images and audio. Drop files in, reuse them across your stories.
        </p>
      </div>

      <UploadZone />

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search your library..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-md rounded-2xl"
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="all" className="rounded-xl">All ({filtered.length})</TabsTrigger>
          <TabsTrigger value="images" className="rounded-xl gap-1.5">
            <ImageIcon className="h-3.5 w-3.5" /> Images ({images.length})
          </TabsTrigger>
          <TabsTrigger value="audio" className="rounded-xl gap-1.5">
            <Music className="h-3.5 w-3.5" /> Audio ({audio.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6"><Grid list={filtered} /></TabsContent>
        <TabsContent value="images" className="mt-6"><Grid list={images} /></TabsContent>
        <TabsContent value="audio" className="mt-6"><Grid list={audio} /></TabsContent>
      </Tabs>
    </div>
  );
}
