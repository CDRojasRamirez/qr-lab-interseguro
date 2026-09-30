/**
 * Reads the `sub` claim for display purposes only. The signature is NOT verified here:
 * the APIs verify it; the UI just shows who is signed in.
 */
export function jwtSubject(token: string | null): string | null {
  const payload = token?.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(base64)) as { sub?: unknown };
    return typeof claims.sub === 'string' && claims.sub.length > 0 ? claims.sub : null;
  } catch {
    return null;
  }
}
