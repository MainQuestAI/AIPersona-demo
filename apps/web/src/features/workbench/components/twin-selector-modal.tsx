import { Check, Loader2, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  listTwinVersions,
  type TwinVersionRecord,
} from '@/app/services/studyRuntime';

function PersonaAvatar({ name }: { name: string }) {
  const hue = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
  const initial = name.replace(/[·]/g, '').slice(-1) || '?';
  return (
    <div
      className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
      style={{ backgroundColor: `hsl(${hue}, 55%, 45%)` }}
    >
      {initial}
    </div>
  );
}

export function TwinSelectorModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (twinVersionIds: string[]) => void;
}) {
  const [versions, setVersions] = useState<TwinVersionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    void listTwinVersions().then((data) => {
      if (!active) return;
      setVersions(data);
      // Select all by default
      setSelected(new Set(data.map((v) => v.id)));
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [open]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return versions;
    const q = searchQuery.toLowerCase();
    return versions.filter((v) => {
      const name = String(v.persona_profile_snapshot_json?.name ?? '').toLowerCase();
      const audience = String(v.target_audience_label ?? '').toLowerCase();
      return name.includes(q) || audience.includes(q);
    });
  }, [versions, searchQuery]);

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(filtered.map((v) => v.id)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-panel border border-line bg-panel shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <div className="eyebrow text-accent">选择消费者孪生</div>
            <p className="mt-0.5 text-[0.65rem] text-muted">选择参与本次研究的 Persona</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search + Bulk actions */}
        <div className="flex items-center gap-2 border-b border-line px-5 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索..."
              className="w-full rounded-btn border border-line bg-panel pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-tertiary focus:border-accent/50 focus:outline-none"
            />
          </div>
          <button type="button" onClick={selectAll} className="text-[0.6rem] text-accent hover:underline">
            全选
          </button>
          <button type="button" onClick={deselectAll} className="text-[0.6rem] text-muted hover:underline">
            清空
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">无匹配的 Persona</p>
          ) : (
            filtered.map((v) => {
              const name = String(v.persona_profile_snapshot_json?.name ?? v.target_audience_label ?? v.id);
              const audience = String(v.target_audience_label ?? '');
              const isSelected = selected.has(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => toggleItem(v.id)}
                  className={`flex w-full items-center gap-3 rounded-btn px-3 py-2.5 text-left transition ${
                    isSelected ? 'bg-accent/10 border border-accent/30' : 'border border-transparent hover:bg-surfaceElevated'
                  }`}
                >
                  <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                    isSelected ? 'bg-accent border-accent text-white' : 'border-line'
                  }`}>
                    {isSelected ? <Check className="h-3 w-3" /> : null}
                  </div>
                  <PersonaAvatar name={name} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text truncate">{name}</div>
                    <div className="text-[0.6rem] text-muted">{audience}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-line px-5 py-4">
          <span className="text-[0.65rem] text-muted">
            已选 {selected.size} / {versions.length} 个
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button
              type="button"
              onClick={() => onConfirm([...selected])}
              disabled={selected.size === 0}
              className="btn-accent"
            >
              确认并创建研究
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
