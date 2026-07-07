import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { SEO } from "@/components/seo/SEO";
import wordmarkAsset from "@/assets/storyou-wordmark.png.asset.json";
import markAsset from "@/assets/storyou-mark.png.asset.json";

const CREAM = "hsl(48, 56%, 95%)";
const INK = "hsl(240, 12%, 6%)";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: CREAM, color: INK }}>
      <SEO title="Page not found — Storyou" description="The page you’re looking for doesn’t exist." path={location.pathname} />
      <header className="max-w-3xl mx-auto px-6 pt-10 pb-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="Storyou home">
          <img src={markAsset.url} alt="" className="h-12 w-auto" />
          <img src={wordmarkAsset.url} alt="Storyou" className="h-8 w-auto" />
        </Link>
      </header>
      <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="mb-4 font-serif text-4xl font-light tracking-tight">404</h1>
          <p className="mb-6 text-lg text-foreground/70">Oops! Page not found</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
            style={{ backgroundColor: INK, color: CREAM }}
          >
            Return to Home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
