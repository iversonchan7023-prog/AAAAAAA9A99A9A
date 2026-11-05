import { createContext, useContext } from 'react';
import type { AppData, Exercise, DayPlan, CheckinEntry } from './types';

export interface AppContextValue {
  data: AppData;
  setData: (updater: AppData | ((prev: AppData) => AppData)) => void;
  setActiveDay: (idx: number) => void;
  updateDayTheme: (idx: number, theme: string) => void;
  updateExercise: (dayIdx: number, ex: Exercise) => void;
  addExercise: (dayIdx: number, ex: Exercise) => void;
  deleteExercise: (dayIdx: number, exId: string) => void;
  moveExercise: (dayIdx: number, exId: string, dir: -1 | 1) => void;
  setCompletedSets: (dayIdx: number, exId: string, count: number) => void;
  saveTodayTraining: (durationSec: number) => void;
  deleteHistory: (id: string) => void;
  clearHistory: () => void;
  importData: (data: AppData) => void;
  setSyncKey: (key: string) => void;
  triggerSync: () => Promise<void>;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function reorderExercises(plan: DayPlan, exId: string, dir: -1 | 1): DayPlan {
  const exs = [...plan.exercises];
  const idx = exs.findIndex((e) => e.id === exId);
  if (idx < 0) return plan;
  const target = idx + dir;
  if (target < 0 || target >= exs.length) return plan;
  [exs[idx], exs[target]] = [exs[target], exs[idx]];
  return { ...plan, exercises: exs };
}

export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function summaryText(entry: CheckinEntry): string {
  return entry.exercises
    .map((e) => `${e.name} ${e.completedSets}/${e.sets}组`)
    .join(' · ');
}
