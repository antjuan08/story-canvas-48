import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";

export default function BillingReturn() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { refetch } = useSubscription();

  useEffect(() => {
    // Webhook may take a moment; refresh a few times.
    const t1 = setTimeout(refetch, 1500);
    const t2 = setTimeout(refetch, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [refetch]);

  return (
    <div className="min-h-[60vh] grid place-items-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto h-12 w-12 rounded-full bg-foreground/5 grid place-items-center mb-5">
          <Sparkles className="h-5 w-5 text-foreground/70" />
        </div>
        <h1 className="font-serif text-3xl">You're all set.</h1>
        <p className="text-foreground/60 mt-3">
          Your trial has started. We'll only charge after seven days — manage everything from your
          profile.
        </p>
        {sessionId && (
          <p className="text-[10px] text-foreground/30 mt-3 font-mono break-all">{sessionId}</p>
        )}
        <div className="mt-7 flex gap-3 justify-center">
          <Button asChild className="rounded-full">
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/profile">View billing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
