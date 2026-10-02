// Links, versions and media shared across the docs site.
// Update versions here when a new package is published.

export const PACKAGES = {
  socialcalc: {
    name: "socialcalc-ai",
    version: "1.0.9",
    npm: "https://www.npmjs.com/package/socialcalc-ai",
    github: "https://github.com/aspiringsdgs/socialcalc-ai",
    install: "npm install socialcalc-ai",
  },
  mcp: {
    name: "socialcalc-mcp",
    version: "1.0.6",
    npm: "https://www.npmjs.com/package/socialcalc-mcp",
    github: "https://github.com/anisharma07/socialcalc-mcp",
    install: "npx -y socialcalc-mcp",
  },
} as const;

export const ASPIRING_APPS = {
  appsHome: "http://aspiringapps.com/web/home/index.html",
  hostedMcp: "http://aspiringapps.com/mcp",
} as const;

/**
 * Intro video shown at the top of the dashboard.
 *
 * - A YouTube link ("https://www.youtube.com/watch?v=..." or "https://youtu.be/...") is embedded.
 * - Any other URL, or a file placed in docs/public/videos/ (e.g. "/videos/socialcalc-intro.mp4"),
 *   plays in a <video> element.
 * - Leave `src` empty to show a placeholder.
 *
 * `poster` is only used for that placeholder; a configured video shows its own first frame.
 */
export const HERO_VIDEO = {
  src: "/socialcalc-intro.mp4",
  poster: "/screenshots/live/agent-filled-invoice.png",
  title: "SocialCalc AI demo",
};
