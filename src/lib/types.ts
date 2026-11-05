export interface ExerciseImage {
  id: string;
  url: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  unit: 'kg' | 'min';
  images: ExerciseImage[];
  completedSets: number;
  notes?: string;
}

export interface DayPlan {
  dayIndex: number;
  label: string;
  theme: string;
  exercises: Exercise[];
}

export interface CheckinEntry {
  id: string;
  date: string; // YYYY-MM-DD
  dayLabel: string;
  theme: string;
  durationSec: number;
  exercises: {
    name: string;
    sets: number;
    reps: string;
    weight: string;
    unit: 'kg' | 'min';
    completedSets: number;
  }[];
}

export interface AppData {
  version: number;
  activeDayIndex: number;
  weekPlan: DayPlan[];
  history: CheckinEntry[];
  syncKey: string;
  lastSyncedAt: string | null;
}

export type ViewKey = 'training' | 'calendar' | 'history' | 'charts' | 'settings';
