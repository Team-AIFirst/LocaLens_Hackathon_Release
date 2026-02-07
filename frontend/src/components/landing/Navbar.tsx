import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Analyzer", path: "/" },
  { label: "Features", path: "/features" },
  { label: "Resources", path: "/coming-soon" },
  { label: "Customers", path: "/coming-soon" },
  { label: "Docs", path: "/coming-soon" },
  { label: "Pricing", path: "/coming-soon" },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-graphite-900/95 backdrop-blur-md border-b border-graphite-800">
      <div className="container mx-auto px-6 h-[68px] flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {/* Logo Icon */}
          <div className="w-8 h-8 bg-graphite-800 rounded-lg border border-graphite-700 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          {/* Logo Text */}
          <span className="text-xl font-bold text-white tracking-tight">
            LocaLens
          </span>
        </Link>

        {/* Navigation Links - Center */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.path
                  ? "text-white"
                  : "text-graphite-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Start Button - Right */}
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-graphite-100 text-graphite-900 text-sm font-semibold rounded-lg transition-colors"
        >
          Start
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
