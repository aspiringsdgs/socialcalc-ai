import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Code2, ExternalLink, Search } from "lucide-react";
import type { DocChapter } from "../docsData";
import { CodeBlock } from "../components/CodeBlock";
import { Markdown } from "../components/Markdown";
import { navigate } from "../router";

export interface DocsProduct {
  route: "/socialcalc" | "/mcp";
  name: string;
  tagline: string;
  version: string;
  links: { label: string; href: string }[];
  categories: readonly string[];
  chapters: DocChapter[];
}

interface Props {
  product: DocsProduct;
  chapterId: string;
}

export const DocsPage: React.FC<Props> = ({ product, chapterId }) => {
  const { chapters, categories, route } = product;
  const [query, setQuery] = useState("");

  const active = chapters.find((c) => c.id === chapterId) || chapters[0];
  const index = chapters.indexOf(active);
  const prev = index > 0 ? chapters[index - 1] : null;
  const next = index < chapters.length - 1 ? chapters[index + 1] : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chapters;
    return chapters.filter((c) =>
      [c.title, c.category, c.description, c.content, c.codeSnippet?.code ?? ""].some((s) => s.toLowerCase().includes(q))
    );
  }, [query, chapters]);

  useEffect(() => {
    document.title = `${active.title} · ${product.name} docs`;
  }, [active, product.name]);

  const open = (id: string) => {
    navigate(`${route}#${id}`);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="docs-main-container">
      <aside className="docs-sidebar" aria-label={`${product.name} chapters`}>
        <div className="sidebar-product">
          <div className="sidebar-product-name">{product.name}</div>
          <div className="sidebar-product-version">v{product.version}</div>
        </div>
        <div className="search-container sidebar-search">
          <Search size={14} className="search-icon" />
          <input
            type="search"
            className="search-input"
            placeholder="Search these docs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search these docs"
          />
        </div>

        {categories.map((category) => {
          const items = filtered.filter((c) => c.category === category);
          if (!items.length) return null;
          return (
            <div key={category} className="sidebar-category-group">
              <div className="category-title">{category}</div>
              <ul className="chapter-nav-list">
                {items.map((chapter) => (
                  <li key={chapter.id}>
                    <a
                      href={`${route}#${chapter.id}`}
                      className={`chapter-nav-item ${active.id === chapter.id ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        open(chapter.id);
                      }}
                    >
                      <span>{chapter.title}</span>
                      {chapter.badge && <span className="chapter-badge">{chapter.badge}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {!filtered.length && <p className="sidebar-empty">No chapters match “{query}”.</p>}

        <div className="sidebar-links">
          {product.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label} <ExternalLink size={11} />
            </a>
          ))}
        </div>
      </aside>

      <main className="docs-content-area">
        {/* Chapter picker for narrow screens, where the sidebar is hidden */}
        <label className="mobile-chapter-picker">
          <span>{product.name} docs</span>
          <select value={active.id} onChange={(e) => open(e.target.value)}>
            {categories.map((category) => (
              <optgroup key={category} label={category}>
                {chapters
                  .filter((c) => c.category === category)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="doc-header">
          <div className="doc-category-tag">{active.category}</div>
          <div className="doc-title-row">
            <h1 className="doc-main-title">{active.title}</h1>
            {active.badge && <span className="brand-badge">{active.badge}</span>}
          </div>
          <p className="doc-description">{active.description}</p>
        </div>

        <div className="doc-body-markdown">
          <Markdown content={active.content} />
        </div>

        {active.codeSnippet && (
          <div className="doc-example">
            <div className="doc-example-label">
              <Code2 size={15} />
              <span>Example</span>
            </div>
            <CodeBlock code={active.codeSnippet.code} language={active.codeSnippet.language} />
          </div>
        )}

        <nav className="doc-footer-nav" aria-label="Chapter navigation">
          {prev ? (
            <button className="doc-nav-btn" onClick={() => open(prev.id)} type="button">
              <ChevronLeft size={14} />
              <span>{prev.title}</span>
            </button>
          ) : <div />}
          {next ? (
            <button className="doc-nav-btn" onClick={() => open(next.id)} type="button">
              <span>{next.title}</span>
              <ChevronRight size={14} />
            </button>
          ) : <div />}
        </nav>
      </main>
    </div>
  );
};
