// src/wallets.ts
const { mnemonicToAccount, privateKeyToAccount } = require("viem/accounts");
const fs = require("fs");

export type SourceRow = {
  type: "address" | "pk" | "seed";
  raw: string;
  account?: any;
};

export function loadAddresses(path: string): string[] {
  return fs
    .readFileSync(path, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

export function loadPrivateKeys(path: string) {
  return loadAddresses(path).map((pk) =>
    privateKeyToAccount(pk as `0x${string}`)
  );
}

export function parseSeedLine(line: string) {
  const [phrase, ...rest] = line.split("|");
  const opts = Object.fromEntries(rest.map((kv) => kv.split("=")));
  const path = opts.path || "m/44'/60'/0'/0/0";
  return mnemonicToAccount(phrase.trim(), { path });
}

export function loadSeeds(path: string) {
  return loadAddresses(path).map(parseSeedLine);
}
