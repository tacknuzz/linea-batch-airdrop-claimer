// src/chain.ts
const { createPublicClient, createWalletClient, http, parseAbi, zeroAddress } = require('viem');
import type { Chain } from 'viem/chains';

export function makeClient(rpcUrl: string, chainId: number) {
  const chain: Chain = { id: chainId, name: 'Linea', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } } };
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  return { chain, publicClient };
}
