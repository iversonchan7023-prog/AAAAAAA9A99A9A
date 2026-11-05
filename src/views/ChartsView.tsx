import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '@/lib/appContext';

export default function ChartsView() {
  const { data } = useApp();

  const exerciseNames = useMemo(() => {
    const set = new Set<string>();
    data.history.forEach((h) => h.exercises.forEach((e) => set.add(e.name)));
    data.weekPlan.forEach((d) => d.exercises.forEach((e) => set.add(e.name)));
    return Array.from(set).sort();
  }, [data]);

  const [selected, setSelected] = useState(exerciseNames[0] ?? '');

  const chartData = useMemo(() => {
    const points: { date: string; weight: number; label: string }[] = [];
    data.history
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .forEach((h) => {
        const ex = h.exercises.find((e) => e.name === selected && e.completedSets > 0);
        if (ex) {
          const w = parseFloat(ex.weight);
          if (!Number.isNaN(w)) {
            points.push({ date: h.date, weight: w, label: h.date.slice(5) });
          }
        }
      });
    return points;
  }, [data, selected]);

  if (exerciseNames.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <TrendingUp size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <h2 className="text-lg font-bold text-slate-800 mb-1">重量趋势</h2>
        <p className="text-xs text-slate-400 mb-3">选择动作查看重量随时间的变化</p>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 ring-emerald-400"
        >
          {exerciseNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        {chartData.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            暂无「{selected}」的训练记录
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-slate-400">当前动作</p>
                <p className="font-bold text-slate-800">{selected}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">记录次数</p>
                <p className="font-bold text-emerald-600">{chartData.length}</p>
              </div>
            </div>
            <div className="h-64 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#0d9488" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="kg" />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                    labelStyle={{ color: '#64748b' }}
                    formatter={(v) => [`${v} kg`, '重量']}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="url(#weightGrad)"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
