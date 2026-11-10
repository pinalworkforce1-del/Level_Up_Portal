/**
 * Cloudflare Worker: youth-facing Level Up entry at start.levelupcareers.org.
 *
 * Serves the CURRENT GitHub Pages build, without copying Career Tree or
 * touching the existing levelupcareers.org DNS/redirect/sign-in route.
 *
 * The injected meta flag is the only signal used by the portal to enter
 * youth mode. On the original Level Up host, this flag never exists.
 */
const ORIGIN = "https://pinalworkforce1-del.github.io";
const PREFIX = "/Level_Up_Portal";
const YOUTH_META = '<meta name="level-up-youth-entry" content="1">';

export function mapUpstreamPath(pathname) {
  if (pathname === PREFIX || pathname.startsWith(PREFIX + "/")) return pathname;
  return PREFIX + (pathname.startsWith("/") ? pathname : "/" + pathname);
}

class YouthEntryFlag {
  element(element) {
    element.append(YOUTH_META, { html: true });
  }
}

export default {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const incoming = new URL(request.url);
    const upstreamURL = new URL(ORIGIN + mapUpstreamPath(incoming.pathname) + incoming.search);

    // Never pass participant cookies, auth tokens, or custom headers to GitHub.
    const allowed = ["accept", "accept-language", "range", "if-range", "if-none-match", "if-modified-since"];
    const outgoingHeaders = new Headers();
    for (const name of allowed) {
      const value = request.headers.get(name);
      if (value) outgoingHeaders.set(name, value);
    }

    let upstream;
    try {
      upstream = await fetch(upstreamURL.toString(), {
        method: request.method,
        headers: outgoingHeaders,
        redirect: "manual",
      });
    } catch (_) {
      return new Response("Level Up is temporarily unavailable.", {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    const headers = new Headers(upstream.headers);
    headers.delete("set-cookie");
    headers.set("x-content-type-options", "nosniff");

    // Keep canonical GitHub Pages slash redirects on the youth hostname.
    const location = headers.get("location");
    if (location) {
      const destination = new URL(location, upstreamURL);
      if (
        destination.origin === ORIGIN &&
        (destination.pathname === PREFIX || destination.pathname.startsWith(PREFIX + "/"))
      ) {
        const visible = new URL(request.url);
        visible.pathname = destination.pathname.slice(PREFIX.length) || "/";
        visible.search = destination.search;
        visible.hash = destination.hash;
        headers.set("location", visible.toString());
      }
    }

    const html = (headers.get("content-type") || "").toLowerCase().includes("text/html");
    if (html) {
      // The source can change when GitHub Pages deploys; do not cache login HTML.
      headers.set("cache-control", "no-store");
      headers.delete("content-length");
    }

    const bodyless = request.method === "HEAD" || [204, 205, 304].includes(upstream.status);
    const response = new Response(bodyless ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });

    if (html && request.method === "GET" && upstream.ok) {
      return new HTMLRewriter().on("head", new YouthEntryFlag()).transform(response);
    }
    return response;
  },
};
