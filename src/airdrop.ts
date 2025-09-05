// src/airdrop.ts
import type { Address, PublicClient, WalletClient } from 'viem';
const { parseAbi } = require('viem');
export const AIRDROP_ABI = [{"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"address","name":"_ownerAddress","type":"address"},{"internalType":"uint256","name":"_claimEnd","type":"uint256"},{"internalType":"address","name":"_primaryFactorAddress","type":"address"},{"internalType":"address","name":"_primaryConditionalMultiplierAddress","type":"address"},{"internalType":"address","name":"_secondaryFactorAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"AllCalculationFactorsZero","type":"error"},{"inputs":[],"name":"AlreadyClaimed","type":"error"},{"inputs":[],"name":"ClaimAmountIsZero","type":"error"},{"inputs":[],"name":"ClaimEndTooShort","type":"error"},{"inputs":[],"name":"ClaimFinished","type":"error"},{"inputs":[],"name":"ClaimNotFinished","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"inputs":[],"name":"RenouncingOwnershipDisabled","type":"error"},{"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"SafeERC20FailedOperation","type":"error"},{"inputs":[],"name":"ZeroAddressNotAllowed","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"address","name":"primaryFactor","type":"address"},{"indexed":false,"internalType":"address","name":"primaryMultiplier","type":"address"},{"indexed":false,"internalType":"address","name":"secondaryFactor","type":"address"},{"indexed":false,"internalType":"uint256","name":"claimEndTimestamp","type":"uint256"}],"name":"AirdropConfigured","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claimed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TokenBalanceWithdrawn","type":"event"},{"inputs":[],"name":"CLAIM_END","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DENOMINATOR","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PRIMARY_CONDITIONAL_MULTIPLIER_ADDRESS","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PRIMARY_FACTOR_ADDRESS","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SECONDARY_FACTOR_ADDRESS","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"TOKEN","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_account","type":"address"}],"name":"calculateAllocation","outputs":[{"internalType":"uint256","name":"tokenAllocation","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"hasClaimed","outputs":[{"internalType":"bool","name":"claimed","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pendingOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}];

export function airdropContract(address: Address) {
  return { address, abi: AIRDROP_ABI } as const;
}

export async function readDeploymentConstants(publicClient: PublicClient, address: Address) {
  const c = airdropContract(address);
  const [token, claimEnd, p, m, s] = await Promise.all([
    publicClient.readContract({ ...c, functionName: 'TOKEN' }),
    publicClient.readContract({ ...c, functionName: 'CLAIM_END' }),
    publicClient.readContract({ ...c, functionName: 'PRIMARY_FACTOR_ADDRESS' }),
    publicClient.readContract({ ...c, functionName: 'PRIMARY_CONDITIONAL_MULTIPLIER_ADDRESS' }),
    publicClient.readContract({ ...c, functionName: 'SECONDARY_FACTOR_ADDRESS' }),
  ]);
  return { token: token as Address, claimEnd: claimEnd as bigint, primary: p as Address, multiplier: m as Address, secondary: s as Address };
}

export async function getAllocation(publicClient: PublicClient, contract: Address, account: Address) {
  return await publicClient.readContract({ address: contract, abi: AIRDROP_ABI, functionName: 'calculateAllocation', args: [account] }) as bigint;
}

export async function getHasClaimed(publicClient: PublicClient, contract: Address, account: Address) {
  return await publicClient.readContract({ address: contract, abi: AIRDROP_ABI, functionName: 'hasClaimed', args: [account] }) as boolean;
}

export async function sendClaim(walletClient: WalletClient, publicClient: PublicClient, contract: Address, account: Address) {
  const gas = await publicClient.estimateContractGas({ address: contract, abi: AIRDROP_ABI, functionName: 'claim' });
  const hash = await walletClient.writeContract({ address: contract, abi: AIRDROP_ABI, functionName: 'claim', account: walletClient.account as any, chain: walletClient.chain, gas });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return receipt;
}
