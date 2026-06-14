import { PromptWorkspace } from "@/components/dashboard/PromptWorkspace";
import { CloudsBackdrop } from "@/components/visuals/CloudsBackdrop";

const CREAM = "hsl(48, 56%, 95%)";
const INK = "hsl(240, 12%, 6%)";

export function Dashboard() {
  return (
    <div
      className="relative -mx-4 md:-mx-6 lg:-mx-8 -my-6 min-h-[calc(100vh-4rem)] overflow-hidden"
      style={{ backgroundColor: CREAM, color: INK }}
    >
      <CloudsBackdrop className="opacity-60" variant="light" />
      <div className="relative z-10 text-foreground" style={{ color: INK }}>
        <PromptWorkspace activeTab="Stories" />
      </div>
    </div>
  );
}
