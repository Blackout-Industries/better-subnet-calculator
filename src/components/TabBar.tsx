import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { CalculatorTab } from "../lib/workspace";
import { leafCount } from "../lib/subnet";

type Props = {
  tabs: ReadonlyArray<CalculatorTab>;
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  onRename: (id: string, name: string) => void;
};

export function TabBar({ tabs, activeId, onSelect, onAdd, onClose, onRename }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  const startEdit = (t: CalculatorTab) => {
    setEditingId(t.id);
    setDraftName(t.name);
  };

  const commitEdit = () => {
    if (editingId !== null) {
      const trimmed = draftName.trim();
      if (trimmed) onRename(editingId, trimmed);
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 -mb-px">
      {tabs.map((t) => {
        const isActive = t.id === activeId;
        const isEditing = editingId === t.id;
        return (
          <div
            key={t.id}
            className={
              "group flex items-center gap-1.5 rounded-t-md px-3 py-1.5 text-xs cursor-pointer border " +
              (isActive
                ? "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 border-b-transparent text-cyan-700 dark:text-cyan-300 font-medium"
                : "bg-slate-100/70 dark:bg-slate-900/70 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/70")
            }
            onClick={() => !isEditing && onSelect(t.id)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              startEdit(t);
            }}
            title="Double-click to rename"
          >
            {isEditing ? (
              <TabRenameInput
                initial={draftName}
                onChange={setDraftName}
                onCommit={commitEdit}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <span className="truncate max-w-[16rem]">{t.name}</span>
                <span className="chip text-[10px] py-0">{leafCount(t.root)}</span>
                {tabs.length > 1 && (
                  <button
                    className="ml-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/50 px-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Close tab "${t.name}"?`)) onClose(t.id);
                    }}
                    title="Close tab"
                    aria-label={`Close ${t.name}`}
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="rounded-t-md px-2.5 py-1.5 text-xs text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors"
        title="New tab"
      >
        + New
      </button>
    </div>
  );
}

function TabRenameInput({
  initial,
  onChange,
  onCommit,
  onCancel,
}: {
  initial: string;
  onChange: (s: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.select();
  }, []);
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onCommit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };
  return (
    <input
      ref={ref}
      defaultValue={initial}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onCommit}
      onKeyDown={onKey}
      onClick={(e) => e.stopPropagation()}
      className="bg-transparent border-b border-cyan-500 outline-none px-0.5 w-32 text-xs"
    />
  );
}
