import type { AppData } from './types';
import { createDefaultData } from './defaultData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

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
 * Pull remote data for the sync key. Returns null if none exists or supabase not configured.
 */
export async function pullRemote(syncKey: string): Promise<AppData | null> {
  if (!isSupabaseConfigured || !syncKey) return null;
  const { data, error } = await supabase
    .from('fitness_sync_data')
    .select('payload')
    .eq('sync_key', syncKey)
    .maybeSingle();
  if (error) {
    console.warn('pullRemote error', error.message);
    return null;
  }
  if (!data) return null;
  return (data.payload as AppData) ?? null;
}

/**
 * Push local data to remote (upsert).
 */
export async function pushRemote(data: AppData): Promise<boolean> {
  if (!isSupabaseConfigured || !data.syncKey) return false;
  const payload = { ...data, lastSyncedAt: new Date().toISOString() };
  const { error } = await supabase
    .from('fitness_sync_data')
    .upsert({ sync_key: data.syncKey, payload, updated_at: new Date().toISOString() });
  if (error) {
    console.warn('pushRemote error', error.message);
    return false;
  }
  return true;
}

/**
 * Merge remote into local: remote wins on conflict for shared fields, but keep
 * local history that remote may not have (append-only merge by id).
 */
export function mergeData(local: AppData, remote: AppData): AppData {
  const remoteIds = new Set(remote.history.map((h) => h.id));
  const mergedHistory = [
    ...remote.history,
    ...local.history.filter((h) => !remoteIds.has(h.id)),
  ];
  // remote weekPlan wins, but keep any local-only completedSets progress if remote older
  const merged: AppData = {
    ...remote,
    history: mergedHistory.sort((a, b) => (a.date < b.date ? 1 : -1)),
    syncKey: local.syncKey || remote.syncKey,
  };
  // prefer the weekPlan with more recent activity (higher total completedSets)
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
  if (!isSupabaseConfigured || !data.syncKey) return data;
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
