import { Link } from "react-router-dom";
import { PricingCards } from "@/components/billing/PricingCards";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";

export default function Welcome() {
  const { isTrialing, daysLeft, trialExpired } = useSubscription();

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-foreground/50 mb-4">
          {trialExpired ? "Trial ended" : isTrialing ? `${daysLeft} days left on your free trial` : "Plans"}
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl font-light tracking-tight">
          Tell your story <em className="italic text-foreground/70">on your terms.</em>
        </h1>
        <p className="text-foreground/60 mt-5 max-w-xl mx-auto">
          Start with a 7-day free trial. Pick the rhythm that fits — change plans or cancel anytime
          from your profile.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20">
        <PricingCards />
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-24 text-center text-sm text-foreground/60">
        <p>
          Every plan includes community access, brand voice and PDF export. Reimagined cinematic
          generation is on the Creator tier as pay-per-render credits — buy a pack when you need one.
        </p>
        <div className="mt-6">
          {!trialExpired ? (
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/dashboard">Continue on free trial →</Link>
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
