import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useStories } from "@/hooks/use-stories";
import { toast } from "@/hooks/use-toast";

export function SharePostDialog({
  open,
  onOpenChange,
  onPosted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPosted: () => void;
}) {
  const { user } = useAuth();
  const { stories } = useStories();
  const [storyId, setStoryId] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);

  const publicStories = stories.filter((s) => s.is_public);

  const submit = async () => {
    if (!user || !storyId) return;
    setSaving(true);
    const { error } = await supabase
      .from("community_posts")
      .insert({ user_id: user.id, story_id: storyId, caption: caption || null });
    setSaving(false);
    if (error) {
      toast({ title: "Could not share", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Shared to community" });
    setStoryId("");
    setCaption("");
    onOpenChange(false);
    onPosted();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share to Storytellers</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Story</Label>
            {publicStories.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                You don't have any public stories yet. Mark a story as public in your Vault first.
              </p>
            ) : (
              <Select value={storyId} onValueChange={setStoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a public story" />
                </SelectTrigger>
                <SelectContent>
                  {publicStories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div>
            <Label>Caption (optional)</Label>
            <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!storyId || saving}>
            {saving ? "Sharing..." : "Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
