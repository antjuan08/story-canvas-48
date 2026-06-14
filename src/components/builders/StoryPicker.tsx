import { useState } from "react";
import { Loader2, Sparkles, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useStories } from "@/hooks/use-stories";
import { cn } from "@/lib/utils";

type Purpose = "keynote" | "podcast" | "book";
type Mode = "manual" | "ai";

interface Suggestion { story_id: string; title: string; reason: string }

interface Props {
  purpose: Purpose;
  /** Short brief AI uses to pick (audience + core message, topic, premise, etc.) */
  context: string;
  selected: string[];
  onChange: (ids: string[]) => void;
  max?: number;
}

/** Shared "pull from stories or let AI pick" step for builders. */
export function StoryPicker({ purpose, context, selected, onChange, max = 5 }: Props) {
  const { stories } = useStories();
  const [mode, setMode] = useState<Mode>("manual");
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const askAi = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("suggest-stories", {
      body: { purpose, context, max },
    });
    setBusy(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "AI couldn't pick stories");
      return;
    }
    const list: Suggestion[] = data?.suggestions ?? [];
    setSuggestions(list);
    onChange(list.map((s) => s.story_id));
    if (list.length === 0) toast.info("AI didn't find a strong match. Try writing more stories.");
    else toast.success(`AI picked ${list.length} stor${list.length === 1 ? "y" : "ies"}`);
  };

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "manual" ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setMode("manual")}
        >
          <ListChecks className="h-3.5 w-3.5 mr-1.5" /> Pick myself
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "ai" ? "default" : "outline"}
          className="rounded-full"
          onClick={() => { setMode("ai"); if (suggestions.length === 0) askAi(); }}
          disabled={busy}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
          Let AI choose
        </Button>
        {mode === "ai" && suggestions.length > 0 && (
          <Button type="button" size="sm" variant="ghost" className="rounded-full ml-auto" onClick={askAi} disabled={busy}>
            Re-pick
          </Button>
        )}
      </div>

      {mode === "manual" ? (
        <>
          <Label className="text-xs text-foreground/60">
            Pull from your stories ({selected.length} selected)
          </Label>
          <div className="max-h-64 overflow-auto rounded-xl border border-foreground/10 divide-y divide-foreground/10">
            {stories.length === 0 && (
              <div className="p-4 text-sm text-foreground/50">No stories yet. Skip this step.</div>
            )}
            {stories.map((s) => {
              const checked = selected.includes(s.id);
              return (
                <label key={s.id} className="flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-foreground/5">
                  <Checkbox checked={checked} onCheckedChange={() => toggle(s.id)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.title}</div>
                    <div className="text-xs text-foreground/50 truncate">{s.body?.slice(0, 80) ?? "—"}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <Label className="text-xs text-foreground/60">
            AI's picks for your {purpose} ({selected.length} selected)
          </Label>
          {busy ? (
            <div className="flex items-center justify-center py-10 text-foreground/50 text-sm">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reading your stories…
            </div>
          ) : suggestions.length === 0 ? (
            <div className="rounded-xl border border-foreground/10 p-4 text-sm text-foreground/50">
              No suggestions yet — tap "Let AI choose" again or add more context above.
            </div>
          ) : (
            <ul className="rounded-xl border border-foreground/10 divide-y divide-foreground/10 max-h-72 overflow-auto">
              {suggestions.map((s) => {
                const checked = selected.includes(s.story_id);
                return (
                  <li
                    key={s.story_id}
                    className={cn("px-3 py-3 flex items-start gap-3", checked && "bg-foreground/5")}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(s.story_id)} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{s.title}</div>
                      {s.reason && (
                        <div className="text-xs text-foreground/60 mt-0.5 italic">"{s.reason}"</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
