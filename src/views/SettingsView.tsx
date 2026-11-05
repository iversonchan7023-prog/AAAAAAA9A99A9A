import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { KeyRound, QrCode, Download, Upload, RefreshCw, Cloud, Check } from 'lucide-react';
import { useApp } from '@/lib/appContext';
import { generateSyncKey } from '@/lib/defaultData';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import type { AppData } from '@/lib/types';

export default function SettingsView() {
  const { data, setSyncKey, importData, triggerSync, syncStatus } = useApp();
  const [keyDraft, setKeyDraft] = useState(data.syncKey);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const pairUrl = data.syncKey
    ? `${window.location.origin}${window.location.pathname}?syncKey=${encodeURIComponent(data.syncKey)}`
    : '';

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fittrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as AppData;
        if (!parsed.weekPlan || !Array.isArray(parsed.weekPlan)) throw new Error('invalid');
        importData(parsed);
        setImportMsg('导入成功');
      } catch {
        setImportMsg('导入失败：文件格式不正确');
      }
      setTimeout(() => setImportMsg(''), 3000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Sync key */}
      <Section icon={<KeyRound size={18} />} title="专属同步口令">
        <p className="text-xs text-slate-500 mb-3">
          在所有设备上使用同一口令即可同步你的训练数据。无需注册账号。
        </p>
        <div className="flex gap-2">
          <input
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono text-slate-700 outline-none focus:ring-2 ring-emerald-400"
            placeholder="输入或生成同步口令"
          />
          <button
            onClick={() => {
              const k = generateSyncKey();
              setKeyDraft(k);
              setSyncKey(k);
            }}
            className="px-3 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 flex items-center gap-1.5"
          >
            <RefreshCw size={14} /> 生成
          </button>
        </div>
        <button
          onClick={() => setSyncKey(keyDraft.trim())}
          className="mt-2 w-full py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600"
        >
          保存并连接
        </button>

        <div className="mt-3 flex items-center gap-2 text-xs">
          {isSupabaseConfigured ? (
            <>
              <Cloud size={14} className="text-emerald-500" />
              <span className="text-slate-500">云端同步已启用</span>
              <button onClick={triggerSync} className="ml-auto text-emerald-600 font-medium flex items-center gap-1">
                {syncStatus === 'syncing' ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                立即同步
              </button>
            </>
          ) : (
            <span className="text-amber-600">云端未配置，数据仅保存在本地</span>
          )}
        </div>
      </Section>

      {/* QR pair */}
      <Section icon={<QrCode size={18} />} title="手机扫码同步">
        <p className="text-xs text-slate-500 mb-3">
          用手机相机扫描下方二维码，打开后自动绑定当前口令并开始同步。
        </p>
        {pairUrl ? (
          <div className="flex flex-col items-center">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              <QRCodeSVG value={pairUrl} size={180} level="M" includeMargin={false} />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 break-all max-w-xs text-center">{pairUrl}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">请先设置同步口令</p>
        )}
      </Section>

      {/* Backup */}
      <Section icon={<Download size={18} />} title="数据备份与恢复">
        <p className="text-xs text-slate-500 mb-3">
          导出全部数据为 JSON 文件备份，或从备份文件恢复。
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="py-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 flex items-center justify-center gap-2"
          >
            <Download size={16} /> 导出 JSON
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="py-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 flex items-center justify-center gap-2"
          >
            <Upload size={16} /> 导入 JSON
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = '';
          }}
        />
        {importMsg && <p className="text-xs text-center mt-2 text-slate-600">{importMsg}</p>}
      </Section>

      <p className="text-center text-[11px] text-slate-400 pt-2">FitTrack · 私人训练打卡 v1.0</p>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-emerald-500">{icon}</span>
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}
