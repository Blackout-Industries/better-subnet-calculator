export type Subnet = {
  base: number;
  prefix: number;
  note?: string;
  children?: [Subnet, Subnet];
};

export const MAX_PREFIX = 32;

export function ipToInt(ip: string): number {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) throw new Error(`Invalid IPv4 address: ${ip}`);
  let n = 0;
  for (const p of parts) {
    if (!/^\d+$/.test(p)) throw new Error(`Invalid IPv4 address: ${ip}`);
    const o = Number(p);
    if (o < 0 || o > 255) throw new Error(`Invalid IPv4 address: ${ip}`);
    n = (n * 256 + o) >>> 0;
  }
  return n >>> 0;
}

export function intToIp(n: number): string {
  const u = n >>> 0;
  return [(u >>> 24) & 0xff, (u >>> 16) & 0xff, (u >>> 8) & 0xff, u & 0xff].join(".");
}

export function netmaskInt(prefix: number): number {
  if (prefix < 0 || prefix > 32) throw new Error(`Invalid prefix: ${prefix}`);
  if (prefix === 0) return 0;
  return ((0xffffffff << (32 - prefix)) >>> 0);
}

export function netmaskStr(prefix: number): string {
  return intToIp(netmaskInt(prefix));
}

export function wildcardStr(prefix: number): string {
  return intToIp((~netmaskInt(prefix)) >>> 0);
}

export function networkAddress(base: number, prefix: number): number {
  return (base & netmaskInt(prefix)) >>> 0;
}

export function broadcastAddress(base: number, prefix: number): number {
  return (networkAddress(base, prefix) | (~netmaskInt(prefix) >>> 0)) >>> 0;
}

export function totalAddresses(prefix: number): number {
  return 2 ** (32 - prefix);
}

// RFC 3021: /31 point-to-point links count both addresses as usable.
export function usableHosts(prefix: number): number {
  if (prefix === 32) return 1;
  if (prefix === 31) return 2;
  return Math.max(0, 2 ** (32 - prefix) - 2);
}

export function rangeStr(base: number, prefix: number): string {
  const net = networkAddress(base, prefix);
  const bcast = broadcastAddress(base, prefix);
  return `${intToIp(net)} – ${intToIp(bcast)}`;
}

export function usableRangeStr(base: number, prefix: number): string {
  if (prefix === 32) return intToIp(base);
  if (prefix === 31) {
    const net = networkAddress(base, prefix);
    return `${intToIp(net)} – ${intToIp((net + 1) >>> 0)}`;
  }
  const net = networkAddress(base, prefix);
  const bcast = broadcastAddress(base, prefix);
  if (bcast - net <= 1) return "—";
  return `${intToIp((net + 1) >>> 0)} – ${intToIp((bcast - 1) >>> 0)}`;
}

export type ParseResult = { base: number; prefix: number };

export function parseCidr(input: string, fallbackPrefix?: number): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Empty input");

  if (trimmed.includes("/")) {
    const [ip, p] = trimmed.split("/").map((s) => s.trim());
    const prefix = Number(p);
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      throw new Error(`Invalid prefix: /${p}`);
    }
    return { base: networkAddress(ipToInt(ip), prefix), prefix };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length === 2) {
    const ip = parts[0];
    const mask = ipToInt(parts[1]);
    const prefix = maskToPrefix(mask);
    return { base: networkAddress(ipToInt(ip), prefix), prefix };
  }

  if (fallbackPrefix !== undefined) {
    return { base: networkAddress(ipToInt(trimmed), fallbackPrefix), prefix: fallbackPrefix };
  }
  throw new Error("Missing prefix");
}

function maskToPrefix(mask: number): number {
  const u = mask >>> 0;
  const inv = (~u) >>> 0;
  if (inv === 0) return 32;
  if (((inv + 1) & inv) !== 0) throw new Error(`Non-contiguous netmask: ${intToIp(u)}`);
  let p = 0;
  let v = u;
  while (v & 0x80000000) {
    p++;
    v = (v << 1) >>> 0;
  }
  return p;
}

export function makeSubnet(base: number, prefix: number, note?: string): Subnet {
  return { base: networkAddress(base, prefix), prefix, ...(note ? { note } : {}) };
}

export function divide(s: Subnet): Subnet {
  if (s.children) return s;
  if (s.prefix >= MAX_PREFIX) throw new Error("Cannot divide /32");
  const childPrefix = s.prefix + 1;
  const half = 2 ** (32 - childPrefix);
  const left: Subnet = { base: s.base, prefix: childPrefix };
  const right: Subnet = { base: (s.base + half) >>> 0, prefix: childPrefix };
  return { ...s, children: [left, right] };
}

export function join(s: Subnet): Subnet {
  if (!s.children) return s;
  const { children: _children, ...rest } = s;
  return { ...rest };
}

export type NodePath = ReadonlyArray<0 | 1>;

export function getNode(root: Subnet, path: NodePath): Subnet {
  let cur = root;
  for (const step of path) {
    if (!cur.children) throw new Error("Path goes through a leaf");
    cur = cur.children[step];
  }
  return cur;
}

export function updateNode(
  root: Subnet,
  path: NodePath,
  fn: (s: Subnet) => Subnet,
): Subnet {
  if (path.length === 0) return fn(root);
  if (!root.children) throw new Error("Path goes through a leaf");
  const [step, ...rest] = path;
  const updated = updateNode(root.children[step], rest, fn);
  const newChildren: [Subnet, Subnet] =
    step === 0 ? [updated, root.children[1]] : [root.children[0], updated];
  return { ...root, children: newChildren };
}

export function leafCount(s: Subnet): number {
  if (!s.children) return 1;
  return leafCount(s.children[0]) + leafCount(s.children[1]);
}

export function depth(s: Subnet): number {
  if (!s.children) return 0;
  return 1 + Math.max(depth(s.children[0]), depth(s.children[1]));
}

export function encodeShape(s: Subnet): string {
  if (!s.children) return "0";
  return "1" + encodeShape(s.children[0]) + encodeShape(s.children[1]);
}

export function decodeShape(
  shape: string,
  base: number,
  prefix: number,
): { node: Subnet; consumed: number } {
  const ch = shape[0];
  if (ch === "0") {
    return { node: { base, prefix }, consumed: 1 };
  }
  if (ch === "1") {
    if (prefix >= MAX_PREFIX) throw new Error("Cannot divide /32 in shape");
    const childPrefix = prefix + 1;
    const half = 2 ** (32 - childPrefix);
    const left = decodeShape(shape.slice(1), base, childPrefix);
    const right = decodeShape(
      shape.slice(1 + left.consumed),
      (base + half) >>> 0,
      childPrefix,
    );
    return {
      node: { base, prefix, children: [left.node, right.node] },
      consumed: 1 + left.consumed + right.consumed,
    };
  }
  throw new Error(`Invalid shape character: ${ch}`);
}

export function cidrStr(s: Subnet): string {
  return `${intToIp(s.base)}/${s.prefix}`;
}
