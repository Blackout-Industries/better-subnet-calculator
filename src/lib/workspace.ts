import { Subnet, parseCidr, MAX_PREFIX } from "./subnet";

export type CalculatorTab = {
  id: string;
  name: string;
  root: Subnet;
};

export type Workspace = {
  version: 1;
  tabs: CalculatorTab[];
  activeTabId: string;
};

export const WORKSPACE_VERSION = 1;
const LS_WORKSPACE = "subnet-workspace-v1";

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function makeTab(name: string, cidr: string): CalculatorTab {
  const { base, prefix } = parseCidr(cidr);
  return { id: newId(), name, root: { base, prefix } };
}

export function newWorkspace(): Workspace {
  const tab = makeTab("Default", "10.0.0.0/24");
  return { version: WORKSPACE_VERSION, tabs: [tab], activeTabId: tab.id };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function validateSubnet(v: unknown): v is Subnet {
  if (!isObject(v)) return false;
  if (typeof v.base !== "number" || !Number.isInteger(v.base)) return false;
  if (v.base < 0 || v.base > 0xffffffff) return false;
  if (typeof v.prefix !== "number" || !Number.isInteger(v.prefix)) return false;
  if (v.prefix < 0 || v.prefix > MAX_PREFIX) return false;
  if (v.note !== undefined && typeof v.note !== "string") return false;
  if (v.children !== undefined) {
    if (!Array.isArray(v.children) || v.children.length !== 2) return false;
    if (!validateSubnet(v.children[0]) || !validateSubnet(v.children[1])) return false;
  }
  return true;
}

function validateTab(v: unknown): v is CalculatorTab {
  if (!isObject(v)) return false;
  if (typeof v.id !== "string" || !v.id) return false;
  if (typeof v.name !== "string") return false;
  return validateSubnet(v.root);
}

function validateWorkspace(v: unknown): v is Workspace {
  if (!isObject(v)) return false;
  if (v.version !== WORKSPACE_VERSION) return false;
  if (!Array.isArray(v.tabs) || v.tabs.length === 0) return false;
  if (!v.tabs.every(validateTab)) return false;
  if (typeof v.activeTabId !== "string") return false;
  if (!v.tabs.some((t) => (t as CalculatorTab).id === v.activeTabId)) return false;
  return true;
}

export function loadWorkspace(): Workspace {
  try {
    const raw = localStorage.getItem(LS_WORKSPACE);
    if (!raw) return newWorkspace();
    const parsed = JSON.parse(raw);
    if (validateWorkspace(parsed)) return parsed;
  } catch {
    // ignore
  }
  return newWorkspace();
}

export function saveWorkspace(ws: Workspace): void {
  try {
    localStorage.setItem(LS_WORKSPACE, JSON.stringify(ws));
  } catch {
    // ignore
  }
}

export type ExportEnvelope = {
  version: 1;
  exportedAt: string;
  workspace: Workspace;
};

export function exportToJson(ws: Workspace): string {
  const env: ExportEnvelope = {
    version: WORKSPACE_VERSION,
    exportedAt: new Date().toISOString(),
    workspace: ws,
  };
  return JSON.stringify(env, null, 2);
}

export function importFromJson(text: string): Workspace {
  const parsed = JSON.parse(text);
  if (validateWorkspace(parsed)) return parsed;
  if (isObject(parsed) && parsed.version === WORKSPACE_VERSION && validateWorkspace(parsed.workspace)) {
    return parsed.workspace;
  }
  throw new Error("File is not a valid subnet-calculator export");
}

export function downloadJson(filename: string, json: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

export function addTab(ws: Workspace, cidr = "10.0.0.0/24"): Workspace {
  const name = `Subnet ${ws.tabs.length + 1}`;
  const tab = makeTab(name, cidr);
  return { ...ws, tabs: [...ws.tabs, tab], activeTabId: tab.id };
}

export function closeTab(ws: Workspace, id: string): Workspace {
  const idx = ws.tabs.findIndex((t) => t.id === id);
  if (idx < 0) return ws;
  const remaining = ws.tabs.filter((t) => t.id !== id);
  if (remaining.length === 0) {
    const fresh = makeTab("Default", "10.0.0.0/24");
    return { ...ws, tabs: [fresh], activeTabId: fresh.id };
  }
  const newActive =
    ws.activeTabId === id
      ? remaining[Math.min(idx, remaining.length - 1)].id
      : ws.activeTabId;
  return { ...ws, tabs: remaining, activeTabId: newActive };
}

export function renameTab(ws: Workspace, id: string, name: string): Workspace {
  return {
    ...ws,
    tabs: ws.tabs.map((t) => (t.id === id ? { ...t, name } : t)),
  };
}

export function setActive(ws: Workspace, id: string): Workspace {
  if (!ws.tabs.some((t) => t.id === id)) return ws;
  return { ...ws, activeTabId: id };
}

export function updateActiveRoot(ws: Workspace, fn: (s: Subnet) => Subnet): Workspace {
  return {
    ...ws,
    tabs: ws.tabs.map((t) =>
      t.id === ws.activeTabId ? { ...t, root: fn(t.root) } : t,
    ),
  };
}

export function getActive(ws: Workspace): CalculatorTab {
  return ws.tabs.find((t) => t.id === ws.activeTabId) ?? ws.tabs[0];
}
