import React, { useEffect, useState } from "react";

// Minimal History-API router. Routes: "/", "/socialcalc", "/mcp".
// A chapter inside a docs page is addressed by the hash, e.g. /mcp#tools-editing.

export type Route = "/" | "/socialcalc" | "/mcp";

const KNOWN: Route[] = ["/", "/socialcalc", "/mcp"];

function normalize(pathname: string): Route {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return (KNOWN as string[]).includes(clean) ? (clean as Route) : "/";
}

export function navigate(to: string) {
  const url = new URL(to, window.location.origin);
  if (url.pathname + url.hash === window.location.pathname + window.location.hash) return;
  window.history.pushState({}, "", url.pathname + url.hash);
  window.dispatchEvent(new PopStateEvent("popstate"));
  if (!url.hash) window.scrollTo({ top: 0 });
}

export function useLocation() {
  const read = () => ({ route: normalize(window.location.pathname), hash: window.location.hash.slice(1) });
  const [loc, setLoc] = useState(read);
  useEffect(() => {
    const update = () => setLoc(read());
    window.addEventListener("popstate", update);
    window.addEventListener("hashchange", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("hashchange", update);
    };
  }, []);
  return loc;
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

export const Link: React.FC<LinkProps> = ({ to, onClick, children, ...rest }) => (
  <a
    href={to}
    onClick={(e) => {
      onClick?.(e);
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      navigate(to);
    }}
    {...rest}
  >
    {children}
  </a>
);
