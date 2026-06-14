import { useEffect, useState } from "react";
import { Loader2, Save, ExternalLink, Sparkles, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { TabNav } from "@/components/nav/TabNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useStripeCheckout } from "@/hooks/use-stripe-checkout";
import { CREDIT_PACKS, PLANS } from "@/lib/tiers";
import { getStripeEnvironment } from "@/lib/stripe";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  title: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  socials: Record<string, string> | null;
  brand_voice: string | null;
  email: string | null;
};

const SOCIAL_KEYS = ["twitter", "instagram", "youtube", "tiktok", "linkedin", "facebook"] as const;

export default function Profile() {
  const { user, signOut } = useAuth();
  const { tier, status, daysLeft, credits, isTrialing, refetch } = useSubscription();
  const { openCheckout, checkoutElement } = useStripeCheckout();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile((data as any) ?? null);
    })();
  }, [user]);

  const update = (patch: Partial<Profile>) => setProfile((p) => (p ? { ...p, ...patch } : p));

  const save = async () => {
    if (!profile || !user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      title: profile.title,
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
      socials: profile.socials ?? {},
      brand_voice: profile.brand_voice,
    }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const buyCredits = (priceId: string) => {
    openCheckout({
      priceId, userId: user?.id, customerEmail: user?.email,
      returnUrl: `${window.location.origin}/profile?credits=ok`,
    });
  };

  const openPortal = async () => {
    const { data, error } = await supabase.functions.invoke("create-portal-session", {
      body: { returnUrl: `${window.location.origin}/profile`, environment: getStripeEnvironment() },
    });
    if (error || !data?.url) { toast.error(data?.error ?? error?.message ?? "Failed"); return; }
    window.open(data.url, "_blank");
  };

  const initials = (profile?.full_name ?? user?.email ?? "U").slice(0, 2).toUpperCase();
  const planName = PLANS.find((p) => p.id === tier)?.name ?? tier;

  if (!profile) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-foreground/50" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <TabNav active="Stories" />
      <div className="max-w-4xl mx-auto px-6 pt-10 pb-20">
        <header className="flex items-center gap-5 mb-10">
          <Avatar className="h-16 w-16">
            {profile.avatar_url ? <AvatarImage src={profile.avatar_url} /> : null}
            <AvatarFallback className="bg-foreground text-background font-serif text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-serif text-3xl">{profile.full_name || "Your profile"}</h1>
            <p className="text-sm text-foreground/60">{profile.title || profile.email}</p>
          </div>
        </header>

        <Tabs defaultValue="profile">
          <TabsList className="rounded-full border border-foreground/10 bg-background/70 p-1 h-auto">
            <TabsTrigger value="profile" className="rounded-full">Profile</TabsTrigger>
            <TabsTrigger value="brand" className="rounded-full">Brand voice</TabsTrigger>
            <TabsTrigger value="billing" className="rounded-full">Billing</TabsTrigger>
            <TabsTrigger value="community" className="rounded-full">Community</TabsTrigger>
            <TabsTrigger value="account" className="rounded-full">Account</TabsTrigger>
          </TabsList>

          {/* PROFILE */}
          <TabsContent value="profile" className="mt-8 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2"><Label>Full name</Label>
                <Input value={profile.full_name ?? ""} onChange={(e) => update({ full_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Title</Label>
                <Input placeholder="Author, Pastor, Founder…" value={profile.title ?? ""} onChange={(e) => update({ title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Location</Label>
                <Input value={profile.location ?? ""} onChange={(e) => update({ location: e.target.value })} /></div>
              <div className="space-y-2"><Label>Website</Label>
                <Input value={profile.website ?? ""} onChange={(e) => update({ website: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Bio</Label>
              <Textarea rows={4} value={profile.bio ?? ""} onChange={(e) => update({ bio: e.target.value })} /></div>
            <div className="space-y-3">
              <Label>Socials</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                {SOCIAL_KEYS.map((k) => (
                  <Input key={k} placeholder={`${k} @handle or URL`}
                    value={profile.socials?.[k] ?? ""}
                    onChange={(e) => update({ socials: { ...(profile.socials ?? {}), [k]: e.target.value } })} />
                ))}
              </div>
            </div>
            <Button onClick={save} disabled={saving} className="rounded-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save profile
            </Button>
          </TabsContent>

          {/* BRAND VOICE */}
          <TabsContent value="brand" className="mt-8 space-y-5">
            <div>
              <h2 className="font-serif text-xl">Your brand story</h2>
              <p className="text-sm text-foreground/60 mt-1">
                A short paragraph AI uses every time it writes for you — your voice, your themes, what you care about.
              </p>
            </div>
            <Textarea
              rows={8}
              placeholder="I'm a pastor in Atlanta who tells stories about grace, grit and family…"
              value={profile.brand_voice ?? ""}
              onChange={(e) => update({ brand_voice: e.target.value })}
            />
            <Button onClick={save} disabled={saving} className="rounded-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save brand voice
            </Button>
            <p className="text-xs text-foreground/50 pt-3 border-t border-foreground/10">
              Brand-voice image, video and audio uploads are coming next — they'll appear here.
            </p>
          </TabsContent>

          {/* BILLING */}
          <TabsContent value="billing" className="mt-8 space-y-6">
            <div className="rounded-3xl border border-foreground/10 bg-background/70 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-foreground/50">Current plan</p>
                  <p className="font-serif text-2xl mt-1">{planName}</p>
                  <p className="text-sm text-foreground/60 mt-1">
                    {isTrialing
                      ? `Free trial · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`
                      : `Status: ${status}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="ghost" className="rounded-full">
                    <Link to="/welcome"><Sparkles className="h-4 w-4 mr-2" /> Change plan</Link>
                  </Button>
                  <Button onClick={openPortal} variant="outline" className="rounded-full">
                    <CreditCard className="h-4 w-4 mr-2" /> Manage billing <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-foreground/10 bg-background/70 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-foreground/50">Reimagined credits</p>
                  <p className="font-serif text-2xl mt-1">{credits}</p>
                  <p className="text-sm text-foreground/60">Each cinematic render uses 1 credit.</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                {CREDIT_PACKS.map((pack) => (
                  <button key={pack.id} onClick={() => buyCredits(pack.id)}
                    className="rounded-2xl border border-foreground/10 p-4 text-left hover:shadow-md transition">
                    <div className="text-xs uppercase tracking-widest text-foreground/50">{pack.label}</div>
                    <div className="font-serif text-xl mt-1">{pack.credits} credits</div>
                    <div className="text-sm text-foreground/70 mt-1">${pack.amount}</div>
                  </button>
                ))}
              </div>
            </div>
            {checkoutElement}
          </TabsContent>

          {/* COMMUNITY */}
          <TabsContent value="community" className="mt-8 space-y-4">
            <p className="text-foreground/70">Browse and share with the community.</p>
            <Button asChild className="rounded-full"><Link to="/community">Open community →</Link></Button>
          </TabsContent>

          {/* ACCOUNT */}
          <TabsContent value="account" className="mt-8 space-y-4">
            <div className="space-y-2"><Label>Email</Label>
              <Input value={profile.email ?? ""} disabled /></div>
            <Button variant="destructive" onClick={() => signOut().then(() => location.assign("/"))} className="rounded-full">
              Sign out
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
