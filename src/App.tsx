import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Dashboard } from "@/pages/Dashboard";
import { Vault } from "@/pages/Vault";
import { Stage } from "@/pages/Stage";
import { Recordings } from "@/pages/Recordings";
import { Storytellers } from "@/pages/Storytellers";
import { Analytics } from "@/pages/Analytics";
import { Settings } from "@/pages/Settings";
import Auth from "@/pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />

            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/vault" element={<Protected><Vault /></Protected>} />
            <Route path="/stage" element={<Protected><Stage /></Protected>} />
            <Route path="/recordings" element={<Protected><Recordings /></Protected>} />
            <Route path="/storytellers" element={<Protected><Storytellers /></Protected>} />
            <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />

            {/* Legacy route redirects */}
            <Route path="/library" element={<Navigate to="/vault" replace />} />
            <Route path="/keynotes" element={<Navigate to="/stage" replace />} />
            <Route path="/record" element={<Navigate to="/recordings" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
