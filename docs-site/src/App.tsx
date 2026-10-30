import React, { useEffect, useState } from "react";
import { Grid3X3, Moon, Sun } from "lucide-react";
import { DOCS_DATA, DOC_CATEGORIES } from "./docsData";
import { MCP_DOCS_DATA, MCP_DOC_CATEGORIES } from "./mcpDocsData";
import { PACKAGES } from "./siteConfig";
import { Link, useLocation } from "./router";
import { Dashboard } from "./pages/Dashboard";
import { DocsPage } from "./pages/DocsPage";
import type { DocsProduct } from "./pages/DocsPage";
import { GithubIcon } from "./components/GithubIcon";
import "./App.css";

const THEME_KEY = "socialcalc_docs_theme";

const SOCIALCALC_DOCS: DocsProduct = {
  route: "/socialcalc",
  name: PACKAGES.socialcalc.name,
  tagline: "Spreadsheet engine, plugins and React/Ionic UI",
  version: PACKAGES.socialcalc.version,
  links: [
    { label: "npm", href: PACKAGES.socialcalc.npm },
    { label: "GitHub", href: PACKAGES.socialcalc.github },
    { label: "Apps built on SocialCalc", href: "http://aspiringapps.com/web/home/index.html" },
  ],
  categories: DOC_CATEGORIES,
  chapters: DOCS_DATA,
};

const MCP_DOCS: DocsProduct = {
  route: "/mcp",
  name: PACKAGES.mcp.name,
  tagline: "MCP server for AI agents",
  version: PACKAGES.mcp.version,
  links: [
    { label: "npm", href: PACKAGES.mcp.npm },
    { label: "GitHub", href: PACKAGES.mcp.github },
    { label: "Hosted at aspiringapps.com/mcp", href: "http://aspiringapps.com/mcp" },
  ],
  categories: MCP_DOC_CATEGORIES,
  chapters: MCP_DOCS_DATA,
};

function initialDark(): boolean {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === "dark";
  } catch {
    // storage unavailable
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState(initialDark);
  const { route, hash } = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark-theme", isDark);
  }, [isDark]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      // storage unavailable
    }
  };

  const navItems = [
    { to: "/", label: "Overview" },
    { to: "/socialcalc", label: "SocialCalc" },
    { to: "/mcp", label: "MCP Server" },
  ] as const;

  return (
    <div className="docs-layout">
      <header className="docs-navbar">
        <Link to="/" className="navbar-brand" aria-label="SocialCalc AI home">
          <div className="brand-icon">
            <Grid3X3 size={16} />
          </div>
          <span className="brand-title">SocialCalc AI</span>
        </Link>

        <nav className="navbar-routes" aria-label="Documentation sections">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`navbar-route ${route === item.to ? "active" : ""}`}
              aria-current={route === item.to ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="navbar-actions">
          <a
            href={PACKAGES.socialcalc.github}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-btn"
            title="GitHub"
            aria-label="GitHub repository"
          >
            <GithubIcon size={16} />
          </a>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            type="button"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {route === "/" && <Dashboard />}
      {route === "/socialcalc" && <DocsPage product={SOCIALCALC_DOCS} chapterId={hash} />}
      {route === "/mcp" && <DocsPage product={MCP_DOCS} chapterId={hash} />}
    </div>
  );
};

export default App;
