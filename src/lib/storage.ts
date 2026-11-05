import type { AppData } from './types';
import { createDefaultData } from './defaultData';
import { isCloudConfigured, entryUrl, visibilityUrl, writeHeaders } from './cloudClient';

const LOCAL_KEY = 'fittrack_local_data';
const SYNC_KEY_STORE = 'fittrack_sync_key';

export function loadLocal(): AppData {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed && Array.isArray(parsed.weekPlan)) return parsed;
    }
  } catch {
    // ignore
  }
  const storedKey = localStorage.getItem(SYNC_KEY_STORE) ?? '';
  return createDefaultData(storedKey);
}

export function saveLocal(data: AppData): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  localStorage.setItem(SYNC_KEY_STORE, data.syncKey);
}

export function getStoredSyncKey(): string | null {
  return localStorage.getItem(SYNC_KEY_STORE);
}

export function clearLocal(): void {
  localStorage.removeItem(LOCAL_KEY);
}

/**
 * Pull remote data for the sync key from MantleDB.
 * Returns null if the entry doesn't exist yet or the network fails.
 */
export async function pullRemote(syncKey: string): Promise<AppData | null> {
  if (!isCloudConfigured() || !syncKey) return null;
  try {
    const res = await fetch(entryUrl(syncKey), {
      method: 'GET',
      headers: { 'X-Mantle-Key': writeHeaders()['X-Mantle-Key'] },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn('pullRemote failed', res.status);
      return null;
    }
    const body = await res.json();
    // MantleDB returns the stored JSON directly; older entries may nest under payload.
    const candidate = (body as AppData) ?? (body?.payload as AppData | undefined);
    if (candidate && Array.isArray(candidate.weekPlan)) return candidate;
    return null;
  } catch (e) {
    console.warn('pullRemote error', e);
    return null;
  }
}

/**
 * Push local data to remote (overwrite the entry for this sync key).
 */
export async function pushRemote(data: AppData): Promise<boolean> {
  if (!isCloudConfigured() || !data.syncKey) return false;
  try {
    const payload = { ...data, lastSyncedAt: new Date().toISOString() };
    const res = await fetch(entryUrl(data.syncKey), {
      method: 'POST',
      headers: writeHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn('pushRemote failed', res.status);
      return false;
    }
    // Ensure the entry is publicly readable so other devices can fetch it
    // without embedding the write key in every request.
    await fetch(visibilityUrl(data.syncKey), {
      method: 'PUT',
      headers: writeHeaders(),
      body: JSON.stringify({ public_read: true }),
    }).catch(() => undefined);
    return true;
  } catch (e) {
    console.warn('pushRemote error', e);
    return false;
  }
}

/**
 * Merge remote into local: keep the union of history (by id), and prefer the
 * weekPlan with more in-progress completed sets so neither device loses progress.
 */
export function mergeData(local: AppData, remote: AppData): AppData {
  const remoteIds = new Set(remote.history.map((h) => h.id));
  const mergedHistory = [
    ...remote.history,
    ...local.history.filter((h) => !remoteIds.has(h.id)),
  ];
  const merged: AppData = {
    ...remote,
    history: mergedHistory.sort((a, b) => (a.date < b.date ? 1 : -1)),
    syncKey: local.syncKey || remote.syncKey,
  };
  const localProgress = totalProgress(local);
  const remoteProgress = totalProgress(remote);
  if (localProgress > remoteProgress) {
    merged.weekPlan = local.weekPlan;
    merged.activeDayIndex = local.activeDayIndex;
  }
  return merged;
}

function totalProgress(d: AppData): number {
  return d.weekPlan.reduce(
    (sum, day) => sum + day.exercises.reduce((s, e) => s + e.completedSets, 0),
    0,
  );
}

export async function syncNow(data: AppData): Promise<AppData> {
  saveLocal(data);
  if (!isCloudConfigured() || !data.syncKey) return data;
  const remote = await pullRemote(data.syncKey);
  if (!remote) {
    await pushRemote(data);
    return data;
  }
  const merged = mergeData(data, remote);
  saveLocal(merged);
  await pushRemote(merged);
  return merged;
}
