import { PromptWorkspace } from "@/components/dashboard/PromptWorkspace";
import { CloudsBackdrop } from "@/components/visuals/CloudsBackdrop";

export function Dashboard() {
  return (
    <div
      className="relative -mx-4 md:-mx-6 lg:-mx-8 -my-6 min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground"
      style={
        {
          ["--background" as any]: "48 56% 95%",
          ["--foreground" as any]: "240 12% 6%",
          ["--card" as any]: "48 56% 95%",
          ["--card-foreground" as any]: "240 12% 6%",
          ["--muted" as any]: "48 30% 88%",
          ["--muted-foreground" as any]: "240 8% 30%",
          ["--border" as any]: "240 8% 80%",
          ["--input" as any]: "240 8% 80%",
        } as React.CSSProperties
      }
    >
      <CloudsBackdrop className="opacity-60" variant="light" />
      <div className="relative z-10">
        <PromptWorkspace activeTab="Stories" />
      </div>
    </div>
  );
}
