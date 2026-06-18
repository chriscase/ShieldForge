/**
 * Transport (a): the shared parent-domain realm cookie for members on the SAME
 * registrable domain (e.g. www + wiki under .mystrangemind.com). Pure helpers —
 * the host wires them to its request/response. The cookie is ONE-SHOT (cleared
 * after bootstrap) and is set ALONGSIDE the host's native session cookie.
 *
 * SECURITY (login-CSRF): a parent-domain cookie can span multiple codebases
 * sharing one registrable domain, so the auto-bootstrap-on-cookie-presence MUST
 * be confirmed via a same-site POST (or a short interstitial), NOT a bare
 * top-level GET, and SHOULD be bound to a per-issue nonce the relying member
 * validates. The single-use `jti` already bounds replay to one short window.
 */

export function realmCookieName(realmId: string): string {
  return `sfr_${realmId}`;
}

/**
 * The Domain attribute for a realm cookie, or `undefined` (host-only) when the
 * host is not safely under `base`. Generalized from OMS's `cookieDomainForHost`:
 * returns the leading-dot parent ONLY for the apex or a subdomain of `base`, and
 * host-only for custom/foreign domains, localhost, *.local, and IPs.
 */
export function realmCookieDomain(host: string, base: string): string | undefined {
  const h = (host || '').split(':')[0].trim().toLowerCase();
  const b = (base || '').split(':')[0].trim().toLowerCase();
  if (!h || !b) return undefined;
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) return undefined;
  if (h.includes(':') || /^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return undefined; // IPv6 / IPv4
  if (h === b || h.endsWith('.' + b)) return '.' + b;
  return undefined; // foreign / custom domain → host-only
}

export interface RealmCookieOptions {
  realmId: string;
  host: string;
  base: string;
  /** Cookie lifetime in seconds; should match the token TTL. Default 120. */
  maxAgeSec?: number;
  /** Set the Secure attribute (default true). */
  secure?: boolean;
}

/** Build a `Set-Cookie` header value carrying the realm token. */
export function buildRealmSetCookie(token: string, opts: RealmCookieOptions): string {
  const domain = realmCookieDomain(opts.host, opts.base);
  const parts = [
    `${realmCookieName(opts.realmId)}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${opts.maxAgeSec ?? 120}`,
  ];
  if (opts.secure !== false) parts.push('Secure');
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join('; ');
}

/** Build a `Set-Cookie` header value that CLEARS the realm cookie (one-shot). */
export function buildRealmClearCookie(
  opts: Pick<RealmCookieOptions, 'realmId' | 'host' | 'base'>,
): string {
  const domain = realmCookieDomain(opts.host, opts.base);
  const parts = [`${realmCookieName(opts.realmId)}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join('; ');
}

/** Read the realm token from a `Cookie` request header, or null. */
export function readRealmCookie(
  cookieHeader: string | null | undefined,
  realmId: string,
): string | null {
  if (!cookieHeader) return null;
  const name = realmCookieName(realmId);
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim() || null;
  }
  return null;
}
