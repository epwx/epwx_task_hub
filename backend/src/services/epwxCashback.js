
import { ethers } from 'ethers';
import { provider, EPWX_TOKEN_ADDRESS } from './blockchain.js';

// Add PancakeSwap support
const PANCAKE_PAIR_ADDRESS = process.env.PANCAKE_EPWX_WETH_PAIR || process.env.EPWX_WETH_PAIR;
const ADMIN_ADDRESSES = [
  (process.env.ADMIN_WALLET || '').toLowerCase(),
  (process.env.SYSTEM_WALLET || '').toLowerCase()
];

// Use prod env property names
const EPWX_WETH_PAIR = process.env.EPWX_WETH_PAIR || '0xYourPairAddressHere';
const PANCAKE_EPWX_WETH_PAIR = PANCAKE_PAIR_ADDRESS;
const UNISWAP_V2_PAIR_ABI = [
  // Only the needed event and function signatures
  "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export async function getEPWXPurchaseTransactions(walletAddress, sinceTimestamp) {
  if (!ethers.isAddress(walletAddress)) return [];
  const pools = [
    { name: 'Uniswap', address: EPWX_WETH_PAIR },
    { name: 'PancakeSwap', address: PANCAKE_EPWX_WETH_PAIR }
  ];
  const BLOCK_LOOKBACK = 10000;
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(currentBlock - BLOCK_LOOKBACK, 0);

  // Collect all swap events from both pools
  let allSwapEvents = [];
  for (const pool of pools) {
    if (!pool.address) continue;
    const pair = new ethers.Contract(pool.address, UNISWAP_V2_PAIR_ABI, provider);
    try {
      const swapEvents = await pair.queryFilter(pair.filters.Swap(), fromBlock, currentBlock);
      allSwapEvents = allSwapEvents.concat(swapEvents.map(e => ({ ...e, pool: pool.name, pairAddress: pool.address })));
    } catch (e) {
      console.error(`[EPWX Cashback] Error fetching swaps for ${pool.name}:`, e);
    }
  }

  // Collect all EPWX transfer events to the user
  const epwxToken = new ethers.Contract(EPWX_TOKEN_ADDRESS, ERC20_ABI, provider);
  let transferEvents = [];
  try {
    transferEvents = await epwxToken.queryFilter(
      epwxToken.filters.Transfer(null, walletAddress),
      fromBlock,
      currentBlock
    );
  } catch (e) {
    console.error('[EPWX Cashback] Error fetching transfers:', e);
  }

  // For each transfer, check if it is part of a swap transaction (same txHash as a swap event)
  const eligible = [];
  for (const transfer of transferEvents) {
    const txHash = transfer.transactionHash;
    // Find a swap event in the same txHash from any pool
    const swap = allSwapEvents.find(e => e.transactionHash === txHash);
    if (!swap) continue;
    // Exclude if transfer is from admin/system
    if (ADMIN_ADDRESSES.includes(transfer.args.from.toLowerCase())) continue;
    // Get block timestamp
    const block = await provider.getBlock(transfer.blockNumber);
    if (block.timestamp < sinceTimestamp) continue;
    // Format amount
    const formattedAmount = ethers.formatUnits(transfer.args.value, 9);
    eligible.push({
      txHash,
      from: transfer.args.from,
      to: transfer.args.to,
      amount: formattedAmount,
      timestamp: block.timestamp,
      pool: swap.pool,
      direction: 'buy'
    });
  }
  return eligible;
}
