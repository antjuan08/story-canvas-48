import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLANS, type TierId } from "@/lib/tiers";
import { useAuth } from "@/hooks/use-auth";
import { useStripeCheckout } from "@/hooks/use-stripe-checkout";
import { useSubscription } from "@/hooks/use-subscription";

export function PricingCards() {
  const { user } = useAuth();
  const { tier: currentTier, status } = useSubscription();
  const { openCheckout, checkoutElement } = useStripeCheckout();
  const [interval, setInterval] = useState<"month" | "year">("month");

  const start = (planId: TierId) => {
    const plan = PLANS.find((p) => p.id === planId)!;
    const priceId = interval === "month" ? plan.monthlyPriceId : plan.yearlyPriceId;
    openCheckout({
      priceId,
      userId: user?.id,
      customerEmail: user?.email,
      trialDays: 7,
      returnUrl: `${window.location.origin}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  return (
    <div className="space-y-10">
      {/* Interval toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-background/70 p-1 shadow-sm">
          {(["month", "year"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setInterval(v)}
              className={cn(
                "px-5 py-1.5 rounded-full text-sm font-medium transition",
                interval === v ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground",
              )}
            >
              {v === "month" ? "Monthly" : "Yearly · save ~17%"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const amount = interval === "month" ? plan.monthlyAmount : plan.yearlyAmount;
          const isCurrent =
            currentTier === plan.id && status !== "trialing";
          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-3xl border bg-background/80 p-7 flex flex-col relative",
                plan.highlighted
                  ? "border-foreground shadow-lg md:scale-[1.02]"
                  : "border-foreground/10",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest bg-foreground text-background px-3 py-1 rounded-full">
                  Most loved
                </span>
              )}
              <h3 className="font-serif text-2xl">{plan.name}</h3>
              <p className="text-sm text-foreground/60 mt-1 min-h-[40px]">{plan.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-serif text-5xl">${amount}</span>
                <span className="text-foreground/50 text-sm">/{interval}</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-foreground/70 shrink-0" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => start(plan.id)}
                disabled={isCurrent}
                className={cn(
                  "mt-7 rounded-full w-full",
                  !plan.highlighted && "bg-foreground/90 hover:bg-foreground",
                )}
                size="lg"
              >
                {isCurrent ? (
                  "Current plan"
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" /> Start 7-day free trial
                  </>
                )}
              </Button>
              <p className="text-[11px] text-foreground/40 text-center mt-2">
                Card required · cancel anytime in 7 days
              </p>
            </div>
          );
        })}
      </div>
      {checkoutElement}
    </div>
  );
}
