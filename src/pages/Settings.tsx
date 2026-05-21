import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, Theme } from "@/hooks/use-theme";

const options: { value: Theme; label: string; icon: typeof Sun; desc: string }[] = [
  { value: "light", label: "Light", icon: Sun, desc: "Bright and crisp." },
  { value: "dark", label: "Dark", icon: Moon, desc: "Syncra purple glow." },
  { value: "system", label: "System", icon: Monitor, desc: "Follow your OS." },
];

export function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground">Choose how Storyou looks to you.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {options.map((o) => {
            const active = theme === o.value;
            const Icon = o.icon;
            return (
              <button
                key={o.value}
                onClick={() => setTheme(o.value)}
                className={cn(
                  "glass-card p-4 text-left transition-apple hover:shadow-apple-lg",
                  active && "ring-2 ring-primary border-primary"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center mb-3",
                  active ? "orb-glow text-white" : "bg-secondary text-foreground"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-medium">{o.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-1">Account</h2>
        <p className="text-sm text-muted-foreground">Profile and workspace settings coming soon.</p>
      </section>
    </div>
  );
}
