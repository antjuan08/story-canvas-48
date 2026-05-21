import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Recording } from "@/stores/recordingsStore";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rec: Recording;
}

export function StoryDialog({ open, onOpenChange, rec }: Props) {
  const download = () => {
    const blob = new Blob([rec.story ?? ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${rec.name}-story.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass-card">
        <DialogHeader>
          <DialogTitle className="text-gradient-primary">Your Story</DialogTitle>
          <DialogDescription>AI-rewritten storytelling version of your recording.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
          {rec.story}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Close</Button>
          <Button onClick={download} className="rounded-xl gap-1.5 bg-gradient-primary text-white hover:opacity-90">
            <Download className="h-4 w-4" /> Export .md
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
