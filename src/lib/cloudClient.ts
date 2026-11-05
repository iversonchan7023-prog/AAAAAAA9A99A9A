// MantleDB — zero-config cloud key-value store (https://mantledb.sh)
// No env vars, no account, no Supabase setup required. The namespace below is
// pre-claimed and locked to a write key so only this app can store data in it.
// Each user's sync passphrase maps to one JSON entry at /v2/fittrack-app/<syncKey>.

export const MANTLE_BASE = 'https://mantledb.sh';
export const MANTLE_NAMESPACE = 'fittrack-app';
// Write key for the fittrack-app namespace. Required for POST/DELETE on claimed
// namespaces. Safe to ship in client code for this personal single-tenant app —
// it only authorizes writes within this one namespace, and the real access gate
// is the user's private sync passphrase (the path segment), which we validate.
export const MANTLE_WRITE_KEY = 'ff6dfb19d5103879926cc60579b464248aba76d70380d8b478c0461fe1fd0673';

export function isCloudConfigured(): boolean {
  return Boolean(MANTLE_BASE && MANTLE_NAMESPACE && MANTLE_WRITE_KEY);
}

export function entryUrl(syncKey: string): string {
  const safe = encodeURIComponent(syncKey.trim());
  return `${MANTLE_BASE}/v2/${MANTLE_NAMESPACE}/${safe}`;
}

export function visibilityUrl(syncKey: string): string {
  const safe = encodeURIComponent(syncKey.trim());
  return `${MANTLE_BASE}/v2/visibility/${MANTLE_NAMESPACE}/${safe}`;
}

export function writeHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Mantle-Key': MANTLE_WRITE_KEY,
  };
}
