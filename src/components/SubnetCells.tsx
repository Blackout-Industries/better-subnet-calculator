export type ColumnKey = "address" | "netmask" | "range" | "usable" | "hosts" | "note";

export const ALL_COLUMNS: ColumnKey[] = ["address", "netmask", "range", "usable", "hosts", "note"];

export const COLUMN_LABELS: Record<ColumnKey, string> = {
  address: "Subnet",
  netmask: "Netmask",
  range: "Range of addresses",
  usable: "Usable IPs",
  hosts: "Hosts",
  note: "Note",
};
