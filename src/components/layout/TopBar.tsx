import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Search, Command, LogOut, Settings as SettingsIcon, Menu, Sun, Moon, Monitor, User as UserIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SearchDialog } from "@/components/ui/SearchDialog";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { NAV_TABS } from "@/components/nav/TabNav";
import { TrialBanner } from "@/components/billing/TrialBanner";
import { cn } from "@/lib/utils";

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 h-14 w-full bg-background/70 backdrop-blur-md border-b border-foreground/5">
        <div className="flex h-14 items-center justify-between px-4 md:px-6 gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-full -ml-1">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle className="font-serif text-left">StoryYou</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-1">
                  {NAV_TABS.map((t) => {
                    const active = location.pathname === t.path;
                    return (
                      <button
                        key={t.label}
                        onClick={() => { navigate(t.path); setMenuOpen(false); }}
                        className={cn(
                          "text-left px-3 py-2.5 rounded-xl text-sm font-medium transition",
                          active ? "bg-foreground text-background" : "hover:bg-foreground/5",
                        )}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-foreground text-background grid place-items-center font-serif text-sm">S</div>
              <span className="font-serif text-lg tracking-tight hidden sm:inline">StoryYou</span>
            </Link>
          </div>

          {/* Inline tab nav + magnifier search at the end (desktop only) */}
          <nav className="hidden md:flex flex-1 justify-center min-w-0">
            <div className="flex items-center gap-1 rounded-full border border-foreground/10 bg-background/70 backdrop-blur-sm p-1 shadow-sm">
              {NAV_TABS.map((t) => {
                const isActive = location.pathname === t.path;
                return (
                  <button
                    key={t.label}
                    onClick={() => navigate(t.path)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-sm font-medium transition-all",
                      isActive ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground hover:bg-foreground/5",
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className="ml-1 h-8 w-8 rounded-full flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <TrialBanner />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>


            <div className="hidden sm:flex items-center gap-0.5 rounded-full border border-foreground/10 p-0.5">
              {([
                { v: "light", I: Sun },
                { v: "dark", I: Moon },
                { v: "system", I: Monitor },
              ] as const).map(({ v, I }) => (
                <button
                  key={v}
                  onClick={() => setTheme(v)}
                  aria-label={`${v} theme`}
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center transition",
                    theme === v ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground",
                  )}
                >
                  <I className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
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
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="sm:hidden">
                  {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  Toggle theme
                </DropdownMenuItem>
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

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
