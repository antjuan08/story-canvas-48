import { useState } from "react";
import { MoreHorizontal, Send, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { buildExport, downloadExport, type ExportKind } from "@/lib/exporters";
import { sendToCanva } from "@/lib/canva";

type Props = {
  kind: ExportKind;
  item: { id: string; title?: string; [k: string]: any };
  /** Supabase table for delete. */
  table: "stories" | "keynotes" | "podcasts" | "books" | "reimagined_stories";
  onDeleted?: () => void;
  className?: string;
  /** Pass true to stop click events bubbling to a parent card. Default: true. */
  stopPropagation?: boolean;
};

export function ItemOverflowMenu({
  kind,
  item,
  table,
  onDeleted,
  className,
  stopPropagation = true,
}: Props) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCanva = async () => {
    try { await sendToCanva(kind, item); }
    catch (e: any) { toast.error(e?.message ?? "Couldn't open Canva"); }
  };

  const handleExport = async () => {
    try {
      const payload = buildExport(kind, item);
      await downloadExport(payload);
      toast.success(`Downloaded ${payload.filename}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from(table).delete().eq("id", item.id);
    setDeleting(false);
    setConfirm(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    onDeleted?.();
  };

  const stop = (e: React.SyntheticEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={stop}
            aria-label="More actions"
            className={cn(
              "h-8 w-8 inline-flex items-center justify-center rounded-full bg-background/80 backdrop-blur border border-foreground/10 text-foreground/70 hover:text-foreground hover:bg-background transition shadow-sm",
              className,
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48"
          onClick={stop}
        >
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleCanva(); }}>
            <Send className="h-4 w-4 mr-2" /> Send to Canva
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleExport(); }}>
            <Download className="h-4 w-4 mr-2" /> Export
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setConfirm(true); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent onClick={stop}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {kind}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
