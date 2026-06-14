import { ReactNode, useEffect, useState } from "react";
import { TopBar } from "./TopBar";
import { SiteFooter } from "./SiteFooter";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { WelcomeSplash } from "@/components/onboarding/WelcomeSplash";
import { useAuth } from "@/hooks/use-auth";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `welcome-splash-shown:${user.id}`;
    if (!sessionStorage.getItem(key)) {
      setShowSplash(true);
      sessionStorage.setItem(key, "1");
    }
  }, [user]);

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden flex flex-col">
      {showSplash && <WelcomeSplash onDone={() => setShowSplash(false)} />}
      <PaymentTestModeBanner />
      <TopBar />
      <main className="px-4 md:px-6 lg:px-8 py-6 flex-1">
        <div className="mx-auto w-full max-w-[1600px] min-w-0">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
