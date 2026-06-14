import { ReactNode } from "react";
import { TopBar } from "./TopBar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      <TopBar />
      <main className="px-4 md:px-6 lg:px-8 py-6">
        <div className="mx-auto w-full max-w-[1600px] min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
