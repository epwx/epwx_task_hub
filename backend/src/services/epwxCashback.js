const { ethers } = require('ethers');
const { provider, EPWX_TOKEN_ADDRESS } = require('./blockchain');

// Use prod env property names
const EPWX_WETH_PAIR = process.env.EPWX_WETH_PAIR || '0xYourPairAddressHere';
const UNISWAP_V2_PAIR_ABI = [
  // Only the needed event and function signatures
  "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)",
  "function token0() view returns (address)",
  "function token1() view returns (address)"
];


async function getEPWXPurchaseTransactions(walletAddress, sinceTimestamp) {
  if (!ethers.isAddress(walletAddress)) return [];
  const pair = new ethers.Contract(EPWX_WETH_PAIR, UNISWAP_V2_PAIR_ABI, provider);

  // Debug: Log addresses
  console.log('[EPWX Cashback] Pair address:', EPWX_WETH_PAIR);
  console.log('[EPWX Cashback] Token address:', EPWX_TOKEN_ADDRESS);
  console.log('[EPWX Cashback] Wallet address:', walletAddress);
  console.log('[EPWX Cashback] Since timestamp:', sinceTimestamp);

  // Get token0/token1 to determine which is EPWX
  const [token0, token1] = await Promise.all([
    pair.token0(),
    pair.token1()
  ]);
  const isToken0 = token0.toLowerCase() === EPWX_TOKEN_ADDRESS.toLowerCase();
  console.log('[EPWX Cashback] token0:', token0, 'token1:', token1, 'isToken0:', isToken0);

  // Get Swap events since the given timestamp
  const currentBlock = await provider.getBlockNumber();
  // Estimate block number for sinceTimestamp (approximate)
  const latestBlock = await provider.getBlock(currentBlock);
  const avgBlockTime = 12; // seconds, adjust for your network
  const blocksAgo = Math.floor((latestBlock.timestamp - sinceTimestamp) / avgBlockTime);
  const fromBlock = Math.max(currentBlock - blocksAgo, 0);
  console.log('[EPWX Cashback] Querying blocks', fromBlock, 'to', currentBlock);

  // Get all Swap events for the pair in the block range (no filter on 'to')
  const allSwapEvents = await pair.queryFilter(pair.filters.Swap(), fromBlock, currentBlock);
  console.log('[EPWX Cashback] All Swap events found in range:', allSwapEvents.length);
  allSwapEvents.forEach((event, idx) => {
    const { transactionHash, args, blockNumber } = event;
    console.log(`[EPWX Cashback] Swap #${idx + 1}: txHash=${transactionHash}, sender=${args.sender}, to=${args.to}, amount0In=${args.amount0In}, amount1In=${args.amount1In}, amount0Out=${args.amount0Out}, amount1Out=${args.amount1Out}, block=${blockNumber}`);
  });

  // Now filter for swaps where 'to' is the user (buy)
  const userEvents = allSwapEvents.filter(event => event.args.to.toLowerCase() === walletAddress.toLowerCase());
  console.log('[EPWX Cashback] User Swap events found:', userEvents.length);

  // Map and filter for 'buy' (user receives EPWX)
  const txs = await Promise.all(userEvents.map(async (event) => {
    const { transactionHash, args, blockNumber } = event;
    const block = await provider.getBlock(blockNumber);
    const timestamp = block.timestamp;
    // Determine direction: user bought EPWX if they received EPWX (amount0Out or amount1Out)
    let amount = null;
    let direction = null;
    if (isToken0 && args.amount0Out.gt(0)) {
      amount = args.amount0Out.toString();
      direction = 'buy';
    } else if (!isToken0 && args.amount1Out.gt(0)) {
      amount = args.amount1Out.toString();
      direction = 'buy';
    }
    if (direction === 'buy') {
      return {
        txHash: transactionHash,
        from: args.sender,
        to: args.to,
        amount,
        timestamp,
        direction
      };
    }
    return null;
  }));
  // Filter out nulls and only include those after sinceTimestamp
  const filtered = txs.filter(tx => tx && tx.timestamp >= sinceTimestamp);
  console.log('[EPWX Cashback] Buy txs after filter:', filtered.length);
  return filtered;
}

module.exports = {
  getEPWXPurchaseTransactions,
};
