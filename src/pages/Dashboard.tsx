import { PromptWorkspace } from "@/components/dashboard/PromptWorkspace";
import { CloudsBackdrop } from "@/components/visuals/CloudsBackdrop";

export function Dashboard() {
  return (
    <div className="relative -mx-4 md:-mx-6 lg:-mx-8 -my-6 min-h-[calc(100vh-4rem)] overflow-hidden">
      <CloudsBackdrop className="opacity-50" />
      <div className="relative z-10">
        <PromptWorkspace activeTab="Stories" />
      </div>
    </div>
  );
}
