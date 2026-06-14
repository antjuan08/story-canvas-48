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
import { CloudsBackdrop } from "@/components/visuals/CloudsBackdrop";

const CREAM = "hsl(48, 56%, 95%)";
const INK = "hsl(240, 12%, 6%)";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

export default function Home() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (session) navigate("/dashboard", { replace: true }); }, [session, navigate]);
  if (loading) return null;
  if (session) return <Navigate to="/dashboard" replace />;

  const handleEmail = async (mode: "signin" | "signup") => {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Welcome to StoryYou");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally { setBusy(false); }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) { toast.error(result.error.message ?? "Sign-in failed"); setBusy(false); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: INK, color: CREAM }}>
      {/* Animated B&W clouds across the whole hero */}
      <CloudsBackdrop className="z-0" />

      {/* Top cream wavy curve */}
      <svg className="absolute top-0 left-0 w-full z-[1]" viewBox="0 0 1440 160" preserveAspectRatio="none"
        style={{ height: "14vh", minHeight: 100 }} aria-hidden>
        <path d="M0,0 L1440,0 L1440,80 C1200,150 960,20 720,70 C480,120 240,40 0,100 Z" fill={CREAM} />
      </svg>

      {/* Brand mark */}
      <div className="absolute top-5 left-6 z-20 flex items-center gap-2">
        <div className="h-9 w-9 rounded-2xl grid place-items-center font-serif text-base"
          style={{ backgroundColor: INK, color: CREAM }}>S</div>
        <span className="font-serif text-xl tracking-tight" style={{ color: INK }}>StoryYou</span>
      </div>

      {/* Main grid */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-2 items-center px-6 lg:px-16 pt-32 lg:pt-24 pb-24 gap-10">
        {/* Auth card */}
        <div className="w-full max-w-md justify-self-center lg:justify-self-start">
          <div className="rounded-[2rem] p-8 sm:p-10 shadow-2xl" style={{ backgroundColor: CREAM, color: INK }}>
            <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-tight leading-[1.1]">
              Your <em className="italic">stories</em>, kept like{" "}
              <span className="inline-block px-2 rounded-md" style={{ backgroundColor: "hsl(0,0%,90%)" }}>clouds</span>.
            </h1>
            <p className="mt-3 text-sm" style={{ color: "hsl(240,8%,35%)" }}>
              Sign up to start capturing, shaping, and revisiting the moments worth remembering.
            </p>

            <div className="mt-7 space-y-4">
              <Button
                variant="outline"
                className="w-full rounded-full border-foreground/20 bg-white hover:bg-foreground/5"
                disabled={busy}
                onClick={handleGoogle}
              >
                Continue with Google
              </Button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1" style={{ backgroundColor: "hsl(240,8%,80%)" }} />
                <span className="text-xs" style={{ color: "hsl(240,5%,45%)" }}>or</span>
                <div className="h-px flex-1" style={{ backgroundColor: "hsl(240,8%,80%)" }} />
              </div>

              <Tabs defaultValue="signup">
                <TabsList className="grid grid-cols-2 w-full rounded-full p-1 h-auto border"
                  style={{ backgroundColor: "white", borderColor: "hsl(240,8%,85%)" }}>
                  <TabsTrigger value="signup"
                    className="rounded-full text-sm data-[state=active]:bg-[hsl(240,12%,6%)] data-[state=active]:text-[hsl(48,56%,95%)]">
                    Get started
                  </TabsTrigger>
                  <TabsTrigger value="signin"
                    className="rounded-full text-sm data-[state=active]:bg-[hsl(240,12%,6%)] data-[state=active]:text-[hsl(48,56%,95%)]">
                    Log in
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signup" className="space-y-3 mt-4">
                  <Field id="su-name" label="Full name" type="text" value={name} onChange={setName} />
                  <Field id="su-email" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field id="su-pw" label="Password" type="password" value={password} onChange={setPassword} />
                  <SubmitBtn busy={busy} onClick={() => handleEmail("signup")}>Create account</SubmitBtn>
                </TabsContent>

                <TabsContent value="signin" className="space-y-3 mt-4">
                  <Field id="si-email" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field id="si-pw" label="Password" type="password" value={password} onChange={setPassword} />
                  <SubmitBtn busy={busy} onClick={() => handleEmail("signin")}>Sign in</SubmitBtn>
                </TabsContent>
              </Tabs>

              <p className="text-[11px] text-center pt-1" style={{ color: "hsl(240,5%,45%)" }}>
                By continuing you agree to our Terms & Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        {/* Right column — hero line + tree swing */}
        <div className="hidden lg:flex flex-col items-end justify-center pr-4 relative">
          <h2 className="font-serif text-5xl xl:text-6xl font-light leading-[1.05] max-w-md text-right" style={{ color: CREAM }}>
            A quiet sky
            <br />
            for the <em className="italic">stories</em>
            <br />
            you've yet to tell.
          </h2>
        </div>
      </div>

      <TreeSwingScene />

      {/* Bottom cream wavy curve */}
      <svg className="absolute bottom-0 left-0 w-full z-[1]" viewBox="0 0 1440 120" preserveAspectRatio="none"
        style={{ height: "9vh", minHeight: 60 }} aria-hidden>
        <path d="M0,120 L1440,120 L1440,40 C1180,100 940,10 700,55 C460,95 220,30 0,85 Z" fill={CREAM} />
      </svg>

      <div className="absolute bottom-3 left-6 text-xs z-20" style={{ color: INK }}>2026 © StoryYou Labs, Inc.</div>
    </div>
  );
}

function Field({ id, label, type, value, onChange }: { id: string; label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium" style={{ color: "hsl(240,8%,30%)" }}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl bg-white border-foreground/15 focus-visible:ring-foreground/20" />
    </div>
  );
}

function SubmitBtn({ children, busy, onClick }: { children: React.ReactNode; busy: boolean; onClick: () => void }) {
  return (
    <Button className="w-full rounded-full bg-[hsl(240,12%,6%)] text-[hsl(48,56%,95%)] hover:bg-[hsl(240,12%,18%)] mt-1"
      disabled={busy} onClick={onClick}>{children}</Button>
  );
}

function TreeSwingScene() {
  return (
    <svg className="hidden md:block absolute bottom-12 right-0 w-[36vw] max-w-[480px] pointer-events-none z-[2]"
      viewBox="0 0 560 420" aria-hidden>
      <path d="M30,300 C20,220 110,160 200,180 C260,120 400,130 460,200 C540,210 570,290 510,340 C440,400 90,400 40,340 Z"
        fill="hsl(48, 56%, 95%)" />
      <path d="M300,140 C295,200 290,260 295,330 L325,330 C330,260 325,200 320,140 Z"
        fill="white" stroke="#111" strokeWidth="2.5" />
      <path d="M305,180 q5,30 0,60" stroke="#111" strokeWidth="1.5" fill="none" />
      <path d="M315,170 q-4,40 0,80" stroke="#111" strokeWidth="1.5" fill="none" />
      <g>
        <ellipse cx="310" cy="100" rx="120" ry="78" fill="white" stroke="#111" strokeWidth="2.5" />
        <ellipse cx="240" cy="115" rx="60" ry="48" fill="white" stroke="#111" strokeWidth="2.5" />
        <ellipse cx="390" cy="110" rx="70" ry="52" fill="white" stroke="#111" strokeWidth="2.5" />
        <ellipse cx="310" cy="60" rx="70" ry="42" fill="white" stroke="#111" strokeWidth="2.5" />
      </g>
      <path d="M360,150 q40,5 70,30" stroke="#111" strokeWidth="3" fill="none" />
      <line x1="410" y1="178" x2="395" y2="280" stroke="#111" strokeWidth="2" />
      <line x1="445" y1="186" x2="455" y2="285" stroke="#111" strokeWidth="2" />
      <g>
        <ellipse cx="425" cy="305" rx="48" ry="22" fill="#111" />
        <ellipse cx="425" cy="303" rx="48" ry="22" fill="white" stroke="#111" strokeWidth="2.5" />
        <ellipse cx="425" cy="303" rx="28" ry="12" fill="hsl(48, 56%, 95%)" stroke="#111" strokeWidth="2" />
      </g>
      <path d="M120,360 Q280,340 500,360" stroke="#111" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
