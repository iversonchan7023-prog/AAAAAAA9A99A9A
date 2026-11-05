import { Trash2, Clock, Calendar as CalIcon } from 'lucide-react';
import { useApp, fmtDuration, summaryText } from '@/lib/appContext';

export default function HistoryView() {
  const { data, deleteHistory, clearHistory } = useApp();

  if (data.history.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <CalIcon size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">还没有训练记录</p>
        <p className="text-xs mt-1">完成一次训练后会显示在这里</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">训练历史</h2>
        <button
          onClick={() => {
            if (confirm('确定清空全部历史记录吗？此操作不可恢复。')) clearHistory();
          }}
          className="text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          清空全部
        </button>
      </div>

      {data.history.map((entry) => (
        <div key={entry.id} className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-slate-800">{entry.date}</span>
                <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{entry.dayLabel}</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{entry.theme}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <Clock size={13} />
                <span className="font-mono">{fmtDuration(entry.durationSec)}</span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">{summaryText(entry)}</p>
            </div>
            <button
              onClick={() => {
                if (confirm('删除这条记录？')) deleteHistory(entry.id);
              }}
              className="w-8 h-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center shrink-0"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
