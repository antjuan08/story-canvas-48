import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronDown,
  LogOut,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  User as UserIcon,
  Users,
  Palette,
  UserPlus,
  Mail,
  Twitter,
  Linkedin,
  Facebook,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useTheme, type Theme } from "@/hooks/use-theme";
import { TrialBanner } from "@/components/billing/TrialBanner";
import { cn } from "@/lib/utils";
import wordmarkAsset from "@/assets/storyou-wordmark.png.asset.json";
import markAsset from "@/assets/storyou-mark.png.asset.json";

const NAV: { label: string; items: { label: string; path: string }[] }[] = [
  {
    label: "Story",
    items: [
      { label: "StoryCloud", path: "/vault" },
      { label: "Signature Story", path: "/dashboard" },
      { label: "Storyboard", path: "/dashboard" },
      { label: "Enterprise Stories", path: "/community" },
    ],
  },
  {
    label: "Stage",
    items: [
      { label: "Keynote", path: "/keynotes" },
      { label: "Feedback Coach", path: "/dashboard" },
    ],
  },
  {
    label: "Studio",
    items: [
      { label: "Podcast", path: "/dashboard" },
      { label: "Reimagine Studio", path: "/dashboard" },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "StoryU", path: "/academy" },
      { label: "Tutorials", path: "/academy" },
      { label: "Courses", path: "/academy" },
      { label: "Case Studies", path: "/community" },
    ],
  },
];

function NavDropdown({ label, items }: { label: string; items: { label: string; path: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="flex items-center gap-1 py-2 hover:text-foreground transition-colors"
      >
        {label}
        <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", open && "rotate-180")} />
      </button>
      <div
        role="menu"
        className={cn(
          "absolute left-0 top-full pt-2 w-56 transition-all z-50",
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none",
        )}
      >
        <div className="rounded-2xl border border-foreground/10 bg-background shadow-lg shadow-foreground/5 p-2">
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/[0.04] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TopBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Sign out failed");
    }
  };

  const email = user?.email ?? "";
  const initials = (email.split("@")[0] || "U").slice(0, 2).toUpperCase();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all",
        scrolled || mobileOpen
          ? "backdrop-blur bg-background/85 border-b border-foreground/10"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-8">
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0" aria-label="Storyou home">
          <img src={markAsset.url} alt="" className="h-9 sm:h-12 w-auto" />
          <img src={wordmarkAsset.url} alt="Storyou" className="h-6 sm:h-8 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-sm text-foreground/80">
          {NAV.map((n) => (
            <NavDropdown key={n.label} label={n.label} items={n.items} />
          ))}
        </nav>

        <button
          type="button"
          className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-foreground/5 text-foreground/80"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", mobileOpen && "rotate-180")} />
        </button>

        {mobileOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-full bg-background border-b border-foreground/10 px-6 py-4">
            <div className="max-w-7xl mx-auto flex flex-col gap-1 text-sm">
              {NAV.map((n) => {
                const isOpen = expanded === n.label;
                return (
                  <div key={n.label} className="border-b border-foreground/5 last:border-0">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : n.label)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between py-3 text-foreground"
                    >
                      {n.label}
                      <ChevronDown className={cn("h-4 w-4 opacity-60 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <div className="pb-3 pl-3 flex flex-col gap-1">
                        {n.items.map((item) => (
                          <Link
                            key={item.label}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className="py-2 text-foreground/70 hover:text-foreground"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <TrialBanner />
          <InviteMenu />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Account menu" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-foreground text-background text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="text-sm font-medium truncate">{email || "Account"}</div>
                <div className="text-xs text-muted-foreground">Signed in</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Palette className="mr-2 h-4 w-4" /> Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
                    <DropdownMenuRadioItem value="light">
                      <Sun className="mr-2 h-4 w-4" /> Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <Moon className="mr-2 h-4 w-4" /> Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <Monitor className="mr-2 h-4 w-4" /> System
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <UserIcon className="mr-2 h-4 w-4" /> Profile & billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/community")}>
                <Users className="mr-2 h-4 w-4" /> Community
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <SettingsIcon className="mr-2 h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function InviteMenu() {
  const inviteUrl = typeof window !== "undefined" ? window.location.origin : "https://storyou.ai";
  const message = "I'm using Storyou to capture and share my stories — join me:";
  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${message} ${inviteUrl}`);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Invite" className="rounded-full gap-1.5 px-2 md:px-3">
          <UserPlus className="h-4 w-4" />
          <span className="hidden md:inline text-sm">Invite</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="text-sm font-medium">Invite friends</div>
          <div className="text-xs text-muted-foreground">Share Storyou</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            open(
              `mailto:?subject=${encodeURIComponent("Join me on Storyou")}&body=${encodeURIComponent(`${message} ${inviteUrl}`)}`,
            )
          }
        >
          <Mail className="mr-2 h-4 w-4" /> Email
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(inviteUrl)}`,
            )
          }
        >
          <Twitter className="mr-2 h-4 w-4" /> X / Twitter
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteUrl)}`)}
        >
          <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`)}
        >
          <Facebook className="mr-2 h-4 w-4" /> Facebook
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copy}>
          <Link2 className="mr-2 h-4 w-4" /> Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
