// src/claimer.ts
const pLimit = require('p-limit').default;
const { makeClient } = require('./chain');
const { getAllocation, getHasClaimed, readDeploymentConstants, sendClaim } = require('./airdrop');
const { loadPrivateKeys, loadSeeds } = require('./wallets');
const { config } = require('./config');
const { createWalletClient, http, formatGwei, parseGwei } = require('viem');
const colors = require("colors");
const fs = require('fs');

export async function runClaimer() {
  const rpc = config.rpcUrls.find(Boolean)!;
  const { chain, publicClient } = makeClient(rpc, config.chainId);
  const constants = await readDeploymentConstants(publicClient, config.airdropAddress as any);
  const signers = [...loadPrivateKeys('wallets/privateKeys.txt'), ...loadSeeds('wallets/seeds.txt')];

  const limit = pLimit(config.concurrency);
  const results: any[] = [];
  await Promise.all(signers.map(acc => limit(async () => {
    const addr = acc.address as any;
    const [alloc, claimed] = await Promise.all([
      getAllocation(publicClient, config.airdropAddress as any, addr),
      getHasClaimed(publicClient, config.airdropAddress as any, addr),
    ]);
    if (claimed || alloc <= BigInt(config.minAllocationToClaim)) {
      results.push({ address: addr, skipped: true, reason: claimed ? 'already claimed' : 'zero/dust' });
      return;
    }
    if (BigInt(Math.floor(Date.now() / 1000)) >= constants.claimEnd) {
      results.push({ address: addr, skipped: true, reason: 'claim window closed' });
      return;
    }
    const walletClient = createWalletClient({ account: acc, chain, transport: http(rpc) });
    try {
      const receipt = await sendClaim(walletClient as any, publicClient, config.airdropAddress as any, addr);
      results.push({ address: addr, txHash: receipt.transactionHash, status: receipt.status, gasUsed: receipt.gasUsed?.toString?.() });
    } catch (e: any) {
      results.push({ address: addr, error: String(e?.shortMessage || e?.message || e) });
    }
  })));
  fs.writeFileSync('results/claims.json', JSON.stringify(results, null, 2));
  fs.writeFileSync('results/claims.csv', 'address,txHash,status,gasUsed,error,skipped,reason\n' + results.map(r =>
    [r.address, r.txHash||'', r.status||'', r.gasUsed||'', r.error||'', r.skipped||'', r.reason||''].join(',')
  ).join('\n'));
}

runClaimer();