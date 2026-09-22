import React, { useEffect } from "react";
import {
  ArrowRight,
  Blocks,
  Bot,
  ExternalLink,
  FileSpreadsheet,
  Package,
  Rocket,
  Server,
  Sparkles,
} from "lucide-react";
import { HeroVideo } from "../components/HeroVideo";
import { GithubIcon } from "../components/GithubIcon";
import { CodeBlock } from "../components/CodeBlock";
import { Link } from "../router";
import { ASPIRING_APPS, PACKAGES } from "../siteConfig";

const STATS = [
  { value: "109", label: "built-in formula functions" },
  { value: "48", label: "MCP tools for AI agents" },
  { value: "7", label: "React & Ionic components" },
  { value: "8", label: "switchable plugins" },
];

const GALLERY = [
  {
    src: "/screenshots/live/agent-filled-invoice.png",
    title: "AI agent fills a template",
    body: "Three agent actions filled the invoice header, line items and total formula.",
    to: "/socialcalc#ai-agent-plugin",
  },
  {
    src: "/screenshots/live/agent-workbench.png",
    title: "Agent Workbench",
    body: "Prompt the copilot, run quick actions or paste an action array.",
    to: "/socialcalc#react-components",
  },
  {
    src: "/screenshots/live/cell-edit-options.png",
    title: "Cell Edit Modal",
    body: "Colors, formats, borders and images for any cell, touch-first.",
    to: "/socialcalc#react-components",
  },
  {
    src: "/screenshots/live/export-share.png",
    title: "Export, share & print",
    body: "PDF, CSV and MSC exports that work offline on web, iOS and Android.",
    to: "/socialcalc#export-share-print",
  },
  {
    src: "/screenshots/live/cell-mappings.png",
    title: "Editable cells & mappings",
    body: "Lock a template and expose only the fields users should fill.",
    to: "/socialcalc#standard-msc-data",
  },
  {
    src: "/screenshots/live/row-popover.png",
    title: "Row actions",
    body: "Tap a row number to insert or delete rows.",
    to: "/socialcalc#react-components",
  },
];

export const Dashboard: React.FC = () => {
  useEffect(() => {
    document.title = "SocialCalc AI · Spreadsheet engine, React plugins and MCP server";
  }, []);

  return (
    <div className="dash">
      {/* Hero */}
      <section className="dash-hero">
        <div className="dash-hero-copy">
          <span className="dash-eyebrow"><Sparkles size={14} /> Open source · MIT</span>
          <h1>Spreadsheets that AI can read, write and build.</h1>
          <p>
            SocialCalc AI is Dan Bricklin's SocialCalc engine rebuilt as ES modules, with React &amp; Ionic
            components, an AI agent plugin and an MCP server that lets Claude, Cursor and other agents create
            real workbooks.
          </p>
          <div className="dash-cta-row">
            <Link to="/socialcalc" className="dash-btn dash-btn-primary">
              SocialCalc module docs <ArrowRight size={16} />
            </Link>
            <Link to="/mcp" className="dash-btn dash-btn-secondary">
              MCP server docs <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <HeroVideo />
      </section>

      {/* Stats */}
      <section className="dash-stats" aria-label="At a glance">
        {STATS.map((s) => (
          <div key={s.label} className="dash-stat">
            <div className="dash-stat-value">{s.value}</div>
            <div className="dash-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Packages */}
      <section className="dash-section">
        <div className="dash-section-head">
          <h2>Two packages, one spreadsheet format</h2>
          <p>
            Both packages read and write the same SocialCalc MSC workbooks, so a file an agent builds through the
            MCP server opens directly in the React editor.
          </p>
        </div>

        <div className="dash-packages">
          <article className="dash-package">
            <div className="dash-package-icon"><FileSpreadsheet size={22} /></div>
            <div className="dash-package-title">
              <h3>{PACKAGES.socialcalc.name}</h3>
              <span className="brand-badge">v{PACKAGES.socialcalc.version}</span>
            </div>
            <p>
              The spreadsheet engine and UI for web and mobile apps: formula engine, touch grid, plugins,
              React/Ionic modals, AI agent actions, offline PDF export and native share/print.
            </p>
            <CodeBlock code={PACKAGES.socialcalc.install} language="bash" />
            <div className="dash-package-links">
              <Link to="/socialcalc" className="dash-link-strong">Read the docs <ArrowRight size={14} /></Link>
              <a href={PACKAGES.socialcalc.npm} target="_blank" rel="noopener noreferrer"><Package size={14} /> npm</a>
              <a href={PACKAGES.socialcalc.github} target="_blank" rel="noopener noreferrer"><GithubIcon size={14} /> GitHub</a>
            </div>
          </article>

          <article className="dash-package">
            <div className="dash-package-icon dash-package-icon-alt"><Server size={22} /></div>
            <div className="dash-package-title">
              <h3>{PACKAGES.mcp.name}</h3>
              <span className="brand-badge">v{PACKAGES.mcp.version}</span>
            </div>
            <p>
              A Model Context Protocol server with 48 tools to inspect, build, style and validate SocialCalc
              workbooks. Works with Claude Desktop, Claude Code, Cursor, VS Code and Windsurf.
            </p>
            <CodeBlock code={PACKAGES.mcp.install} language="bash" />
            <div className="dash-package-links">
              <Link to="/mcp" className="dash-link-strong">Read the docs <ArrowRight size={14} /></Link>
              <a href={PACKAGES.mcp.npm} target="_blank" rel="noopener noreferrer"><Package size={14} /> npm</a>
              <a href={PACKAGES.mcp.github} target="_blank" rel="noopener noreferrer"><GithubIcon size={14} /> GitHub</a>
            </div>
          </article>
        </div>
      </section>

      {/* Quick start */}
      <section className="dash-section">
        <div className="dash-section-head">
          <h2>Get started</h2>
        </div>
        <div className="dash-steps">
          <div className="dash-step">
            <div className="dash-step-num">1</div>
            <h3>Add the spreadsheet to your app</h3>
            <p>Mount the engine into a div and switch on the plugins you want.</p>
            <CodeBlock
              language="tsx"
              code={`import * as SC from "socialcalc-ai";

SC.initializeApp("");        // mounts into #tableeditor
SC.enableRowColHeaders();
SC.enableGridLines();
SC.enableTouchScroll();`}
            />
            <Link to="/socialcalc#quick-start" className="dash-link-strong">Quick start guide <ArrowRight size={14} /></Link>
          </div>
          <div className="dash-step">
            <div className="dash-step-num">2</div>
            <h3>Give your AI agent spreadsheet tools</h3>
            <p>Register the MCP server in your AI client's config.</p>
            <CodeBlock
              language="json"
              code={`{
  "mcpServers": {
    "socialcalc-mcp": {
      "command": "npx",
      "args": ["-y", "socialcalc-mcp"]
    }
  }
}`}
            />
            <Link to="/mcp#mcp-install" className="dash-link-strong">Client setup guides <ArrowRight size={14} /></Link>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="dash-section">
        <div className="dash-section-head">
          <h2>See it working</h2>
          <p>Screenshots captured with Playwright from the showcase app in this repository.</p>
        </div>
        <div className="dash-gallery">
          {GALLERY.map((g) => (
            <Link key={g.src} to={g.to} className="dash-shot">
              <div className="dash-shot-img"><img src={g.src} alt={g.title} loading="lazy" /></div>
              <div className="dash-shot-body">
                <h3>{g.title}</h3>
                <p>{g.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Built on SocialCalc */}
      <section className="dash-section">
        <div className="dash-banners">
          <a className="dash-banner" href={ASPIRING_APPS.appsHome} target="_blank" rel="noopener noreferrer">
            <div className="dash-banner-icon"><Blocks size={24} /></div>
            <div>
              <h3>Explore apps built on SocialCalc</h3>
              <p>Invoices, receipts, timesheets, budgets and more, published by Aspiring Apps.</p>
            </div>
            <span className="dash-banner-cta">Explore apps <ExternalLink size={14} /></span>
          </a>
          <a className="dash-banner dash-banner-alt" href={ASPIRING_APPS.hostedMcp} target="_blank" rel="noopener noreferrer">
            <div className="dash-banner-icon"><Bot size={24} /></div>
            <div>
              <h3>Already running in production</h3>
              <p>Aspiring Apps runs the SocialCalc MCP server as a hosted connector for AI assistants.</p>
            </div>
            <span className="dash-banner-cta">aspiringapps.com/mcp <ExternalLink size={14} /></span>
          </a>
        </div>
      </section>

      <footer className="dash-footer">
        <div>
          <Rocket size={14} /> SocialCalc AI. Original SocialCalc engine by Dan Bricklin and Socialtext. Modernized by Anirudh Sharma. MIT License.
        </div>
        <div className="dash-footer-links">
          <Link to="/socialcalc">SocialCalc docs</Link>
          <Link to="/mcp">MCP docs</Link>
          <a href={PACKAGES.socialcalc.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={ASPIRING_APPS.appsHome} target="_blank" rel="noopener noreferrer">Aspiring Apps</a>
        </div>
      </footer>
    </div>
  );
};
