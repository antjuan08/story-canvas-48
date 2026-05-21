import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { fileToMediaItem, useMediaStore } from "@/stores/mediaStore";
import { toast } from "sonner";

export function UploadZone() {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const addItems = useMediaStore((s) => s.addItems);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const items = (await Promise.all(Array.from(files).map(fileToMediaItem))).filter(
      (i): i is NonNullable<typeof i> => !!i
    );
    if (items.length) {
      addItems(items);
      toast.success(`Added ${items.length} file${items.length > 1 ? "s" : ""} to library`);
    } else {
      toast.error("Only image and audio files are supported");
    }
  };

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        void handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "glass-card cursor-pointer border-dashed p-10 text-center transition-apple hover:border-primary",
        drag && "border-primary bg-primary-soft/30"
      )}
    >
      <input
        ref={ref}
        type="file"
        accept="image/*,audio/*"
        multiple
        hidden
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl orb-glow text-white">
        <Upload className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-semibold">Drop images or audio here</h3>
      <p className="text-sm text-muted-foreground">or click to browse — stored in your library</p>
    </div>
  );
}
