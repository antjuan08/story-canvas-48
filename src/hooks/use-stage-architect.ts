import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface StageBrief {
  title: string;
  template_type: "sermon" | "keynote" | "podcast" | "book";
  topic: string;
  audience: string;
  outcome: string;
  dynamics: string[];
  pain_points: string;
  solution: string;
  length_minutes: number;
}

export interface OutlineSection {
  section_title: string;
  beat: string;
  notes: string;
  story_ids: string[];
}

export interface StagePlan {
  summary: string;
  suggested_tags: string[];
  outline: OutlineSection[];
}

export function useStageArchitect() {
  const [generating, setGenerating] = useState(false);

  const generate = async (brief: StageBrief): Promise<{ plan: StagePlan; story_count: number } | null> => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("stage-architect", { body: brief });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { plan: StagePlan; story_count: number };
    } catch (e: any) {
      toast.error(e?.message ?? "Could not generate outline");
      return null;
    } finally {
      setGenerating(false);
    }
  };

  return { generate, generating };
}
