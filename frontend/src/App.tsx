import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const REPO_URL = "https://github.com/a-nathan-na/EvidenceCheck";

const Header = () => (
  <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-sm">
    <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6 sm:px-10">
      <a
        href="/"
        className="text-sm font-medium tracking-tight text-foreground transition-colors hover:text-accent"
      >
        EvidenceCheck
      </a>
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Source
      </a>
    </div>
  </header>
);

const App = () => (
  <BrowserRouter>
    <Header />
    <Routes>
      <Route path="/" element={<Index />} />
      {/* Custom routes go above the catch-all. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Toaster />
  </BrowserRouter>
);

export default App;
