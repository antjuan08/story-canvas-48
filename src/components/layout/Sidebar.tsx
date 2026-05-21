import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Library,
  Presentation,
  Mic,
  BarChart3,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Library",
    href: "/library",
    icon: Library,
  },
  {
    name: "Keynotes",
    href: "/keynotes",
    icon: Presentation,
  },
  {
    name: "AI Record",
    href: "/record",
    icon: Mic,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-40 h-full glass-card border-r border-border-soft rounded-none transition-apple-long flex flex-col",
        isExpanded ? "w-64" : "w-18"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-border-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-white font-bold text-sm">
            S
          </div>
          {isExpanded && (
            <span className="font-semibold text-lg transition-apple">
              Storyou
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center rounded-2xl px-3 py-3 text-sm font-medium transition-apple",
                isActive
                  ? "bg-primary text-primary-foreground shadow-apple-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-apple",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
              {isExpanded && (
                <>
                  <span className="ml-3 transition-apple">{item.name}</span>
                  {isActive && (
                    <ChevronRight className="ml-auto h-4 w-4 transition-apple" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border-soft p-3">
        <div
          className={cn(
            "flex items-center rounded-2xl p-3 transition-apple hover:bg-accent",
            isExpanded ? "justify-start" : "justify-center"
          )}
        >
          <div className="h-8 w-8 rounded-full bg-gradient-primary" />
          {isExpanded && (
            <div className="ml-3">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">john@storyou.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}