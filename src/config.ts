// src/config.ts
export const config = {
  rpcUrls: [
    process.env.LINEA_RPC_1 || 'https://rpc.linea.build',
    process.env.LINEA_RPC_2 || '',
  ],
  chainId: 59144,
  airdropAddress: '0x87bAa1694381aE3eCaE2660d97fe60404080Eb64',
  concurrency: 8,
  maxFeePerGasGwei: 1.5,
  maxPriorityFeePerGasGwei: 0.03,
  minAllocationToClaim: 0n, // set to >0n to skip dust
  derivation: {
    defaultPath: "m/44'/60'/0'/0/0",
    defaultIndex: 0,
  },
};
