import { Subnet, encodeShape, decodeShape, ipToInt, intToIp } from "./subnet";

export function encodeHash(root: Subnet): string {
  return `${intToIp(root.base)}/${root.prefix}!${encodeShape(root)}`;
}

export function decodeHash(hash: string): Subnet | null {
  try {
    const raw = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!raw) return null;
    const m = raw.match(/^([0-9.]+)\/(\d+)!([01]+)$/);
    if (!m) return null;
    const base = ipToInt(m[1]);
    const prefix = Number(m[2]);
    if (prefix < 0 || prefix > 32) return null;
    const shape = m[3];
    const { node, consumed } = decodeShape(shape, base, prefix);
    if (consumed !== shape.length) return null;
    return node;
  } catch {
    return null;
  }
}
