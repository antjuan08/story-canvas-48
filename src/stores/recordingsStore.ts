import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Recording {
  id: string;
  name: string;
  url: string; // data URL
  duration: number; // seconds
  createdAt: number;
  transcript?: string;
  story?: string;
}

interface RecordingsState {
  items: Recording[];
  add: (r: Recording) => void;
  remove: (id: string) => void;
  rename: (id: string, name: string) => void;
  setTranscript: (id: string, transcript: string) => void;
  setStory: (id: string, story: string) => void;
}

export const useRecordingsStore = create<RecordingsState>()(
  persist(
    (set) => ({
      items: [],
      add: (r) => set((s) => ({ items: [r, ...s.items] })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      rename: (id, name) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, name } : i)) })),
      setTranscript: (id, transcript) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, transcript } : i)) })),
      setStory: (id, story) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, story } : i)) })),
    }),
    { name: "storyou-recordings" }
  )
);
