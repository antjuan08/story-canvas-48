import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

export default function Auth() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate("/dashboard", { replace: true });
  }, [session, navigate]);

  if (loading) return null;
  if (session) return <Navigate to="/dashboard" replace />;

  const handleEmail = async (mode: "signin" | "signup") => {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Welcome to StoryYou");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Soft pastel blobs in Daydream style */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-[#f8c8d8]/50 blur-3xl" />
        <div className="absolute top-20 -right-24 h-[380px] w-[380px] rounded-full bg-[#b8d4e8]/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-[#d4f0c8]/50 blur-3xl" />
        <div className="absolute -bottom-24 right-1/4 h-[320px] w-[320px] rounded-full bg-[#e8c5dc]/50 blur-3xl" />
      </div>

      {/* Floating decorative pill (Daydream hero element) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-2 rounded-full border border-foreground/10 bg-background/80 backdrop-blur-md px-4 py-1.5 shadow-sm">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-medium text-foreground/70">StoryYou · capture · craft · share</span>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-2xl bg-foreground text-background grid place-items-center font-serif text-lg">S</div>
            <span className="font-serif text-2xl tracking-tight">StoryYou</span>
          </div>

          {/* Headline */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight leading-[1.05]">
              Your stories,
              <br />
              <em className="italic text-foreground/70">beautifully kept.</em>
            </h1>
            <p className="mt-3 text-foreground/60 text-sm">
              A quiet place to capture what matters.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-foreground/10 bg-background/80 backdrop-blur-xl p-6 space-y-5 shadow-xl">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="rounded-full border-foreground/15 bg-background hover:bg-foreground/5"
                disabled={busy}
                onClick={() => handleOAuth("google")}
              >
                Google
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-foreground/15 bg-background hover:bg-foreground/5"
                disabled={busy}
                onClick={() => handleOAuth("apple")}
              >
                Apple
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-foreground/10" />
              <span className="text-xs text-foreground/40">or</span>
              <div className="h-px flex-1 bg-foreground/10" />
            </div>

            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 w-full rounded-full bg-foreground/5 border border-foreground/10 p-1 h-auto">
                <TabsTrigger value="signin" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background">
                  Sign in
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-foreground data-[state=active]:text-background">
                  Sign up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-3 mt-4">
                <Field id="si-email" label="Email" type="email" value={email} onChange={setEmail} />
                <Field id="si-pw" label="Password" type="password" value={password} onChange={setPassword} />
                <Button className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90" disabled={busy} onClick={() => handleEmail("signin")}>
                  Sign in
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="space-y-3 mt-4">
                <Field id="su-name" label="Full name" type="text" value={name} onChange={setName} />
                <Field id="su-email" label="Email" type="email" value={email} onChange={setEmail} />
                <Field id="su-pw" label="Password" type="password" value={password} onChange={setPassword} />
                <Button className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90" disabled={busy} onClick={() => handleEmail("signup")}>
                  Create account
                </Button>
              </TabsContent>
            </Tabs>
          </div>

          <p className="text-xs text-foreground/40 mt-6 text-center">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  id, label, type, value, onChange,
}: { id: string; label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-foreground/70 text-xs font-medium">{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl bg-background border-foreground/15 focus-visible:ring-foreground/20"
      />
    </div>
  );
}
