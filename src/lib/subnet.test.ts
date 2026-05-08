import { describe, it, expect } from "vitest";
import {
  ipToInt,
  intToIp,
  netmaskStr,
  wildcardStr,
  usableHosts,
  parseCidr,
  divide,
  join,
  makeSubnet,
  updateNode,
  getNode,
  leafCount,
  encodeShape,
  decodeShape,
  cidrStr,
  rangeStr,
  usableRangeStr,
  totalAddresses,
} from "./subnet";

describe("ip <-> int", () => {
  it("round-trips basic addresses", () => {
    for (const ip of ["0.0.0.0", "10.0.0.1", "192.168.1.1", "255.255.255.255"]) {
      expect(intToIp(ipToInt(ip))).toBe(ip);
    }
  });

  it("rejects invalid addresses", () => {
    expect(() => ipToInt("256.0.0.0")).toThrow();
    expect(() => ipToInt("1.2.3")).toThrow();
    expect(() => ipToInt("a.b.c.d")).toThrow();
  });
});

describe("netmask", () => {
  it("computes well-known masks", () => {
    expect(netmaskStr(0)).toBe("0.0.0.0");
    expect(netmaskStr(8)).toBe("255.0.0.0");
    expect(netmaskStr(16)).toBe("255.255.0.0");
    expect(netmaskStr(24)).toBe("255.255.255.0");
    expect(netmaskStr(25)).toBe("255.255.255.128");
    expect(netmaskStr(32)).toBe("255.255.255.255");
  });

  it("computes wildcard inverse", () => {
    expect(wildcardStr(24)).toBe("0.0.0.255");
    expect(wildcardStr(30)).toBe("0.0.0.3");
  });
});

describe("usableHosts", () => {
  it("handles standard prefixes", () => {
    expect(usableHosts(24)).toBe(254);
    expect(usableHosts(30)).toBe(2);
    expect(usableHosts(0)).toBe(2 ** 32 - 2);
  });
  it("RFC 3021 /31", () => {
    expect(usableHosts(31)).toBe(2);
  });
  it("/32 host route", () => {
    expect(usableHosts(32)).toBe(1);
  });
});

describe("parseCidr", () => {
  it("parses ip/prefix", () => {
    const r = parseCidr("10.0.0.0/24");
    expect(r.prefix).toBe(24);
    expect(intToIp(r.base)).toBe("10.0.0.0");
  });
  it("normalizes host bits to network", () => {
    const r = parseCidr("10.0.0.55/24");
    expect(intToIp(r.base)).toBe("10.0.0.0");
  });
  it("parses ip + dotted mask", () => {
    const r = parseCidr("192.168.1.0 255.255.255.0");
    expect(r.prefix).toBe(24);
    expect(intToIp(r.base)).toBe("192.168.1.0");
  });
  it("rejects bad input", () => {
    expect(() => parseCidr("")).toThrow();
    expect(() => parseCidr("10.0.0.0/33")).toThrow();
    expect(() => parseCidr("10.0.0.0 255.0.255.0")).toThrow();
  });
});

describe("divide / join", () => {
  it("divide creates two contiguous halves", () => {
    const s = makeSubnet(ipToInt("10.0.0.0"), 24);
    const d = divide(s);
    expect(d.children).toBeDefined();
    expect(cidrStr(d.children![0])).toBe("10.0.0.0/25");
    expect(cidrStr(d.children![1])).toBe("10.0.0.128/25");
  });

  it("divide is the inverse of join", () => {
    const s = makeSubnet(ipToInt("10.0.0.0"), 24);
    expect(join(divide(s))).toEqual(s);
  });

  it("nested divide", () => {
    let s = makeSubnet(ipToInt("10.0.0.0"), 24);
    s = divide(s);
    s = updateNode(s, [0], divide);
    expect(cidrStr(getNode(s, [0, 0]))).toBe("10.0.0.0/26");
    expect(cidrStr(getNode(s, [0, 1]))).toBe("10.0.0.64/26");
    expect(cidrStr(getNode(s, [1]))).toBe("10.0.0.128/25");
    expect(leafCount(s)).toBe(3);
  });

  it("cannot divide /32", () => {
    const s = makeSubnet(ipToInt("10.0.0.0"), 32);
    expect(() => divide(s)).toThrow();
  });
});

describe("shape encoding", () => {
  it("encode/decode round-trip — flat", () => {
    const s = makeSubnet(ipToInt("10.0.0.0"), 24);
    const shape = encodeShape(s);
    expect(shape).toBe("0");
    expect(decodeShape(shape, s.base, s.prefix).node).toEqual(s);
  });

  it("encode/decode round-trip — nested", () => {
    let s = makeSubnet(ipToInt("10.0.0.0"), 24);
    s = divide(s);
    s = updateNode(s, [1], divide);
    s = updateNode(s, [1, 0], divide);
    const shape = encodeShape(s);
    const back = decodeShape(shape, s.base, s.prefix).node;
    expect(encodeShape(back)).toBe(shape);
    expect(leafCount(back)).toBe(leafCount(s));
  });
});

describe("range strings", () => {
  it("range covers full block", () => {
    expect(rangeStr(ipToInt("10.0.0.0"), 24)).toBe("10.0.0.0 – 10.0.0.255");
  });
  it("usable excludes net + bcast for /24", () => {
    expect(usableRangeStr(ipToInt("10.0.0.0"), 24)).toBe("10.0.0.1 – 10.0.0.254");
  });
  it("usable for /31", () => {
    expect(usableRangeStr(ipToInt("10.0.0.0"), 31)).toBe("10.0.0.0 – 10.0.0.1");
  });
  it("usable for /32", () => {
    expect(usableRangeStr(ipToInt("10.0.0.5"), 32)).toBe("10.0.0.5");
  });
});

describe("totalAddresses", () => {
  it("counts blocks", () => {
    expect(totalAddresses(24)).toBe(256);
    expect(totalAddresses(30)).toBe(4);
    expect(totalAddresses(0)).toBe(2 ** 32);
  });
});
