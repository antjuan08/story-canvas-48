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
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-xl mb-4">
            S
          </div>
          <h1 className="text-3xl font-bold tracking-tight">StoryYou</h1>
          <p className="text-muted-foreground mt-1">Your stories. Your stage.</p>
        </div>

        <div className="glass-card p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="rounded-2xl" disabled={busy} onClick={() => handleOAuth("google")}>
              Google
            </Button>
            <Button variant="outline" className="rounded-2xl" disabled={busy} onClick={() => handleOAuth("apple")}>
              Apple
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full rounded-2xl">
              <TabsTrigger value="signin" className="rounded-xl">Sign in</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="si-email">Email</Label>
                <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="si-pw">Password</Label>
                <Input id="si-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="w-full rounded-2xl bg-gradient-primary" disabled={busy} onClick={() => handleEmail("signin")}>
                Sign in
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="su-name">Full name</Label>
                <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-email">Email</Label>
                <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-pw">Password</Label>
                <Input id="su-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="w-full rounded-2xl bg-gradient-primary" disabled={busy} onClick={() => handleEmail("signup")}>
                Create account
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
