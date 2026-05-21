import { Music, Image as ImageIcon, Trash2, Download } from "lucide-react";
import { MediaItem, useMediaStore } from "@/stores/mediaStore";
import { Button } from "@/components/ui/button";

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaCard({ item }: { item: MediaItem }) {
  const remove = useMediaStore((s) => s.remove);

  return (
    <div className="glass-card overflow-hidden group hover:shadow-apple-lg transition-apple flex flex-col">
      <div className="aspect-video bg-surface-tertiary relative flex items-center justify-center">
        {item.kind === "image" ? (
          <img src={item.url} alt={item.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 w-full">
            <div className="h-12 w-12 rounded-2xl orb-glow flex items-center justify-center text-white">
              <Music className="h-5 w-5" />
            </div>
            <audio src={item.url} controls className="w-full max-w-[240px]" />
          </div>
        )}
      </div>
      <div className="p-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate flex items-center gap-1.5">
            {item.kind === "image" ? <ImageIcon className="h-3.5 w-3.5 shrink-0" /> : <Music className="h-3.5 w-3.5 shrink-0" />}
            {item.name}
          </p>
          <p className="text-xs text-muted-foreground">{formatBytes(item.size)}</p>
        </div>
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <a href={item.url} download={item.name}>
            <Download className="h-4 w-4" />
          </a>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => remove(item.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
