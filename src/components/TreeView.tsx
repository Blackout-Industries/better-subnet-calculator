import {
  Subnet,
  NodePath,
  cidrStr,
  netmaskStr,
  rangeStr,
  usableHosts,
  usableRangeStr,
  MAX_PREFIX,
} from "../lib/subnet";
import { ColumnKey } from "./SubnetCells";

type Props = {
  root: Subnet;
  columns: ReadonlyArray<ColumnKey>;
  onDivide: (path: NodePath) => void;
  onJoin: (path: NodePath) => void;
  onNoteChange: (path: NodePath, note: string) => void;
};

export function TreeView({ root, columns, onDivide, onJoin, onNoteChange }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 font-mono text-sm">
      <Node
        node={root}
        path={[]}
        columns={columns}
        onDivide={onDivide}
        onJoin={onJoin}
        onNoteChange={onNoteChange}
        ancestorBars={[]}
        isLastChild={true}
        isRoot={true}
      />
    </div>
  );
}

type NodeProps = {
  node: Subnet;
  path: NodePath;
  columns: ReadonlyArray<ColumnKey>;
  onDivide: (path: NodePath) => void;
  onJoin: (path: NodePath) => void;
  onNoteChange: (path: NodePath, note: string) => void;
  ancestorBars: ReadonlyArray<boolean>;
  isLastChild: boolean;
  isRoot: boolean;
};

function Node({
  node,
  path,
  columns,
  onDivide,
  onJoin,
  onNoteChange,
  ancestorBars,
  isLastChild,
  isRoot,
}: NodeProps) {
  const hasChildren = !!node.children;
  const isLeaf = !hasChildren;

  return (
    <div>
      <div className="flex items-start gap-1 group">
        {!isRoot && (
          <span className="text-slate-400 dark:text-slate-600 select-none whitespace-pre tabular-nums leading-6">
            {ancestorBars.map((bar) => (bar ? "│  " : "   ")).join("")}
            {isLastChild ? "└─ " : "├─ "}
          </span>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-0.5 leading-6 flex-1">
          <span
            className={
              "font-semibold " +
              (hasChildren
                ? "text-slate-700 dark:text-slate-300"
                : "text-cyan-700 dark:text-cyan-300")
            }
          >
            {cidrStr(node)}
          </span>

          {columns.includes("netmask") && isLeaf && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              mask <span className="text-slate-600 dark:text-slate-300">{netmaskStr(node.prefix)}</span>
            </span>
          )}
          {columns.includes("range") && isLeaf && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {rangeStr(node.base, node.prefix)}
            </span>
          )}
          {columns.includes("usable") && isLeaf && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              usable <span className="text-slate-600 dark:text-slate-300">{usableRangeStr(node.base, node.prefix)}</span>
            </span>
          )}
          {columns.includes("hosts") && (
            <span className="chip">{usableHosts(node.prefix).toLocaleString()} hosts</span>
          )}

          <span className="ml-auto flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
            {isLeaf && node.prefix < MAX_PREFIX && (
              <button className="btn btn-accent" onClick={() => onDivide(path)} title={`Divide into two /${node.prefix + 1}`}>
                ÷ Divide
              </button>
            )}
            {hasChildren && (
              <button className="btn btn-warn" onClick={() => onJoin(path)} title="Join children">
                ⊕ Join
              </button>
            )}
          </span>

          {columns.includes("note") && isLeaf && (
            <input
              className="input w-full text-xs py-1 px-2 mt-1"
              placeholder="Add a note…"
              value={node.note ?? ""}
              onChange={(e) => onNoteChange(path, e.target.value)}
            />
          )}
        </div>
      </div>

      {hasChildren && (
        <div>
          <Node
            node={node.children![0]}
            path={[...path, 0]}
            columns={columns}
            onDivide={onDivide}
            onJoin={onJoin}
            onNoteChange={onNoteChange}
            ancestorBars={isRoot ? [] : [...ancestorBars, !isLastChild]}
            isLastChild={false}
            isRoot={false}
          />
          <Node
            node={node.children![1]}
            path={[...path, 1]}
            columns={columns}
            onDivide={onDivide}
            onJoin={onJoin}
            onNoteChange={onNoteChange}
            ancestorBars={isRoot ? [] : [...ancestorBars, !isLastChild]}
            isLastChild={true}
            isRoot={false}
          />
        </div>
      )}
    </div>
  );
}
