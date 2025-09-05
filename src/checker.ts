// src/checker.ts
import type { Address } from "viem";
// src/checker.ts
const pLimit = require('p-limit').default;
const {
  getAllocation,
  getHasClaimed,
  readDeploymentConstants,
} = require("./airdrop");
const { makeClient } = require("./chain");
const { config } = require("./config");
const fs = require("fs");
const { loadAddresses, loadPrivateKeys, loadSeeds } = require("./wallets");
const colors = require("colors");

export async function runChecker() {
  const rpc = config.rpcUrls.find(Boolean)!;
  const { publicClient } = makeClient(rpc, config.chainId);
  const constants = await readDeploymentConstants(
    publicClient,
    config.airdropAddress as Address
  );
  console.log("Airdrop constants:", constants);

  const addresses = new Set<string>();
  loadAddresses("wallets/addresses.txt").forEach((a) => addresses.add(a));
  loadPrivateKeys("wallets/privateKeys.txt").forEach((acc) =>
    addresses.add(acc.address)
  );
  loadSeeds("wallets/seeds.txt").forEach((acc) => addresses.add(acc.address));

  console.log(colors.cyan(`Loaded ${addresses.size} addresses...`));

  const limit = pLimit(config.concurrency);
  const tasks = [...addresses].map((addr) =>
    limit(async () => {
      const [alloc, claimed] = await Promise.all([
        getAllocation(
          publicClient,
          config.airdropAddress as Address,
          addr as Address
        ),
        getHasClaimed(
          publicClient,
          config.airdropAddress as Address,
          addr as Address
        ),
      ]);
      return {
        address: addr,
        allocation: alloc.toString(),
        hasClaimed: claimed,
      };
    })
  );
  const rows = await Promise.all(tasks);
  fs.writeFileSync("results/checks.json", JSON.stringify(rows, null, 2));
  fs.writeFileSync(
    "results/checks.csv",
    "address,allocation,hasClaimed\n" +
      rows.map((r) => `${r.address},${r.allocation},${r.hasClaimed}`).join("\n")
  );
}

runChecker();