// To swap the hero image, replace src/assets/auth-portrait.jpg
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
import authPortrait from "@/assets/auth-portrait.jpg";

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
    <div className="relative min-h-screen overflow-hidden bg-[hsl(0_0%_4%)] text-white">
      {/* Halo + portrait layer */}
      <div className="pointer-events-none absolute inset-0 lg:left-1/2">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="halo-bloom absolute h-[90vmin] w-[90vmin] rounded-full" />
          <div className="halo-glow relative h-[80vmin] w-[80vmin] max-h-[860px] max-w-[860px] rounded-full">
            <img
              src={authPortrait}
              alt=""
              width={1024}
              height={1024}
              className="portrait-mask absolute inset-0 h-full w-full object-cover object-center opacity-95 mix-blend-normal"
            />
          </div>
        </div>
        {/* edge vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,hsl(0_0%_4%)_85%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col lg:grid lg:grid-cols-2">
        <div className="flex-1 flex flex-col justify-between px-6 py-10 lg:px-16 lg:py-14">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold">
                S
              </div>
              <span className="text-lg font-semibold tracking-tight">StoryYou</span>
            </div>
          </div>

          <div className="mt-10 lg:mt-0 max-w-md">
            <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.05]">
              Your stories.<br />Your stage.
            </h1>
            <p className="mt-4 text-white/70 text-base lg:text-lg">
              A quiet place to capture what matters and a bright stage to share it.
            </p>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 space-y-5 shadow-2xl">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  disabled={busy}
                  onClick={() => handleOAuth("google")}
                >
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  disabled={busy}
                  onClick={() => handleOAuth("apple")}
                >
                  Apple
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-white/50">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <Tabs defaultValue="signin">
                <TabsList className="grid grid-cols-2 w-full rounded-2xl bg-white/5 border border-white/10">
                  <TabsTrigger value="signin" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">Sign in</TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">Sign up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-3 mt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="si-email" className="text-white/80">Email</Label>
                    <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="si-pw" className="text-white/80">Password</Label>
                    <Input id="si-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                  </div>
                  <Button className="w-full rounded-2xl bg-white text-black hover:bg-white/90" disabled={busy} onClick={() => handleEmail("signin")}>
                    Sign in
                  </Button>
                </TabsContent>

                <TabsContent value="signup" className="space-y-3 mt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="su-name" className="text-white/80">Full name</Label>
                    <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-email" className="text-white/80">Email</Label>
                    <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-pw" className="text-white/80">Password</Label>
                    <Input id="su-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                  </div>
                  <Button className="w-full rounded-2xl bg-white text-black hover:bg-white/90" disabled={busy} onClick={() => handleEmail("signup")}>
                    Create account
                  </Button>
                </TabsContent>
              </Tabs>
            </div>

            <p className="text-xs text-white/40 mt-6">
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </div>

          <div className="mt-10 hidden lg:grid grid-cols-3 gap-6 max-w-md text-sm">
            <div>
              <div className="text-white font-medium">Private</div>
              <div className="text-white/50">Yours by default</div>
            </div>
            <div>
              <div className="text-white font-medium">Lasting</div>
              <div className="text-white/50">Stories preserved</div>
            </div>
            <div>
              <div className="text-white font-medium">Crafted</div>
              <div className="text-white/50">Made for storytellers</div>
            </div>
          </div>
        </div>

        {/* Right column reserved for the halo on lg+ — content lives in the absolute layer */}
        <div className="hidden lg:block" />
      </div>
    </div>
  );
}
