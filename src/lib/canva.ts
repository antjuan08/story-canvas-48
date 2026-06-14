// Canva integration — Track A: download the asset and open Canva so the user
// can drag-import. Real Connect-API integration will plug in here later.

import { toast } from "sonner";
import { buildExport, downloadExport, type ExportKind } from "./exporters";

const CANVA_TARGETS: Record<ExportKind, string> = {
  story: "https://www.canva.com/create/documents/",
  keynote: "https://www.canva.com/create/presentations/",
  podcast: "https://www.canva.com/create/podcasts/",
  book: "https://www.canva.com/create/documents/",
  reimagined: "https://www.canva.com/create/videos/",
};

export async function sendToCanva(kind: ExportKind, item: any) {
  const payload = buildExport(kind, item);

  // 1. Trigger download so the user has the file ready to drag in
  try {
    await downloadExport(payload);
  } catch {
    // ignore — still open Canva
  }

  // 2. Try to copy text content (or asset URL) to clipboard
  try {
    const text = payload.content ?? payload.url ?? "";
    if (text && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  } catch {
    // clipboard may be unavailable in some browsers — non-fatal
  }

  // 3. Open Canva in a new tab
  const target = CANVA_TARGETS[kind];
  window.open(target, "_blank", "noopener,noreferrer");

  toast.success("Opened Canva", {
    description:
      payload.url
        ? "Your asset was downloaded and the link copied — paste it into Canva."
        : "Your file was downloaded and the content copied — paste into a new Canva design.",
  });
}
