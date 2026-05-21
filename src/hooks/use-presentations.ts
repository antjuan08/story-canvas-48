import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";

export type Presentation = Database["public"]["Tables"]["presentations"]["Row"];

export const STAGE_TEMPLATES = [
  { value: "sermon", label: "Sermon", description: "Scripture, message, call to action." },
  { value: "keynote", label: "Keynote", description: "Hook, narrative arc, big idea." },
  { value: "podcast", label: "Podcast", description: "Intro, segments, outro." },
  { value: "book", label: "Book", description: "Chapters built from your stories." },
] as const;

export type StageTemplate = (typeof STAGE_TEMPLATES)[number]["value"];

export function usePresentations() {
  const { user } = useAuth();
  const [items, setItems] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("presentations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { presentations: items, loading, refetch };
}
