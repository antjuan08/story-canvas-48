import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

export function TrialBanner() {
  const { isTrialing, daysLeft, trialExpired, status } = useSubscription();

  if (status === "active" || status === "past_due") return null;
  if (!isTrialing && !trialExpired) return null;

  if (trialExpired) {
    return (
      <Link
        to="/welcome"
        className="hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-foreground text-background hover:opacity-90 transition"
      >
        <Sparkles className="h-3 w-3" /> Trial ended — choose a plan
      </Link>
    );
  }

  return (
    <Link
      to="/welcome"
      className="hidden md:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-foreground/15 bg-background/70 hover:bg-foreground/5 transition"
    >
      <Sparkles className="h-3 w-3 text-foreground/60" />
      <span className="text-foreground/70">
        {daysLeft} {daysLeft === 1 ? "day" : "days"} left ·{" "}
        <span className="text-foreground font-medium">Choose plan</span>
      </span>
    </Link>
  );
}
