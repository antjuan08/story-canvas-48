import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CloudsBackdrop } from "@/components/visuals/CloudsBackdrop";
import { SEO } from "@/components/seo/SEO";

const CREAM = "hsl(48, 56%, 95%)";
const INK = "hsl(240, 12%, 6%)";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

export default function Home() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawNext = params.get("next") ?? "";
  const nextPath = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (session) navigate(nextPath, { replace: true }); }, [session, navigate, nextPath]);
  if (loading) return null;
  if (session) return <Navigate to={nextPath} replace />;

  const handleEmail = async (mode: "signin" | "signup") => {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}${nextPath}`, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Welcome to Storyou");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally { setBusy(false); }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}${nextPath}`,
    });
    if (result.error) { toast.error(result.error.message ?? "Sign-in failed"); setBusy(false); }
  };



  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: CREAM, color: INK }}>
      <SEO
        title="Storyou — Capture, refine, and share your stories"
        description="Storyou turns spoken moments into keynotes, podcasts, books, and cinematic reimaginings — with an AI speaking coach built in."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Storyou",
          url: "https://storyou.ai",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://storyou.ai/?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      {/* Animated black clouds across the whole hero */}
      <CloudsBackdrop className="z-0" variant="light" />

      {/* Brand mark */}
      <Link to="/" className="absolute top-5 left-6 z-20 flex items-center gap-2" aria-label="Storyou home">
        <div className="h-9 w-9 rounded-2xl grid place-items-center font-serif text-base"
          style={{ backgroundColor: INK, color: CREAM }}>S</div>
        <span className="font-serif text-xl tracking-tight" style={{ color: INK }}>Storyou</span>
      </Link>

      {/* Main grid */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-[1fr_auto_1fr] items-center px-6 lg:px-16 pt-24 lg:pt-20 pb-24 gap-10">
        {/* Left spacer / hero on desktop */}
        <div className="hidden lg:block" />

        {/* Auth card — centered on mobile, nudged right of center on desktop */}
        <div className="w-full max-w-[360px] justify-self-center">
          <div className="rounded-2xl p-7 shadow-xl border" style={{ backgroundColor: CREAM, color: INK, borderColor: "hsl(240,8%,80%)" }}>
            <h1 className="font-serif text-2xl font-light tracking-tight leading-tight">
              Your <em className="italic">Voice</em>, Your{" "}
              <span className="inline-block px-1.5 rounded" style={{ backgroundColor: "hsl(0,0%,88%)" }}>Words</span>,{" "}
              <span className="italic">your story</span>.
            </h1>

            <div className="mt-5 space-y-3.5">
              <Button
                variant="outline"
                className="w-full rounded-full border-foreground/20 bg-white hover:bg-foreground/5 text-sm h-10"
                disabled={busy}
                onClick={() => handleOAuth("google")}
              >
                Continue with Google
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full border-foreground/20 bg-black text-white hover:bg-black/90 hover:text-white text-sm h-10"
                disabled={busy}
                onClick={() => handleOAuth("apple")}
              >
                Continue with Apple
              </Button>


              <div className="flex items-center gap-2">
                <div className="h-px flex-1" style={{ backgroundColor: "hsl(240,8%,80%)" }} />
                <span className="text-[11px]" style={{ color: "hsl(240,5%,45%)" }}>or</span>
                <div className="h-px flex-1" style={{ backgroundColor: "hsl(240,8%,80%)" }} />
              </div>

              <Tabs defaultValue="signup">
                <TabsList className="grid grid-cols-2 w-full rounded-full p-0.5 h-auto border"
                  style={{ backgroundColor: "white", borderColor: "hsl(240,8%,85%)" }}>
                  <TabsTrigger value="signup"
                    className="rounded-full text-xs py-1.5 data-[state=active]:bg-[hsl(240,12%,6%)] data-[state=active]:text-[hsl(48,56%,95%)]">
                    Get started
                  </TabsTrigger>
                  <TabsTrigger value="signin"
                    className="rounded-full text-xs py-1.5 data-[state=active]:bg-[hsl(240,12%,6%)] data-[state=active]:text-[hsl(48,56%,95%)]">
                    Log in
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signup" className="space-y-2.5 mt-3.5">
                  <Field id="su-name" label="Full name" type="text" value={name} onChange={setName} />
                  <Field id="su-email" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field id="su-pw" label="Password" type="password" value={password} onChange={setPassword} />
                  <SubmitBtn busy={busy} onClick={() => handleEmail("signup")}>Create account</SubmitBtn>
                </TabsContent>

                <TabsContent value="signin" className="space-y-2.5 mt-3.5">
                  <Field id="si-email" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field id="si-pw" label="Password" type="password" value={password} onChange={setPassword} />
                  <SubmitBtn busy={busy} onClick={() => handleEmail("signin")}>Sign in</SubmitBtn>
                </TabsContent>
              </Tabs>

              <p className="text-[11px] text-center pt-1" style={{ color: "hsl(240,5%,45%)" }}>
                By continuing you agree to our{" "}
                <a href="/terms" className="underline hover:text-foreground">Terms</a>
                {" "}&{" "}
                <a href="/privacy" className="underline hover:text-foreground">Privacy</a>.
              </p>
            </div>
          </div>
        </div>


        {/* Right column — hero line + tree swing */}
        <div className="hidden lg:flex flex-col items-end justify-center pr-4 relative">
          <h2 className="font-serif text-5xl xl:text-6xl font-light leading-[1.05] max-w-md text-right" style={{ color: INK }}>
            A quiet sky
            <br />
            for the <em className="italic">stories</em>
            <br />
            you've yet to tell.
          </h2>
        </div>
      </div>

      <TreeSwingScene />

      <div className="absolute bottom-3 left-6 text-xs z-20" style={{ color: INK }}>2026 © Storyou LLC</div>
    </div>
  );
}

function Field({ id, label, type, value, onChange }: { id: string; label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs font-medium" style={{ color: "hsl(240,8%,30%)" }}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-xl bg-white border-foreground/15 focus-visible:ring-foreground/20 h-10 text-sm" />
    </div>
  );
}

function SubmitBtn({ children, busy, onClick }: { children: React.ReactNode; busy: boolean; onClick: () => void }) {
  return (
    <Button className="w-full rounded-full bg-[hsl(240,12%,6%)] text-[hsl(48,56%,95%)] hover:bg-[hsl(240,12%,18%)] mt-1 h-10 text-sm"
      disabled={busy} onClick={onClick}>{children}</Button>
  );
}


function TreeSwingScene() {
  return (
    <svg className="hidden md:block absolute bottom-12 right-0 w-[36vw] max-w-[480px] pointer-events-none z-[2]"
      viewBox="0 0 560 420" aria-hidden>
      <path d="M300,140 C295,200 290,260 295,330 L325,330 C330,260 325,200 320,140 Z"
        fill={INK} stroke={INK} strokeWidth="2.5" />
      <path d="M305,180 q5,30 0,60" stroke={CREAM} strokeWidth="1.5" fill="none" />
      <path d="M315,170 q-4,40 0,80" stroke={CREAM} strokeWidth="1.5" fill="none" />
      <g>
        <ellipse cx="310" cy="100" rx="120" ry="78" fill={INK} stroke={INK} strokeWidth="2.5" />
        <ellipse cx="240" cy="115" rx="60" ry="48" fill={INK} stroke={INK} strokeWidth="2.5" />
        <ellipse cx="390" cy="110" rx="70" ry="52" fill={INK} stroke={INK} strokeWidth="2.5" />
        <ellipse cx="310" cy="60" rx="70" ry="42" fill={INK} stroke={INK} strokeWidth="2.5" />
      </g>
      <path d="M360,150 q40,5 70,30" stroke={INK} strokeWidth="3" fill="none" />
      <line x1="410" y1="178" x2="395" y2="280" stroke={INK} strokeWidth="2" />
      <line x1="445" y1="186" x2="455" y2="285" stroke={INK} strokeWidth="2" />
      <g>
        <ellipse cx="425" cy="305" rx="48" ry="22" fill={INK} />
        <ellipse cx="425" cy="303" rx="48" ry="22" fill={INK} stroke={INK} strokeWidth="2.5" />
        <ellipse cx="425" cy="303" rx="28" ry="12" fill={CREAM} stroke={INK} strokeWidth="2" />
      </g>
      <path d="M120,360 Q280,340 500,360" stroke={INK} strokeWidth="1.5" fill="none" opacity="0.4" />
    </svg>
  );
}
