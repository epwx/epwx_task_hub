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
  if (!ethers.utils.isAddress(walletAddress)) return [];
  const pair = new ethers.Contract(EPWX_WETH_PAIR, UNISWAP_V2_PAIR_ABI, provider);

  // Get token0/token1 to determine which is EPWX
  const [token0, token1] = await Promise.all([
    pair.token0(),
    pair.token1()
  ]);
  const isToken0 = token0.toLowerCase() === EPWX_TOKEN_ADDRESS.toLowerCase();

  // Get Swap events since the given timestamp
  const currentBlock = await provider.getBlockNumber();
  // Estimate block number for sinceTimestamp (approximate)
  const latestBlock = await provider.getBlock(currentBlock);
  const avgBlockTime = 12; // seconds, adjust for your network
  const blocksAgo = Math.floor((latestBlock.timestamp - sinceTimestamp) / avgBlockTime);
  const fromBlock = Math.max(currentBlock - blocksAgo, 0);

  // Filter for swaps where 'to' is the user (buy)
  const filter = pair.filters.Swap(null, null, null, null, null, walletAddress);
  const events = await pair.queryFilter(filter, fromBlock, currentBlock);

  // Map and filter for 'buy' (user receives EPWX)
  const txs = await Promise.all(events.map(async (event) => {
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
  return txs.filter(tx => tx && tx.timestamp >= sinceTimestamp);
}

module.exports = {
  getEPWXPurchaseTransactions,
};
