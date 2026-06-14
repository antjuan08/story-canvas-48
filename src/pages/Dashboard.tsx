import { useEffect, useState } from "react";
import { PromptWorkspace } from "@/components/dashboard/PromptWorkspace";
import { CloudsBackdrop } from "@/components/visuals/CloudsBackdrop";
import { StickFigureStrip } from "@/components/home/StickFigureStrip";

export function Dashboard() {
  // Read current theme at mount + on changes so the cream overrides only apply in light/system-light mode.
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains("dark"))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const lightOverrides = !isDark
    ? ({
        ["--background" as any]: "48 56% 95%",
        ["--foreground" as any]: "240 12% 6%",
        ["--card" as any]: "48 56% 95%",
        ["--card-foreground" as any]: "240 12% 6%",
        ["--muted" as any]: "48 30% 88%",
        ["--muted-foreground" as any]: "240 8% 30%",
        ["--border" as any]: "240 8% 80%",
        ["--input" as any]: "240 8% 80%",
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      className="relative -mx-4 md:-mx-6 lg:-mx-8 -my-6 min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground"
      style={lightOverrides}
    >
      <CloudsBackdrop className="opacity-60" variant={isDark ? "dark" : "light"} />
      <div className="relative z-10">
        <PromptWorkspace activeTab="Stories" />
        <StickFigureStrip />
      </div>
    </div>
  );
}
