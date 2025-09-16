import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background">
      <Sidebar />
      
      <div className="pl-18 transition-apple-long">
        <TopBar />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}