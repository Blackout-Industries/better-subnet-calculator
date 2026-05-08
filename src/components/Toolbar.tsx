import { ColumnKey, COLUMN_LABELS, ALL_COLUMNS } from "./SubnetCells";

export type ViewMode = "table" | "tree";

type Props = {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  columns: ReadonlyArray<ColumnKey>;
  onColumnsChange: (cols: ReadonlyArray<ColumnKey>) => void;
  isDark: boolean;
  onThemeToggle: () => void;
  onReset: () => void;
  onCopyLink: () => void;
  copied: boolean;
  onExport: () => void;
  onImport: () => void;
  onNewWorkspace: () => void;
};

export function Toolbar({
  view,
  onViewChange,
  columns,
  onColumnsChange,
  isDark,
  onThemeToggle,
  onReset,
  onCopyLink,
  copied,
  onExport,
  onImport,
  onNewWorkspace,
}: Props) {
  const toggleCol = (c: ColumnKey) => {
    if (columns.includes(c)) {
      onColumnsChange(columns.filter((x) => x !== c));
    } else {
      const set = new Set([...columns, c]);
      onColumnsChange(ALL_COLUMNS.filter((x) => set.has(x)));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="inline-flex rounded-md border border-slate-300 dark:border-slate-700 overflow-hidden text-xs">
        <button
          onClick={() => onViewChange("table")}
          className={
            "px-3 py-1.5 transition-colors " +
            (view === "table"
              ? "bg-cyan-600 text-white"
              : "bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300")
          }
        >
          Table
        </button>
        <button
          onClick={() => onViewChange("tree")}
          className={
            "px-3 py-1.5 transition-colors " +
            (view === "tree"
              ? "bg-cyan-600 text-white"
              : "bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-300")
          }
        >
          Tree
        </button>
      </div>

      {view === "table" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Columns
          </span>
          {ALL_COLUMNS.filter((c) => c !== "address").map((c) => (
            <label key={c} className="inline-flex items-center gap-1 text-xs cursor-pointer">
              <input
                type="checkbox"
                className="accent-cyan-600"
                checked={columns.includes(c)}
                onChange={() => toggleCol(c)}
              />
              <span className="text-slate-700 dark:text-slate-300">{COLUMN_LABELS[c]}</span>
            </label>
          ))}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button onClick={onImport} className="btn" title="Import a workspace from JSON">
          ⬆ Import
        </button>
        <button onClick={onExport} className="btn" title="Export all tabs to JSON">
          ⬇ Export
        </button>
        <button onClick={onCopyLink} className="btn" title="Copy a shareable link encoding the active tab">
          {copied ? "✓ Copied" : "🔗 Link"}
        </button>
        <button onClick={onReset} className="btn" title="Reset active tab to a single root subnet">
          ↺ Reset
        </button>
        <button onClick={onNewWorkspace} className="btn" title="Discard all tabs and start fresh">
          ✕ Clear
        </button>
        <button onClick={onThemeToggle} className="btn" title="Toggle theme">
          {isDark ? "☀ Light" : "☾ Dark"}
        </button>
      </div>
    </div>
  );
}
