import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Dashboard } from "@/pages/Dashboard";
import Home from "@/pages/Home";
import Stories from "@/pages/tabs/Stories";
import Keynote from "@/pages/tabs/Keynote";
import Podcast from "@/pages/tabs/Podcast";
import Book from "@/pages/tabs/Book";
import Reimagined from "@/pages/tabs/Reimagined";

import { Settings } from "@/pages/Settings";
import Welcome from "@/pages/Welcome";
import Profile from "@/pages/Profile";
import Community from "@/pages/Community";
import BillingReturn from "@/pages/BillingReturn";
import Testimonials from "@/pages/Testimonials";
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
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Navigate to="/" replace />} />

            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/stories" element={<Protected><Stories /></Protected>} />
            <Route path="/keynote" element={<Protected><Keynote /></Protected>} />
            <Route path="/podcast" element={<Protected><Podcast /></Protected>} />
            <Route path="/book" element={<Protected><Book /></Protected>} />
            <Route path="/reimagined" element={<Protected><Reimagined /></Protected>} />
            <Route path="/feedback" element={<Navigate to="/keynote" replace />} />
            <Route path="/community" element={<Protected><Community /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/welcome" element={<Protected><Welcome /></Protected>} />
            <Route path="/billing/return" element={<Protected><BillingReturn /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="/testimonials" element={<Testimonials />} />

            {/* Legacy redirects */}
            <Route path="/vault" element={<Navigate to="/stories" replace />} />
            <Route path="/stage" element={<Navigate to="/keynote" replace />} />
            <Route path="/library" element={<Navigate to="/stories" replace />} />
            <Route path="/keynotes" element={<Navigate to="/keynote" replace />} />
            <Route path="/recordings" element={<Navigate to="/podcast" replace />} />
            <Route path="/record" element={<Navigate to="/podcast" replace />} />
            <Route path="/storytellers" element={<Navigate to="/community" replace />} />
            <Route path="/analytics" element={<Navigate to="/dashboard" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
