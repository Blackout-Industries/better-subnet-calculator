import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NodePath,
  parseCidr,
  divide,
  join,
  updateNode,
  cidrStr,
  leafCount,
  totalAddresses,
} from "./lib/subnet";
import { encodeHash, decodeHash } from "./lib/urlState";
import {
  Workspace,
  loadWorkspace,
  saveWorkspace,
  getActive,
  updateActiveRoot,
  addTab,
  closeTab,
  renameTab,
  setActive,
  exportToJson,
  importFromJson,
  downloadJson,
  newWorkspace,
} from "./lib/workspace";
import { InputBar } from "./components/InputBar";
import { Toolbar, ViewMode } from "./components/Toolbar";
import { TableView } from "./components/TableView";
import { TreeView } from "./components/TreeView";
import { TabBar } from "./components/TabBar";
import { ColumnKey, ALL_COLUMNS } from "./components/SubnetCells";

const LS_THEME = "theme";
const LS_VIEW = "view";
const LS_COLS = "columns";

function loadView(): ViewMode {
  const v = localStorage.getItem(LS_VIEW);
  return v === "tree" ? "tree" : "table";
}

function loadColumns(): ReadonlyArray<ColumnKey> {
  try {
    const raw = localStorage.getItem(LS_COLS);
    if (!raw) return ["netmask", "range", "usable", "hosts"];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return parsed.filter((x): x is ColumnKey => ALL_COLUMNS.includes(x));
  } catch {
    // ignore
  }
  return ["netmask", "range", "usable", "hosts"];
}

function loadTheme(): boolean {
  const t = localStorage.getItem(LS_THEME);
  if (t === "light") return false;
  if (t === "dark") return true;
  return true;
}

function loadInitialWorkspace(): Workspace {
  const ws = loadWorkspace();
  const fromHash = decodeHash(window.location.hash);
  if (fromHash) {
    return updateActiveRoot(ws, () => fromHash);
  }
  return ws;
}

export default function App() {
  const [ws, setWs] = useState<Workspace>(loadInitialWorkspace);
  const [view, setView] = useState<ViewMode>(loadView);
  const [columns, setColumns] = useState<ReadonlyArray<ColumnKey>>(loadColumns);
  const [isDark, setIsDark] = useState<boolean>(loadTheme);
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTab = getActive(ws);
  const root = activeTab.root;

  const [input, setInput] = useState<string>(() => cidrStr(activeTab.root));

  useEffect(() => {
    setInput(cidrStr(activeTab.root));
  }, [activeTab.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(LS_THEME, isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem(LS_VIEW, view);
  }, [view]);
  useEffect(() => {
    localStorage.setItem(LS_COLS, JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    saveWorkspace(ws);
  }, [ws]);

  useEffect(() => {
    const newHash = "#" + encodeHash(root);
    if (window.location.hash !== newHash) {
      history.replaceState(null, "", newHash);
    }
  }, [root]);

  useEffect(() => {
    const onHashChange = () => {
      const r = decodeHash(window.location.hash);
      if (r) {
        setWs((w) => updateActiveRoot(w, () => r));
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleSubmit = useCallback((value: string) => {
    const { base, prefix } = parseCidr(value);
    setWs((w) => updateActiveRoot(w, () => ({ base, prefix })));
    setInput(value);
  }, []);

  const handleDivide = useCallback((path: NodePath) => {
    setWs((w) => updateActiveRoot(w, (r) => updateNode(r, path, divide)));
  }, []);

  const handleJoin = useCallback((path: NodePath) => {
    setWs((w) => updateActiveRoot(w, (r) => updateNode(r, path, join)));
  }, []);

  const handleNoteChange = useCallback((path: NodePath, note: string) => {
    setWs((w) =>
      updateActiveRoot(w, (r) =>
        updateNode(r, path, (s) => ({ ...s, note: note || undefined })),
      ),
    );
  }, []);

  const handleReset = useCallback(() => {
    if (!confirm(`Reset "${activeTab.name}" back to a single root subnet?`)) return;
    const { base, prefix } = parseCidr(input || cidrStr(activeTab.root));
    setWs((w) => updateActiveRoot(w, () => ({ base, prefix })));
  }, [input, activeTab]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", window.location.href);
    }
  }, []);

  const handleAddTab = useCallback(() => {
    setWs((w) => addTab(w));
  }, []);

  const handleCloseTab = useCallback((id: string) => {
    setWs((w) => closeTab(w, id));
  }, []);

  const handleRenameTab = useCallback((id: string, name: string) => {
    setWs((w) => renameTab(w, id, name));
  }, []);

  const handleSelectTab = useCallback((id: string) => {
    setWs((w) => setActive(w, id));
  }, []);

  const handleExport = useCallback(() => {
    const json = exportToJson(ws);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadJson(`subnet-calculator-${ts}.json`, json);
  }, [ws]);

  const handleImportClick = useCallback(() => {
    setImportError(null);
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const imported = importFromJson(text);
      if (
        ws.tabs.length > 1 &&
        !confirm(
          `Replace your current ${ws.tabs.length} tab(s) with ${imported.tabs.length} imported tab(s)?`,
        )
      ) {
        return;
      }
      setWs(imported);
      setImportError(null);
    } catch (err) {
      setImportError((err as Error).message);
    }
  }, [ws.tabs.length]);

  const handleNewWorkspace = useCallback(() => {
    if (!confirm("Discard all tabs and start fresh?")) return;
    setWs(newWorkspace());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "t") setView((v) => (v === "table" ? "tree" : "table"));
      if (e.key === "d") setIsDark((v) => !v);
      if ((e.ctrlKey || e.metaKey) && /^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        if (idx < ws.tabs.length) {
          e.preventDefault();
          setWs((w) => setActive(w, w.tabs[idx].id));
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ws.tabs.length]);

  const stats = useMemo(() => {
    const lc = leafCount(root);
    const total = totalAddresses(root.prefix);
    return { leaves: lc, total };
  }, [root]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 pt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                <span className="text-cyan-600 dark:text-cyan-400">⌘</span> Subnet Calculator
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualize, divide, and join IPv4 subnets — self-hosted, fully client-side.
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="chip">{stats.leaves} leaf{stats.leaves === 1 ? "" : "s"}</span>
                <span className="chip">{ws.tabs.length} tab{ws.tabs.length === 1 ? "" : "s"}</span>
              </div>
              <div className="mt-1 font-mono">{stats.total.toLocaleString()} addresses</div>
            </div>
          </div>

          <InputBar key={activeTab.id} initialValue={input} onSubmit={handleSubmit} />

          <Toolbar
            view={view}
            onViewChange={setView}
            columns={columns}
            onColumnsChange={setColumns}
            isDark={isDark}
            onThemeToggle={() => setIsDark((v) => !v)}
            onReset={handleReset}
            onCopyLink={handleCopyLink}
            copied={copied}
            onExport={handleExport}
            onImport={handleImportClick}
            onNewWorkspace={handleNewWorkspace}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportFile}
          />

          {importError && (
            <div className="rounded-md border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
              Import failed: {importError}
            </div>
          )}

          <TabBar
            tabs={ws.tabs}
            activeId={ws.activeTabId}
            onSelect={handleSelectTab}
            onAdd={handleAddTab}
            onClose={handleCloseTab}
            onRename={handleRenameTab}
          />
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {view === "table" ? (
          <TableView
            key={activeTab.id}
            root={root}
            columns={columns}
            onDivide={handleDivide}
            onJoin={handleJoin}
            onNoteChange={handleNoteChange}
          />
        ) : (
          <TreeView
            key={activeTab.id}
            root={root}
            columns={columns}
            onDivide={handleDivide}
            onJoin={handleJoin}
            onNoteChange={handleNoteChange}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-3 px-6 text-center text-[11px] text-slate-500 dark:text-slate-500">
        <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">t</kbd> view ·{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">d</kbd> theme ·{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">⌘1-9</kbd> switch tab ·
        Double-click a tab to rename · Workspace saved locally
      </footer>
    </div>
  );
}
