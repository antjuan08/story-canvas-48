import { ReactNode } from "react";
import { TopBar } from "./TopBar";
import { SiteFooter } from "./SiteFooter";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden flex flex-col">
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
