import React from "react";
import { CodeBlock } from "./CodeBlock";
import { Link } from "../router";

// Renders the small markdown subset used in the docs data files:
// ### / #### headings, paragraphs, - lists, 1. lists, > quotes, | tables |, ``` code ```,
// images ![caption](src "wide|compact|small") and inline `code`, **bold** and [links](url).

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

function renderInline(text: string): React.ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="doc-inline-code">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="doc-strong">{part.slice(2, -2)}</strong>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      if (href.startsWith("/")) {
        return <Link key={i} to={href} className="doc-link">{renderInline(label)}</Link>;
      }
      return (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="doc-link">
          {renderInline(label)}
        </a>
      );
    }
    return part;
  });
}

// Size for screenshots that predate the size hint.
function legacyFigureSize(src: string) {
  if (src.includes("agent-console") || src.includes("headers")) return "wide";
  if (/edit-cell-modal|col-resize|row-options|cell-format/.test(src)) return "small";
  return "compact";
}

export const Markdown: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.trim().split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let codeLines: string[] | null = null;
  let codeLanguage = "";

  const flushList = () => {
    if (listItems.length) {
      elements.push(<ul key={`ul-${elements.length}`} className="doc-ul">{listItems}</ul>);
      listItems = [];
    }
  };

  const flushTable = () => {
    if (!tableRows.length) return;
    const [header, ...rest] = tableRows;
    const body = rest.filter((r) => !r.every((c) => /^:?-+:?$/.test(c)));
    elements.push(
      <div key={`table-${elements.length}`} className="table-responsive-wrapper">
        <table className="doc-table">
          <thead>
            <tr>{header.map((c, i) => <th key={i}>{renderInline(c)}</th>)}</tr>
          </thead>
          <tbody>
            {body.map((row, r) => (
              <tr key={r}>{row.map((c, i) => <td key={i}>{renderInline(c)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableRows = [];
  };

  lines.forEach((rawLine, idx) => {
    const trimmed = rawLine.trim();

    if (trimmed.startsWith("```")) {
      flushList();
      flushTable();
      if (codeLines) {
        elements.push(<CodeBlock key={`code-${idx}`} code={codeLines.join("\n")} language={codeLanguage || "text"} />);
        codeLines = null;
      } else {
        codeLines = [];
        codeLanguage = trimmed.slice(3).trim();
      }
      return;
    }
    if (codeLines) {
      codeLines.push(rawLine);
      return;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      // Split on pipes that are not escaped as \|
      tableRows.push(trimmed.slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|")));
      return;
    }
    flushTable();

    if (trimmed.startsWith("#### ")) {
      flushList();
      elements.push(<h4 key={idx} className="doc-h4">{renderInline(trimmed.slice(5))}</h4>);
    } else if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={idx} className="doc-h3">{renderInline(trimmed.slice(4))}</h3>);
    } else if (trimmed.startsWith("- ")) {
      listItems.push(<li key={idx}>{renderInline(trimmed.slice(2))}</li>);
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushList();
      const dot = trimmed.indexOf(".");
      elements.push(
        <p key={idx} className="doc-ordered-item">
          <span className="doc-list-num">{trimmed.slice(0, dot + 1)}</span>
          <span>{renderInline(trimmed.slice(dot + 2))}</span>
        </p>
      );
    } else if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(<blockquote key={idx} className="doc-blockquote">{renderInline(trimmed.slice(2))}</blockquote>);
    } else if (/^!\[.*\]\(.*\)$/.test(trimmed)) {
      flushList();
      const m = trimmed.match(/^!\[(.*?)\]\((\S+?)(?:\s+"(\w+)")?\)$/);
      if (m) {
        const [, alt, src, hint] = m;
        const size = hint || legacyFigureSize(src);
        elements.push(
          <figure key={idx} className={`doc-figure doc-figure-${size}`}>
            <a href={src} target="_blank" rel="noopener noreferrer" title="Open full size">
              <img src={src} alt={alt} className="doc-image" loading="lazy" />
            </a>
            {alt && <figcaption className="doc-figcaption">{alt}</figcaption>}
          </figure>
        );
      }
    } else if (/^\*[^*].*\*$/.test(trimmed)) {
      // A line wrapped in single asterisks is a caption-style note.
      flushList();
      elements.push(<p key={idx} className="doc-note">{renderInline(trimmed.slice(1, -1))}</p>);
    } else if (trimmed) {
      flushList();
      elements.push(<p key={idx} className="doc-p">{renderInline(trimmed)}</p>);
    }
  });

  flushList();
  flushTable();
  return <>{elements}</>;
};
