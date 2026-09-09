import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Sun,
  Moon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Code2,
  Grid3X3,
} from "lucide-react";
import { DOCS_DATA, DOC_CATEGORIES } from "./docsData";
import type { DocChapter } from "./docsData";
import { CodeBlock } from "./components/CodeBlock";
import "./App.css";

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem("socialcalc_docs_theme") === "dark";
  });
  const [activeChapterId, setActiveChapterId] = useState<string>("introduction");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("socialcalc_docs_theme", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark-theme");
    } else {
      document.documentElement.classList.remove("dark-theme");
    }
  }, [isDark]);

  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return DOCS_DATA;
    const q = searchQuery.toLowerCase();
    return DOCS_DATA.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeChapter: DocChapter = useMemo(() => {
    return (
      DOCS_DATA.find((c) => c.id === activeChapterId) ||
      DOCS_DATA[0]
    );
  }, [activeChapterId]);

  const currentIndex = DOCS_DATA.findIndex((c) => c.id === activeChapter.id);
  const prevChapter = currentIndex > 0 ? DOCS_DATA[currentIndex - 1] : null;
  const nextChapter = currentIndex < DOCS_DATA.length - 1 ? DOCS_DATA[currentIndex + 1] : null;

  const handleSelectChapter = (id: string) => {
    setActiveChapterId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Renderer for rich markdown content including code blocks and tables
  const renderFormattedContent = (content: string) => {
    const lines = content.trim().split("\n");
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeLines: string[] = [];

    const flushList = () => {
      if (inList && listItems.length > 0) {
        elements.push(<ul key={`ul-${elements.length}`} className="doc-ul">{listItems}</ul>);
        listItems = [];
        inList = false;
      }
    };

    const flushTable = () => {
      if (inTable && tableRows.length > 0) {
        const headerRow = tableRows[0];
        const bodyRows = tableRows.slice(1).filter((r) => !r.every((c) => c.match(/^[-:]+$/)));
        elements.push(
          <div key={`table-wrapper-${elements.length}`} className="table-responsive-wrapper">
            <table className="doc-table">
              <thead>
                <tr>
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx}>{renderInlineFormatting(cell.trim())}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{renderInlineFormatting(cell.trim())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    const flushCodeBlock = () => {
      if (inCodeBlock) {
        const codeText = codeLines.join("\n");
        elements.push(
          <CodeBlock
            key={`code-${elements.length}`}
            code={codeText}
            language={codeLanguage || "text"}
          />
        );
        codeLines = [];
        codeLanguage = "";
        inCodeBlock = false;
      }
    };

    lines.forEach((rawLine, idx) => {
      const trimmed = rawLine.trim();

      if (trimmed.startsWith("```")) {
        flushList();
        flushTable();
        if (inCodeBlock) {
          flushCodeBlock();
        } else {
          inCodeBlock = true;
          codeLanguage = trimmed.replace("```", "").trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeLines.push(rawLine);
        return;
      }

      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        flushList();
        inTable = true;
        const cols = trimmed
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());
        tableRows.push(cols);
        return;
      } else if (inTable) {
        flushTable();
      }

      if (trimmed.startsWith("### ")) {
        flushList();
        elements.push(<h3 key={idx} className="doc-h3">{trimmed.replace("### ", "")}</h3>);
      } else if (trimmed.startsWith("#### ")) {
        flushList();
        elements.push(<h4 key={idx} className="doc-h4">{trimmed.replace("#### ", "")}</h4>);
      } else if (trimmed.startsWith("- ")) {
        inList = true;
        const text = trimmed.substring(2);
        listItems.push(<li key={`li-${idx}`}>{renderInlineFormatting(text)}</li>);
      } else if (/^\d+\.\s/.test(trimmed)) {
        flushList();
        const dotIdx = trimmed.indexOf(".");
        const num = trimmed.substring(0, dotIdx + 1);
        const rest = trimmed.substring(dotIdx + 2);
        elements.push(
          <p key={idx} className="doc-ordered-item">
            <span className="doc-list-num">{num}</span>
            <span>{renderInlineFormatting(rest)}</span>
          </p>
        );
      } else if (trimmed.startsWith("> ")) {
        flushList();
        elements.push(
          <blockquote key={idx} className="doc-blockquote">
            {renderInlineFormatting(trimmed.replace("> ", ""))}
          </blockquote>
        );
      } else if (trimmed.startsWith("![") && trimmed.includes("](") && trimmed.endsWith(")")) {
        flushList();
        flushTable();
        const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          const src = imgMatch[2];
          let sizeClass = "doc-figure-compact";
          if (src.includes("agent-console") || src.includes("headers")) {
            sizeClass = "doc-figure-wide";
          } else if (
            src.includes("edit-cell-modal") ||
            src.includes("col-resize") ||
            src.includes("row-options") ||
            src.includes("cell-format")
          ) {
            sizeClass = "doc-figure-small";
          } else if (src.includes("editable-cells-modal")) {
            sizeClass = "doc-figure-compact";
          }

          elements.push(
            <figure key={idx} className={`doc-figure ${sizeClass}`}>
              <img src={src} alt={imgMatch[1]} className="doc-image" loading="lazy" />
              {imgMatch[1] && <figcaption className="doc-figcaption">{imgMatch[1]}</figcaption>}
            </figure>
          );
        }
      } else if (trimmed.length > 0) {
        flushList();
        elements.push(<p key={idx} className="doc-p">{renderInlineFormatting(trimmed)}</p>);
      }
    });

    flushList();
    flushTable();
    flushCodeBlock();

    return elements;
  };

  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={i} className="doc-inline-code">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="doc-strong">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`docs-layout ${isDark ? "dark-theme" : ""}`}>
      {/* Navbar */}
      <header className="docs-navbar">
        <div className="navbar-brand" onClick={() => handleSelectChapter("introduction")}>
          <div className="brand-icon">
            <Grid3X3 size={16} />
          </div>
          <span className="brand-title">SocialCalc AI</span>
        </div>

        <div className="navbar-actions">
          <div className="search-container">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search docs…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <a
            href="https://www.npmjs.com/package/socialcalc-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="npm-launch-btn"
            title="View socialcalc-ai on npm"
          >
            <span className="npm-badge-pill">npm</span>
            <span>v1.0.3</span>
            <ExternalLink size={12} />
          </a>

          <button
            className="icon-btn"
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            type="button"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="docs-main-container">
        {/* Sidebar */}
        <aside className="docs-sidebar">
          {DOC_CATEGORIES.map((category) => {
            const chaptersInCategory = filteredChapters.filter(
              (c) => c.category === category
            );
            if (chaptersInCategory.length === 0) return null;

            return (
              <div key={category} className="sidebar-category-group">
                <div className="category-title">{category}</div>
                <ul className="chapter-nav-list">
                  {chaptersInCategory.map((chapter) => (
                    <li
                      key={chapter.id}
                      className={`chapter-nav-item ${
                        activeChapter.id === chapter.id ? "active" : ""
                      }`}
                      onClick={() => handleSelectChapter(chapter.id)}
                    >
                      <span>{chapter.title}</span>
                      {chapter.badge && (
                        <span className="chapter-badge">{chapter.badge}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="docs-content-area">
          <div className="doc-header">
            <div className="doc-category-tag">{activeChapter.category}</div>
            <div className="doc-title-row">
              <h1 className="doc-main-title">{activeChapter.title}</h1>
              {activeChapter.badge && (
                <span className="brand-badge">{activeChapter.badge}</span>
              )}
            </div>
            <p className="doc-description">{activeChapter.description}</p>
          </div>

          {/* Hero — only on Introduction */}
          {activeChapter.id === "introduction" && (
            <div className="docs-hero-card">
              <h2 className="hero-heading">
                A spreadsheet engine built for the modern stack.
              </h2>
              <p className="hero-subtitle">
                Modular calculation engine, plug-in architecture, standard MSC data format,
                and pre-built React &amp; Ionic components — all in a single, dependency-light package.
              </p>
              <div className="hero-btn-row">
                <a
                  href="http://localhost:5173"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hero-action-btn"
                >
                  Open live editor
                </a>
                <button
                  className="hero-action-btn"
                  style={{ background: "rgba(255, 255, 255, 0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.24)" }}
                  onClick={() => handleSelectChapter("quick-start")}
                  type="button"
                >
                  Read the quick start
                </button>
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="doc-body-markdown">
            {renderFormattedContent(activeChapter.content)}
          </div>

          {/* Standalone code snippet */}
          {activeChapter.codeSnippet && (
            <div style={{ marginTop: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)" }}>
                <Code2 size={15} />
                <span>Example</span>
              </div>
              <CodeBlock
                code={activeChapter.codeSnippet.code}
                language={activeChapter.codeSnippet.language}
              />
            </div>
          )}

          {/* Prev / Next */}
          <div className="doc-footer-nav">
            {prevChapter ? (
              <button
                className="doc-nav-btn"
                onClick={() => handleSelectChapter(prevChapter.id)}
                type="button"
              >
                <ChevronLeft size={14} />
                <span>{prevChapter.title}</span>
              </button>
            ) : (
              <div />
            )}

            {nextChapter ? (
              <button
                className="doc-nav-btn"
                onClick={() => handleSelectChapter(nextChapter.id)}
                type="button"
              >
                <span>{nextChapter.title}</span>
                <ChevronRight size={14} />
              </button>
            ) : (
              <div />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
