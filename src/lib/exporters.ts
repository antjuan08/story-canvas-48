// Lightweight client-side exporters. Everything generates a plain-text-ish
// payload + filename so we can download or send to Canva without server work.

export type ExportKind = "story" | "keynote" | "podcast" | "book" | "reimagined";

export type ExportPayload = {
  filename: string;
  mime: string;
  // Either inline text content OR a remote URL (for video/cover downloads)
  content?: string;
  url?: string;
};

const slug = (s: string) =>
  (s || "untitled")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);

export function buildExport(kind: ExportKind, item: any): ExportPayload {
  switch (kind) {
    case "story": {
      const lines = [
        `# ${item.title ?? "Untitled story"}`,
        item.category ? `_Category: ${item.category}_` : "",
        (item.tags ?? []).length ? `_Tags: ${(item.tags ?? []).join(", ")}_` : "",
        "",
        item.body ?? "",
      ].filter(Boolean);
      return { filename: `${slug(item.title)}.md`, mime: "text/markdown", content: lines.join("\n") };
    }
    case "keynote": {
      const p = item.payload ?? {};
      const out: string[] = [];
      out.push(`KEYNOTE: ${p.title ?? item.title}`);
      out.push("");
      if (item.audience) out.push(`Audience: ${item.audience}`);
      if (item.tone) out.push(`Tone: ${item.tone}`);
      if (item.length) out.push(`Length: ${item.length}`);
      out.push("");
      if (p.opening) out.push(`OPENING\n${p.opening}\n`);
      (p.talking_points ?? []).forEach((tp: any, i: number) => {
        out.push(`${i + 1}. ${tp.headline}`);
        if (tp.detail) out.push(`   ${tp.detail}`);
        out.push("");
      });
      if (p.closing) out.push(`CLOSING\n${p.closing}\n`);
      if (Array.isArray(p.callouts) && p.callouts.length) {
        out.push("CALLOUTS:");
        p.callouts.forEach((c: string) => out.push(` • ${c}`));
      }
      return { filename: `${slug(item.title)}-keynote.txt`, mime: "text/plain", content: out.join("\n") };
    }
    case "podcast": {
      const x = item.payload ?? {};
      const out: string[] = [];
      out.push(`${item.show_name ?? "Show"} — ${x.episode_title ?? item.episode_title}`);
      out.push("");
      if (x.logline) out.push(`LOGLINE: ${x.logline}\n`);
      if (x.intro_script) out.push(`INTRO\n${x.intro_script}\n`);
      (x.segments ?? []).forEach((s: any, i: number) => {
        out.push(`SEGMENT ${i + 1}: ${s.name}${s.minutes ? ` (${s.minutes} min)` : ""}`);
        (s.talking_points ?? []).forEach((tp: string) => out.push(` • ${tp}`));
        out.push("");
      });
      if (x.outro_script) out.push(`OUTRO\n${x.outro_script}\n`);
      return { filename: `${slug(item.episode_title ?? item.show_name)}-episode.txt`, mime: "text/plain", content: out.join("\n") };
    }
    case "book": {
      const out: string[] = [];
      out.push(`# ${item.title ?? "Untitled book"}`);
      if (item.template) out.push(`_${item.template}_`);
      out.push("");
      if (item.premise) out.push(item.premise);
      out.push("");
      const p = item.payload ?? {};
      if (Array.isArray(p.chapters)) {
        p.chapters.forEach((c: any, i: number) => {
          out.push(`## Chapter ${i + 1}. ${c.title ?? ""}`);
          if (c.body) out.push(c.body);
          out.push("");
        });
      }
      return { filename: `${slug(item.title)}.md`, mime: "text/markdown", content: out.join("\n") };
    }
    case "reimagined": {
      // Prefer video, else cover image
      if (item.video_url) {
        return { filename: `${slug(item.title)}.mp4`, mime: "video/mp4", url: item.video_url };
      }
      if (item.cover_url) {
        return { filename: `${slug(item.title)}-cover.png`, mime: "image/png", url: item.cover_url };
      }
      const out = [
        `# ${item.title ?? "Reimagined"}`,
        item.angle ? `_${item.angle}_` : "",
        "",
        item.video_prompt ?? "",
      ].filter(Boolean);
      return { filename: `${slug(item.title)}-treatment.md`, mime: "text/markdown", content: out.join("\n") };
    }
  }
}

export async function downloadExport(payload: ExportPayload) {
  if (payload.url) {
    // Same-origin? just <a download>. Cross-origin we fetch as blob to force save.
    try {
      const res = await fetch(payload.url);
      const blob = await res.blob();
      triggerBlobDownload(blob, payload.filename);
    } catch {
      // Fallback: open the URL directly
      window.open(payload.url, "_blank", "noopener,noreferrer");
    }
    return;
  }
  const blob = new Blob([payload.content ?? ""], { type: payload.mime });
  triggerBlobDownload(blob, payload.filename);
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
