import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/landing/Navbar";
import HomePage from "./pages/HomePage";
import FeaturesPage from "./pages/FeaturesPage";
import ComingSoonPage from "./pages/ComingSoonPage";

// ScrollToTop component - resets scroll position on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

// Footer component
function Footer() {
  return (
    <footer className="bg-graphite-950 border-t border-graphite-800 py-8">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Logo */}
            <div className="w-6 h-6 bg-graphite-800 rounded flex items-center justify-center border border-graphite-700">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span className="text-sm text-graphite-400">LocaLens</span>
          </div>
          
          <p className="text-xs text-graphite-500">
            AI-Powered Localization QA · Built with Gemini & Claude
          </p>
          
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-graphite-500 hover:text-graphite-300 transition-colors">
              Privacy
            </a>
            <a href="#" className="text-xs text-graphite-500 hover:text-graphite-300 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-graphite-900 text-white flex flex-col">
        <Navbar />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/coming-soon" element={<ComingSoonPage />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
