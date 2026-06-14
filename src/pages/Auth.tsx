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

// Brand cream + dark from index.css
const CREAM = "hsl(48, 56%, 95%)";
const INK = "hsl(240, 12%, 6%)";

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

  const handleOAuth = async (provider: "google" | "apple") => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) { toast.error(result.error.message ?? "Sign-in failed"); setBusy(false); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: INK, color: CREAM }}>
      {/* Top wavy cream curve */}
      <svg
        className="absolute top-0 left-0 w-full"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        style={{ height: "12vh", minHeight: 90 }}
        aria-hidden
      >
        <path
          d="M0,0 L1440,0 L1440,70 C1200,130 960,20 720,60 C480,100 240,40 0,90 Z"
          fill={CREAM}
        />
      </svg>

      {/* Brand mark top-left */}
      <div className="absolute top-5 left-6 z-20 flex items-center gap-2">
        <div
          className="h-9 w-9 rounded-2xl grid place-items-center font-serif text-base"
          style={{ backgroundColor: INK, color: CREAM }}
        >
          S
        </div>
        <span className="font-serif text-xl tracking-tight" style={{ color: INK }}>StoryYou</span>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen grid lg:grid-cols-2 items-center px-6 lg:px-16 pt-32 lg:pt-24 pb-24">
        {/* Left — auth card */}
        <div className="w-full max-w-md justify-self-center lg:justify-self-start">
          <div
            className="rounded-[2rem] p-8 sm:p-10 shadow-2xl"
            style={{ backgroundColor: CREAM, color: INK }}
          >
            <h1 className="font-serif text-3xl sm:text-4xl font-light tracking-tight leading-[1.1]">
              Welcome to <span className="inline-block px-2 rounded-md" style={{ backgroundColor: "hsl(270,90%,92%)" }}>StoryYou</span>
            </h1>
            <p className="mt-3 text-sm" style={{ color: "hsl(240,8%,35%)" }}>
              Capture <span className="px-1.5 rounded" style={{ backgroundColor: "hsl(150,60%,88%)" }}>stories</span>,{" "}
              shape <span className="px-1.5 rounded" style={{ backgroundColor: "hsl(25,90%,88%)" }}>keynotes</span>,{" "}
              and keep what matters.
            </p>

            <div className="mt-7 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="rounded-full border-foreground/20 bg-white hover:bg-foreground/5"
                  disabled={busy}
                  onClick={() => handleOAuth("google")}
                >
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-foreground/20 bg-white hover:bg-foreground/5"
                  disabled={busy}
                  onClick={() => handleOAuth("apple")}
                >
                  Apple
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1" style={{ backgroundColor: "hsl(240,8%,80%)" }} />
                <span className="text-xs" style={{ color: "hsl(240,5%,45%)" }}>or</span>
                <div className="h-px flex-1" style={{ backgroundColor: "hsl(240,8%,80%)" }} />
              </div>

              <Tabs defaultValue="signin">
                <TabsList
                  className="grid grid-cols-2 w-full rounded-full p-1 h-auto border"
                  style={{ backgroundColor: "white", borderColor: "hsl(240,8%,85%)" }}
                >
                  <TabsTrigger
                    value="signin"
                    className="rounded-full text-sm data-[state=active]:bg-[hsl(240,12%,6%)] data-[state=active]:text-[hsl(48,56%,95%)]"
                  >
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="rounded-full text-sm data-[state=active]:bg-[hsl(240,12%,6%)] data-[state=active]:text-[hsl(48,56%,95%)]"
                  >
                    Sign up
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-3 mt-4">
                  <Field id="si-email" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field id="si-pw" label="Password" type="password" value={password} onChange={setPassword} />
                  <SubmitBtn busy={busy} onClick={() => handleEmail("signin")}>Sign in</SubmitBtn>
                </TabsContent>

                <TabsContent value="signup" className="space-y-3 mt-4">
                  <Field id="su-name" label="Full name" type="text" value={name} onChange={setName} />
                  <Field id="su-email" label="Email" type="email" value={email} onChange={setEmail} />
                  <Field id="su-pw" label="Password" type="password" value={password} onChange={setPassword} />
                  <SubmitBtn busy={busy} onClick={() => handleEmail("signup")}>Create account</SubmitBtn>
                </TabsContent>
              </Tabs>

              <p className="text-[11px] text-center pt-1" style={{ color: "hsl(240,5%,45%)" }}>
                By continuing you agree to our Terms & Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        {/* Right — playful illustration */}
        <div className="hidden lg:flex flex-col items-end justify-center pr-4">
          <h2 className="font-serif text-5xl xl:text-6xl font-light leading-[1.05] max-w-md text-right" style={{ color: CREAM }}>
            Your stories,
            <br />
            <em className="italic" style={{ color: "hsl(270,90%,75%)" }}>beautifully kept.</em>
          </h2>
          <p className="mt-4 max-w-sm text-right text-sm" style={{ color: "hsl(48,30%,80%)" }}>
            A quiet place to capture, craft and revisit the moments worth remembering.
          </p>
        </div>
      </div>

      {/* Bottom-right pastel illustration */}
      <BottomScene />

      {/* Bottom wavy cream curve */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ height: "9vh", minHeight: 60 }}
        aria-hidden
      >
        <path
          d="M0,120 L1440,120 L1440,30 C1180,90 940,10 700,50 C460,90 220,30 0,80 Z"
          fill={CREAM}
        />
      </svg>
    </div>
  );
}

function Field({
  id, label, type, value, onChange,
}: { id: string; label: string; type: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium" style={{ color: "hsl(240,8%,30%)" }}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-2xl bg-white border-foreground/15 focus-visible:ring-foreground/20"
      />
    </div>
  );
}

function SubmitBtn({ children, busy, onClick }: { children: React.ReactNode; busy: boolean; onClick: () => void }) {
  return (
    <Button
      className="w-full rounded-full bg-[hsl(240,12%,6%)] text-[hsl(48,56%,95%)] hover:bg-[hsl(240,12%,18%)] mt-1"
      disabled={busy}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

/** Pastel doodle in the bottom-right, mirroring the Daydream reference */
function BottomScene() {
  return (
    <svg
      className="hidden md:block absolute bottom-12 right-0 w-[46vw] max-w-[640px] pointer-events-none"
      viewBox="0 0 640 380"
      aria-hidden
    >
      {/* cream blob */}
      <path
        d="M40,260 C20,180 120,120 220,140 C280,80 420,80 480,150 C600,140 660,250 600,320 C540,400 120,400 60,330 Z"
        fill="hsl(48, 56%, 95%)"
      />
      {/* hand */}
      <path d="M120,300 q40,-50 110,-30 l40,12 q10,3 6,12 q-4,8 -14,6 l-30,-6 q30,18 70,28 q12,4 9,14 q-3,10 -14,7 l-90,-22 q-30,-8 -60,-2 z" fill="#a8d8ec" stroke="#222" strokeWidth="2"/>
      {/* pencil */}
      <g transform="rotate(-25 380 170)">
        <rect x="300" y="150" width="180" height="22" rx="4" fill="#c9b6ee" stroke="#222" strokeWidth="2"/>
        <polygon points="480,150 510,161 480,172" fill="#f5d18a" stroke="#222" strokeWidth="2"/>
        <rect x="295" y="150" width="14" height="22" fill="#f4a8b8" stroke="#222" strokeWidth="2"/>
      </g>
      {/* card with checkmark */}
      <g>
        <rect x="220" y="180" width="140" height="80" rx="10" fill="white" stroke="#222" strokeWidth="2"/>
        <circle cx="245" cy="205" r="6" fill="#f3b8d2"/>
        <line x1="260" y1="205" x2="340" y2="205" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="245" cy="225" r="6" fill="#c9e6b8"/>
        <line x1="260" y1="225" x2="320" y2="225" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="245" cy="245" r="6" fill="#c9b6ee"/>
        <line x1="260" y1="245" x2="330" y2="245" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
      </g>
      {/* speech bubble */}
      <g>
        <rect x="440" y="190" width="130" height="70" rx="14" fill="#f8c8a8" stroke="#222" strokeWidth="2"/>
        <circle cx="475" cy="225" r="5" fill="#222"/>
        <circle cx="505" cy="225" r="5" fill="#222"/>
        <circle cx="535" cy="225" r="5" fill="#222"/>
      </g>
      {/* check circle */}
      <g>
        <circle cx="330" cy="120" r="22" fill="#c9e6b8" stroke="#222" strokeWidth="2"/>
        <polyline points="320,121 328,129 342,113" fill="none" stroke="#222" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      {/* connecting lines */}
      <path d="M330,142 Q330,170 290,180" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M360,180 Q400,160 440,200" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* mini chart */}
      <g>
        <rect x="430" y="280" width="160" height="70" rx="8" fill="white" stroke="#222" strokeWidth="2"/>
        <polyline points="440,335 470,310 500,320 530,295 580,290" fill="none" stroke="#f0a4b8" strokeWidth="2.5"/>
        <polyline points="440,340 470,330 500,325 530,315 580,310" fill="none" stroke="#a8d8ec" strokeWidth="2.5"/>
      </g>
    </svg>
  );
}
