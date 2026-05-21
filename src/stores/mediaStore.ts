import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MediaKind = "image" | "audio";

export interface MediaItem {
  id: string;
  name: string;
  kind: MediaKind;
  url: string; // data URL so it persists
  size: number;
  createdAt: number;
  tags?: string[];
}

interface MediaState {
  items: MediaItem[];
  addItems: (items: MediaItem[]) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
}

export const useMediaStore = create<MediaState>()(
  persist(
    (set) => ({
      items: [],
      addItems: (items) => set((s) => ({ items: [...items, ...s.items] })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      rename: (id, name) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, name } : i)) })),
    }),
    { name: "storyou-media" }
  )
);

export async function fileToMediaItem(file: File): Promise<MediaItem | null> {
  const kind: MediaKind | null = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("audio/")
    ? "audio"
    : null;
  if (!kind) return null;
  const url = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  return {
    id: crypto.randomUUID(),
    name: file.name,
    kind,
    url,
    size: file.size,
    createdAt: Date.now(),
  };
}
