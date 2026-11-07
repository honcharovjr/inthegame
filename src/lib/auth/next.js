// Where an email link sends the player after it is confirmed. The email
// templates pass Supabase's RedirectTo, a full address on this site (or the
// bare site address when that address is not allowed). Only places on this
// site are accepted; anything else, and the start page, lead to Home in /app.
export function linkTarget(next, origin) {
  if (typeof next !== "string" || !next) return "/app";
  if (next.startsWith("//")) return "/app";
  let url;
  try {
    url = new URL(next, origin);
  } catch {
    return "/app";
  }
  if (url.origin !== new URL(origin).origin) return "/app";
  const path = `${url.pathname}${url.search}`;
  return path === "/" ? "/app" : path;
}
