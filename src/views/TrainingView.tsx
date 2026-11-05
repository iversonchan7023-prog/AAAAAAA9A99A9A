import { useEffect, useRef, useState } from 'react';
import {
  ChevronUp, ChevronDown, Pencil, Trash2, Plus, X, ImagePlus, Check, Save, Timer as TimerIcon, SkipForward, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useApp, fmtDuration } from '@/lib/appContext';
import type { Exercise } from '@/lib/types';
import { DAY_NAMES } from '@/lib/defaultData';
import { compressImage, genId } from '@/lib/image';

interface Props {
  elapsedSec: number;
  resetTimer: () => void;
}

export default function TrainingView({ elapsedSec, resetTimer }: Props) {
  const app = useApp();
  const { data } = app;
  const dayIdx = data.activeDayIndex;
  const day = data.weekPlan[dayIdx] ?? data.weekPlan[0];

  const [editingTheme, setEditingTheme] = useState(false);
  const [themeDraft, setThemeDraft] = useState(day?.theme ?? '');

  useEffect(() => {
    setThemeDraft(day?.theme ?? '');
  }, [dayIdx, day?.theme]);

  return (
    <div className="space-y-4">
      {/* Day tabs */}
      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max pb-1">
          {data.weekPlan.map((d) => {
            const active = d.dayIndex === dayIdx;
            return (
              <button
                key={d.dayIndex}
                onClick={() => app.setActiveDay(d.dayIndex)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${active ? 'bg-slate-800 text-white shadow' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {editingTheme ? (
              <div className="flex items-center gap-2">
                <input
                  value={themeDraft}
                  onChange={(e) => setThemeDraft(e.target.value)}
                  className="flex-1 text-base font-semibold bg-slate-50 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-emerald-400"
                  placeholder="训练主题"
                />
                <button
                  onClick={() => {
                    app.updateDayTheme(dayIdx, themeDraft.trim() || day.theme);
                    setEditingTheme(false);
                  }}
                  className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium"
                >
                  保存
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400">今日训练 · {DAY_NAMES[dayIdx]}</p>
                <h2 className="text-lg font-bold text-slate-800 truncate">{day?.theme || '休息日'}</h2>
              </>
            )}
          </div>
          {!editingTheme && (
            <button
              onClick={() => setEditingTheme(true)}
              className="text-xs text-slate-400 hover:text-emerald-600 px-2 py-1 rounded-lg hover:bg-slate-50"
            >
              编辑主题
            </button>
          )}
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        {day?.exercises.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
            今天是休息日，享受恢复时光吧
          </div>
        )}
        {day?.exercises.map((ex, i) => (
          <ExerciseCard key={ex.id} ex={ex} dayIdx={dayIdx} index={i} total={day.exercises.length} />
        ))}
      </div>

      {/* Add exercise */}
      <button
        onClick={() => {
          const newEx: Exercise = {
            id: genId('ex'),
            name: '新动作',
            sets: 3,
            reps: '10-12',
            weight: '20',
            unit: 'kg',
            images: [],
            completedSets: 0,
          };
          app.addExercise(dayIdx, newEx);
        }}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus size={18} /> 添加动作
      </button>

      {/* Save today training */}
      <button
        onClick={() => {
          app.saveTodayTraining(elapsedSec);
          resetTimer();
        }}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-700 transition active:scale-[0.98]"
      >
        <Save size={20} /> 完成并保存今日训练
      </button>

      <RestTimer />
    </div>
  );
}

function ExerciseCard({ ex, dayIdx, index, total }: { ex: Exercise; dayIdx: number; index: number; total: number }) {
  const app = useApp();
  const done = ex.completedSets >= ex.sets && ex.sets > 0;
  const [showEdit, setShowEdit] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  return (
    <>
      <div className={`bg-white rounded-2xl border p-4 transition ${done ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200'}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 truncate">{ex.name}</h3>
              {done && <Check size={16} className="text-emerald-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">{ex.sets} 组</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">{ex.reps} {ex.unit === 'min' ? '分钟' : '次'}</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded-md">{ex.weight}{ex.unit === 'min' ? '' : 'kg'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              disabled={index === 0}
              onClick={() => app.moveExercise(dayIdx, ex.id, -1)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center"
            >
              <ChevronUp size={16} />
            </button>
            <button
              disabled={index === total - 1}
              onClick={() => app.moveExercise(dayIdx, ex.id, 1)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center"
            >
              <ChevronDown size={16} />
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => app.deleteExercise(dayIdx, ex.id)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Images */}
        {ex.images.length > 0 && (
          <div className="-mx-4 px-4 overflow-x-auto no-scrollbar mb-3">
            <div className="flex gap-2 min-w-max">
              {ex.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setShowViewer(true)}
                  className="shrink-0 w-28 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
                >
                  <img src={img.url} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Set tracking */}
        <SetTracker ex={ex} dayIdx={dayIdx} />
      </div>

      {showEdit && <EditModal ex={ex} dayIdx={dayIdx} onClose={() => setShowEdit(false)} />}
      {showViewer && <ImageViewer images={ex.images} name={ex.name} onClose={() => setShowViewer(false)} />}
    </>
  );
}

let restTimerTrigger: ((seconds?: number) => void) | null = null;

function SetTracker({ ex, dayIdx }: { ex: Exercise; dayIdx: number }) {
  const app = useApp();
  const pct = ex.sets > 0 ? Math.min(100, (ex.completedSets / ex.sets) * 100) : 0;
  const done = ex.completedSets >= ex.sets && ex.sets > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-600">完成组数</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => app.setCompletedSets(dayIdx, ex.id, ex.completedSets - 1)}
            className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center text-lg font-bold"
          >
            −
          </button>
          <span className={`text-lg font-bold tabular-nums w-12 text-center ${done ? 'text-emerald-600' : 'text-slate-700'}`}>
            {ex.completedSets}/{ex.sets}
          </span>
          <button
            onClick={() => {
              const next = ex.completedSets + 1;
              app.setCompletedSets(dayIdx, ex.id, next);
              if (next < ex.sets) restTimerTrigger?.(60);
            }}
            className="w-9 h-9 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center text-lg font-bold shadow-sm"
          >
            +
          </button>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${done ? 'bg-emerald-500' : 'bg-emerald-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RestTimer() {
  const [active, setActive] = useState(false);
  const [remaining, setRemaining] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  restTimerTrigger = (seconds = 60) => {
    setRemaining(seconds);
    setActive(true);
  };

  useEffect(() => {
    if (!active) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setActive(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  if (!active) return null;

  const pct = Math.min(100, ((60 - remaining) / 60) * 100);

  return (
    <div className="fixed bottom-20 right-4 z-40 w-44 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 animate-slide-up">
      <div className="flex items-center gap-2 mb-2">
        <TimerIcon size={16} className="text-emerald-500" />
        <span className="text-xs font-semibold text-slate-600">组间休息</span>
        <span className="ml-auto font-mono text-base font-bold text-emerald-600 tabular-nums">{remaining}s</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setRemaining((r) => r + 15)}
          className="flex-1 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200"
        >
          +15秒
        </button>
        <button
          onClick={() => setActive(false)}
          className="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 flex items-center justify-center gap-1"
        >
          <SkipForward size={12} /> 跳过
        </button>
      </div>
    </div>
  );
}

function EditModal({ ex, dayIdx, onClose }: { ex: Exercise; dayIdx: number; onClose: () => void }) {
  const app = useApp();
  const [draft, setDraft] = useState<Exercise>({ ...ex });
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const compressed: string[] = [];
      for (const f of Array.from(files)) {
        compressed.push(await compressImage(f));
      }
      setDraft((d) => ({
        ...d,
        images: [...d.images, ...compressed.map((url) => ({ id: genId('img'), url }))],
      }));
    } catch (e) {
      console.warn('upload failed', e);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (id: string) => {
    setDraft((d) => ({ ...d, images: d.images.filter((i) => i.id !== id) }));
  };

  const save = () => {
    app.updateExercise(dayIdx, draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">编辑动作</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="动作名称">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="目标组数">
              <input type="number" value={draft.sets} onChange={(e) => setDraft({ ...draft, sets: Number(e.target.value) || 0 })} className="input" />
            </Field>
            <Field label="目标次数">
              <input value={draft.reps} onChange={(e) => setDraft({ ...draft, reps: e.target.value })} className="input" />
            </Field>
            <Field label="目标重量">
              <input value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: e.target.value })} className="input" />
            </Field>
            <Field label="单位">
              <select value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value as 'kg' | 'min' })} className="input">
                <option value="kg">kg</option>
                <option value="min">分钟</option>
              </select>
            </Field>
          </div>

          {/* Images */}
          <div>
            <p className="text-sm font-medium text-slate-600 mb-2">动作图解</p>
            <div className="flex gap-2 flex-wrap">
              {draft.images.map((img) => (
                <div key={img.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-0 right-0 bg-black/60 text-white w-5 h-5 rounded-bl-lg flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-400 hover:text-emerald-500 cursor-pointer text-[10px] gap-1">
                {uploading ? <span>处理中</span> : (<><ImagePlus size={18} /> 添加</>)}
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} disabled={uploading} />
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">图片自动压缩为 WebP 格式</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white px-5 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-medium">取消</button>
          <button onClick={save} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600">保存</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function ImageViewer({ images, name, onClose }: { images: { id: string; url: string }[]; name: string; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;
  const cur = images[idx];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm font-medium">{name} · {idx + 1}/{images.length}</span>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center relative" onClick={(e) => e.stopPropagation()}>
        <img src={cur.url} alt={name} className="max-w-full max-h-full object-contain" />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-3 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % images.length)}
              className="absolute right-3 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
