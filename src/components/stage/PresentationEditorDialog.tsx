import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { STAGE_TEMPLATES, type Presentation, type StageTemplate } from "@/hooks/use-presentations";
import type { Folder } from "@/hooks/use-stories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  presentation?: Presentation | null;
  folders: Folder[];
  onSaved: () => void;
}

export function PresentationEditorDialog({ open, onOpenChange, presentation, folders, onSaved }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<StageTemplate>("keynote");
  const [folderId, setFolderId] = useState<string>("");
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(presentation?.title ?? "");
    setTemplate((presentation?.template_type as StageTemplate) ?? "keynote");
    setFolderId(presentation?.folder_id ?? "");
    setTagsInput((presentation?.tags ?? []).join(", "));
  }, [open, presentation]);

  const save = async () => {
    if (!user) return;
    const parsed = schema.safeParse({ title });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 20);

    setSaving(true);
    const payload = {
      user_id: user.id,
      title: title.trim(),
      template_type: template,
      folder_id: folderId || null,
      tags,
    };
    const { error } = presentation
      ? await supabase.from("presentations").update(payload).eq("id", presentation.id)
      : await supabase.from("presentations").insert({ ...payload, content: {} });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(presentation ? "Presentation updated" : "Presentation created");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{presentation ? "Edit presentation" : "New presentation"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ptitle">Title</Label>
            <Input id="ptitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sunday morning keynote…" />
          </div>

          <div className="space-y-1.5">
            <Label>Template</Label>
            <div className="grid grid-cols-2 gap-2">
              {STAGE_TEMPLATES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTemplate(t.value)}
                  className={cn(
                    "text-left rounded-2xl border p-3 transition-apple",
                    template === t.value ? "border-primary bg-primary-soft" : "border-border hover:bg-accent",
                  )}
                >
                  <div className="font-medium text-sm">{t.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Folder</Label>
              <Select value={folderId || "none"} onValueChange={(v) => setFolderId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="No folder" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ptags">Tags</Label>
              <Input id="ptags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="comma, separated" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-gradient-primary" disabled={saving} onClick={save}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
