import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/seo/SEO";
import wordmarkAsset from "@/assets/storyou-wordmark.png.asset.json";
import markAsset from "@/assets/storyou-mark.png.asset.json";

const CREAM = "hsl(48, 56%, 95%)";
const INK = "hsl(240, 12%, 6%)";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-consumes the recovery link and emits a PASSWORD_RECOVERY event.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    const parsed = z.string().min(8, "At least 8 characters").max(72).safeParse(password);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (password !== confirm) return toast.error("Passwords don't match");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      toast.error(e.message ?? "Could not update password");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: CREAM, color: INK }}>
      <SEO title="Reset password — Storyou" description="Set a new password for your Storyou account." path="/reset-password" />
      <Link to="/" className="absolute top-5 left-6 flex items-center gap-2" aria-label="Storyou home">
        <img src={markAsset.url} alt="" className="h-12 w-auto" />
        <img src={wordmarkAsset.url} alt="Storyou" className="h-8 w-auto" />
      </Link>

      <div className="w-full max-w-[360px]">
        <div className="rounded-2xl p-7 shadow-xl border" style={{ backgroundColor: CREAM, borderColor: "hsl(240,8%,80%)" }}>
          <h1 className="font-serif text-2xl font-light tracking-tight leading-tight">
            Set a <em className="italic">new password</em>
          </h1>
          <p className="mt-2 text-sm" style={{ color: "hsl(240,5%,45%)" }}>
            {ready ? "Enter a new password for your account." : "Verifying your reset link…"}
          </p>

          <div className="mt-5 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="new-pw" className="text-xs font-medium" style={{ color: "hsl(240,8%,30%)" }}>New password</Label>
              <Input id="new-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl bg-white border-foreground/15 h-10 text-sm" disabled={!ready || busy} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-pw" className="text-xs font-medium" style={{ color: "hsl(240,8%,30%)" }}>Confirm password</Label>
              <Input id="confirm-pw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="rounded-xl bg-white border-foreground/15 h-10 text-sm" disabled={!ready || busy} />
            </div>
            <Button
              className="w-full rounded-full bg-[hsl(240,12%,6%)] text-[hsl(48,56%,95%)] hover:bg-[hsl(240,12%,18%)] mt-1 h-10 text-sm"
              disabled={!ready || busy} onClick={handleSubmit}
            >
              Update password
            </Button>
            <div className="text-center">
              <Link to="/auth" className="text-[11px] underline" style={{ color: "hsl(240,5%,45%)" }}>Back to sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
