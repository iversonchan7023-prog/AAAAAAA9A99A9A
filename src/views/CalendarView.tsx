import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, Dumbbell } from 'lucide-react';
import { useApp, fmtDuration } from '@/lib/appContext';
import type { CheckinEntry } from '@/lib/types';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function CalendarView() {
  const { data } = useApp();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<CheckinEntry | null>(null);

  const checkinByDate = new Map<string, CheckinEntry>();
  data.history.forEach((h) => {
    const existing = checkinByDate.get(h.date);
    if (!existing || h.id > existing.id) checkinByDate.set(h.date, h);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = formatDate(new Date());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-bold text-slate-800">{year}年 {month + 1}月</h2>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[11px] font-medium text-slate-400 py-1">{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={i} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const entry = checkinByDate.get(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <button
                key={i}
                onClick={() => entry && setSelected(entry)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition ${
                  entry
                    ? 'bg-emerald-500 text-white font-bold shadow-sm hover:bg-emerald-600'
                    : isToday
                      ? 'bg-slate-200 text-slate-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-sm">{d}</span>
                {entry && <span className="w-1 h-1 rounded-full bg-white/80 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
        <p className="text-sm text-slate-500">
          本月已打卡 <span className="font-bold text-emerald-600">{Array.from(checkinByDate.values()).filter((h) => h.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length}</span> 天
        </p>
      </div>

      {selected && <DetailSheet entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DetailSheet({ entry, onClose }: { entry: CheckinEntry; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">{entry.date}</h3>
            <p className="text-xs text-slate-400">{entry.dayLabel} · {entry.theme}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
            <Clock size={18} className="text-emerald-500" />
            <span className="text-sm text-slate-600">总耗时</span>
            <span className="ml-auto font-mono font-bold text-slate-800">{fmtDuration(entry.durationSec)}</span>
          </div>
          <div className="space-y-2">
            {entry.exercises.map((e, i) => {
              const done = e.completedSets >= e.sets && e.sets > 0;
              return (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <Dumbbell size={16} className={done ? 'text-emerald-500' : 'text-slate-400'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{e.name}</p>
                    <p className="text-[11px] text-slate-400">{e.reps}{e.unit === 'min' ? '分钟' : '次'} · {e.weight}{e.unit === 'min' ? '' : 'kg'}</p>
                  </div>
                  <span className={`text-sm font-bold ${done ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {e.completedSets}/{e.sets}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
