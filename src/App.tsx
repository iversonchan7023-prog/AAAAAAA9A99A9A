import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Dumbbell, Calendar, History as HistoryIcon, TrendingUp, Settings as SettingsIcon, RefreshCw, CloudOff, Cloud, Check } from 'lucide-react';
import type { AppData, CheckinEntry, Exercise, ViewKey } from '@/lib/types';
import type { AppContextValue } from '@/lib/appContext';
import { AppContext } from '@/lib/appContext';
import { loadLocal, saveLocal, syncNow } from '@/lib/storage';
import { createDefaultData } from '@/lib/defaultData';
import { genId } from '@/lib/image';
import { fmtDuration, reorderExercises, todayKey } from '@/lib/appContext';
import TrainingView from '@/views/TrainingView';
import CalendarView from '@/views/CalendarView';
import HistoryView from '@/views/HistoryView';
import ChartsView from '@/views/ChartsView';
import SettingsView from '@/views/SettingsView';

function useTrainingTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number | null>(null);
  const accumRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    const tick = () => {
      setElapsed(accumRef.current + Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (startRef.current) accumRef.current += Math.floor((Date.now() - startRef.current) / 1000);
      startRef.current = null;
    };
  }, [running]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => {
    setRunning(false);
    accumRef.current = 0;
    setElapsed(0);
  }, []);

  return { elapsed, running, start, pause, reset };
}

export default function App() {
  const [data, setDataState] = useState<AppData>(() => loadLocal());
  const [view, setView] = useState<ViewKey>('training');
  const [syncStatus, setSyncStatus] = useState<AppContextValue['syncStatus']>('idle');
  const timer = useTrainingTimer();

  // Apply sync key from URL on first mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('syncKey');
    if (key && key !== data.syncKey) {
      setDataState((prev) => ({ ...prev, syncKey: key }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-sync whenever data changes
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstSync = useRef(true);
  useEffect(() => {
    saveLocal(data);
    if (firstSync.current) {
      firstSync.current = false;
      void triggerSync();
      return;
    }
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => void triggerSync(), 1200);
    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const triggerSync = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const merged = await syncNow(data);
      if (merged !== data) setDataState(merged);
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, [data]);

  const setData = useCallback((updater: AppData | ((prev: AppData) => AppData)) => {
    setDataState((prev) => (typeof updater === 'function' ? (updater as (p: AppData) => AppData)(prev) : updater));
  }, []);

  const setActiveDay = useCallback((idx: number) => {
    setDataState((prev) => ({ ...prev, activeDayIndex: idx }));
  }, []);

  const updateDayTheme = useCallback((idx: number, theme: string) => {
    setDataState((prev) => ({
      ...prev,
      weekPlan: prev.weekPlan.map((d) => (d.dayIndex === idx ? { ...d, theme } : d)),
    }));
  }, []);

  const updateExercise = useCallback((dayIdx: number, ex: Exercise) => {
    setDataState((prev) => ({
      ...prev,
      weekPlan: prev.weekPlan.map((d) =>
        d.dayIndex === dayIdx
          ? { ...d, exercises: d.exercises.map((e) => (e.id === ex.id ? ex : e)) }
          : d,
      ),
    }));
  }, []);

  const addExercise = useCallback((dayIdx: number, ex: Exercise) => {
    setDataState((prev) => ({
      ...prev,
      weekPlan: prev.weekPlan.map((d) =>
        d.dayIndex === dayIdx ? { ...d, exercises: [...d.exercises, ex] } : d,
      ),
    }));
  }, []);

  const deleteExercise = useCallback((dayIdx: number, exId: string) => {
    setDataState((prev) => ({
      ...prev,
      weekPlan: prev.weekPlan.map((d) =>
        d.dayIndex === dayIdx ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d,
      ),
    }));
  }, []);

  const moveExercise = useCallback((dayIdx: number, exId: string, dir: -1 | 1) => {
    setDataState((prev) => ({
      ...prev,
      weekPlan: prev.weekPlan.map((d) => (d.dayIndex === dayIdx ? reorderExercises(d, exId, dir) : d)),
    }));
  }, []);

  const setCompletedSets = useCallback((dayIdx: number, exId: string, count: number) => {
    setDataState((prev) => ({
      ...prev,
      weekPlan: prev.weekPlan.map((d) =>
        d.dayIndex === dayIdx
          ? { ...d, exercises: d.exercises.map((e) => (e.id === exId ? { ...e, completedSets: Math.max(0, count) } : e)) }
          : d,
      ),
    }));
  }, []);

  const saveTodayTraining = useCallback((durationSec: number) => {
    setDataState((prev) => {
      const day = prev.weekPlan[prev.activeDayIndex];
      if (!day) return prev;
      const entry: CheckinEntry = {
        id: genId('chk'),
        date: todayKey(),
        dayLabel: day.label,
        theme: day.theme,
        durationSec,
        exercises: day.exercises.map((e) => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
          unit: e.unit,
          completedSets: e.completedSets,
        })),
      };
      const history = [entry, ...prev.history.filter((h) => !(h.date === entry.date && h.id === entry.id))];
      const weekPlan = prev.weekPlan.map((d) => ({
        ...d,
        exercises: d.exercises.map((e) => ({ ...e, completedSets: 0 })),
      }));
      return { ...prev, history, weekPlan };
    });
  }, []);

  const deleteHistory = useCallback((id: string) => {
    setDataState((prev) => ({ ...prev, history: prev.history.filter((h) => h.id !== id) }));
  }, []);

  const clearHistory = useCallback(() => {
    setDataState((prev) => ({ ...prev, history: [] }));
  }, []);

  const importData = useCallback((incoming: AppData) => {
    setDataState(incoming);
  }, []);

  const setSyncKey = useCallback((key: string) => {
    setDataState((prev) => ({ ...prev, syncKey: key }));
  }, []);

  const ctxValue = useMemo<AppContextValue>(
    () => ({
      data,
      setData,
      setActiveDay,
      updateDayTheme,
      updateExercise,
      addExercise,
      deleteExercise,
      moveExercise,
      setCompletedSets,
      saveTodayTraining,
      deleteHistory,
      clearHistory,
      importData,
      setSyncKey,
      triggerSync,
      syncStatus,
    }),
    [data, setData, setActiveDay, updateDayTheme, updateExercise, addExercise, deleteExercise, moveExercise, setCompletedSets, saveTodayTraining, deleteHistory, clearHistory, importData, setSyncKey, triggerSync, syncStatus],
  );

  const navItems: { key: ViewKey; label: string; icon: typeof Dumbbell }[] = [
    { key: 'training', label: '训练', icon: Dumbbell },
    { key: 'calendar', label: '日历', icon: Calendar },
    { key: 'history', label: '历史', icon: HistoryIcon },
    { key: 'charts', label: '趋势', icon: TrendingUp },
    { key: 'settings', label: '设置', icon: SettingsIcon },
  ];

  const syncIcon =
    syncStatus === 'syncing' ? RefreshCw : syncStatus === 'synced' ? Check : syncStatus === 'error' ? CloudOff : Cloud;
  const syncText = syncStatus === 'syncing' ? '同步中' : syncStatus === 'synced' ? '已同步' : syncStatus === 'error' ? '同步失败' : '云端';
  const SyncIcon = syncIcon;

  return (
    <AppContext.Provider value={ctxValue}>
      <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
        {/* Top bar: sticky timer + brand */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                <Dumbbell size={20} />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold leading-tight">FitTrack</p>
                <p className="text-[11px] text-slate-400 leading-tight">私人训练打卡</p>
              </div>
            </div>

            {/* Timer */}
            <div className="flex-1 flex items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1.5">
                <span className="font-mono text-base font-semibold tabular-nums text-slate-700 tracking-wider">
                  {fmtDuration(timer.elapsed)}
                </span>
              </div>
              <button
                onClick={() => (timer.running ? timer.pause() : timer.start())}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition ${timer.running ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                aria-label={timer.running ? '暂停' : '开始'}
              >
                {timer.running ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={timer.reset}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 hover:bg-slate-300 transition"
                aria-label="重置"
              >
                <RotateCcw size={15} />
              </button>
            </div>

            {/* Sync status */}
            <button
              onClick={triggerSync}
              className="shrink-0 flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700 transition"
              title="点击立即同步"
            >
              <SyncIcon size={15} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{syncText}</span>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-5 pb-28">
          {view === 'training' && <TrainingView elapsedSec={timer.elapsed} resetTimer={timer.reset} />}
          {view === 'calendar' && <CalendarView />}
          {view === 'history' && <HistoryView />}
          {view === 'charts' && <ChartsView />}
          {view === 'settings' && <SettingsView />}
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200">
          <div className="max-w-3xl mx-auto px-2 py-1.5 grid grid-cols-5 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition ${active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </AppContext.Provider>
  );
}
