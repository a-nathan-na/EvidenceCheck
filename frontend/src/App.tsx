import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

// Smooth scroll helper function
const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

// Header component
const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-cyan-500/40 shadow-lg shadow-black/40">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Brand */}
          <button
            onClick={() => scrollTo("top")}
            className="text-xl font-bold text-slate-50 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            EvidenceCheck
          </button>

          {/* Center: Navigation */}
          <nav className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => scrollTo("about-section")}
              className="text-sm font-medium text-slate-100 hover:text-cyan-400"
            >
              About
            </Button>
            <Button
              variant="ghost"
              onClick={() => scrollTo("analyze-section")}
              className="text-sm font-medium text-slate-100 hover:text-cyan-400"
            >
              Analyze
            </Button>
            <Button
              variant="ghost"
              onClick={() => scrollTo("scope-section")}
              className="text-sm font-medium text-slate-100 hover:text-cyan-400"
            >
              Scope
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen">
          <Header />
          <div className="pt-16">
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
