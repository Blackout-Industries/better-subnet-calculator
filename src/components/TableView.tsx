import {
  Subnet,
  NodePath,
  leafCount,
  cidrStr,
  netmaskStr,
  rangeStr,
  usableHosts,
  usableRangeStr,
  MAX_PREFIX,
} from "../lib/subnet";
import { ColumnKey, COLUMN_LABELS } from "./SubnetCells";

type Row = {
  leaf: Subnet;
  leafPath: NodePath;
  ancestorsStartingHere: Array<{ node: Subnet; path: NodePath; leafCount: number; depth: number }>;
};

function buildRows(root: Subnet): Row[] {
  const rows: Row[] = [];
  const dfs = (
    node: Subnet,
    path: NodePath,
    pendingAncestors: Row["ancestorsStartingHere"],
  ) => {
    if (!node.children) {
      rows.push({ leaf: node, leafPath: path, ancestorsStartingHere: pendingAncestors });
      return;
    }
    const ancHere = {
      node,
      path,
      leafCount: leafCount(node),
      depth: path.length,
    };
    dfs(node.children[0], [...path, 0], [...pendingAncestors, ancHere]);
    dfs(node.children[1], [...path, 1], []);
  };
  dfs(root, [], []);
  return rows;
}

type Props = {
  root: Subnet;
  columns: ReadonlyArray<ColumnKey>;
  onDivide: (path: NodePath) => void;
  onJoin: (path: NodePath) => void;
  onNoteChange: (path: NodePath, note: string) => void;
};

export function TableView({ root, columns, onDivide, onJoin, onNoteChange }: Props) {
  const rows = buildRows(root);
  const maxAncestorDepth = Math.max(0, ...rows.flatMap((r) => r.ancestorsStartingHere.map((a) => a.depth + 1)));

  const leafCols = columns.filter((c) => c !== "address");

  const ancestorBg = (depth: number) => {
    const bgs = [
      "bg-slate-50 dark:bg-slate-900/60",
      "bg-cyan-50/60 dark:bg-cyan-950/30",
      "bg-violet-50/60 dark:bg-violet-950/30",
      "bg-amber-50/60 dark:bg-amber-950/30",
      "bg-emerald-50/60 dark:bg-emerald-950/30",
      "bg-rose-50/60 dark:bg-rose-950/30",
    ];
    return bgs[depth % bgs.length];
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full text-sm border-collapse">
        <thead className="bg-slate-100/70 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wide">
          <tr>
            <th
              colSpan={maxAncestorDepth + 1}
              className="text-left px-3 py-2 font-medium border-b border-slate-200 dark:border-slate-800"
            >
              Subnet
            </th>
            {leafCols.map((c) => (
              <th
                key={c}
                className="text-left px-3 py-2 font-medium border-b border-slate-200 dark:border-slate-800"
              >
                {COLUMN_LABELS[c]}
              </th>
            ))}
            <th className="text-right px-3 py-2 font-medium border-b border-slate-200 dark:border-slate-800">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.leafPath.join(",") + ":" + cidrStr(row.leaf)}
              className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50/40 dark:hover:bg-slate-900/40"
            >
              {row.ancestorsStartingHere.map((anc) => (
                <td
                  key={anc.path.join(",")}
                  rowSpan={anc.leafCount}
                  className={
                    "align-top px-3 py-2 border-r border-slate-200 dark:border-slate-800 font-mono whitespace-nowrap " +
                    ancestorBg(anc.depth)
                  }
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{cidrStr(anc.node)}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        className="btn btn-warn text-[11px] py-0.5"
                        onClick={() => onJoin(anc.path)}
                        title={`Join children back into ${cidrStr(anc.node)}`}
                      >
                        ⊕ Join
                      </button>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {anc.leafCount} subnets
                      </span>
                    </div>
                  </div>
                </td>
              ))}

              <td
                className="align-top px-3 py-2 font-mono whitespace-nowrap border-r border-slate-200 dark:border-slate-800"
              >
                <span className="font-semibold text-cyan-700 dark:text-cyan-300">
                  {cidrStr(row.leaf)}
                </span>
              </td>

              {/* Pad shallower rows so data columns line up with their headers. */}
              {Array.from({ length: maxAncestorDepth - row.leafPath.length }).map((_, idx) => (
                <td
                  key={`pad-${idx}`}
                  className="border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30"
                />
              ))}

              {leafCols.map((c) => (
                <td key={c} className="align-top px-3 py-2 border-r border-slate-200 dark:border-slate-800">
                  {c === "netmask" && (
                    <span className="font-mono text-slate-600 dark:text-slate-400">{netmaskStr(row.leaf.prefix)}</span>
                  )}
                  {c === "range" && (
                    <span className="font-mono text-slate-600 dark:text-slate-400">{rangeStr(row.leaf.base, row.leaf.prefix)}</span>
                  )}
                  {c === "usable" && (
                    <span className="font-mono text-slate-600 dark:text-slate-400">{usableRangeStr(row.leaf.base, row.leaf.prefix)}</span>
                  )}
                  {c === "hosts" && (
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {usableHosts(row.leaf.prefix).toLocaleString()}
                    </span>
                  )}
                  {c === "note" && (
                    <input
                      className="input w-full text-xs py-1 px-2"
                      placeholder="Note…"
                      value={row.leaf.note ?? ""}
                      onChange={(e) => onNoteChange(row.leafPath, e.target.value)}
                    />
                  )}
                </td>
              ))}

              <td className="align-top px-3 py-2 text-right">
                {row.leaf.prefix < MAX_PREFIX && (
                  <button
                    className="btn btn-accent"
                    onClick={() => onDivide(row.leafPath)}
                    title={`Divide into two /${row.leaf.prefix + 1}`}
                  >
                    ÷ Divide
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

