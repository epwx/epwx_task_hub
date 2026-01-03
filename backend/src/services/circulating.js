const { ethers } = require('ethers');
const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

const EPWX_TOKEN = process.env.EPWX_TOKEN_ADDRESS; // Set this in your .env
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);

// Set these addresses in your .env or config
const DEAD_ADDRESS = process.env.DEAD_ADDRESS || '0x000000000000000000000000000000000000dEaD';

// Only use treasury (fee) address
// Support multiple treasury addresses, comma-separated in .env
const TREASURY_LOCKED_ADDRESSES = (process.env.TREASURY_LOCKED_ADDRESS || '').split(',').map(addr => addr.trim()).filter(Boolean);

async function getCirculatingSupply() {
  const contract = new ethers.Contract(EPWX_TOKEN, ERC20_ABI, provider);
  const [totalSupply, burned, ...treasuryLockedBalances] = await Promise.all([
    contract.totalSupply(),
    contract.balanceOf(DEAD_ADDRESS),
    ...TREASURY_LOCKED_ADDRESSES.map(addr => contract.balanceOf(addr))
  ]);
  // Sum all treasury balances
  const totalTreasuryLocked = treasuryLockedBalances.reduce((acc, bal) => acc + bal, 0n);
  // Use 9 decimals as per token config
  const circulating = ethers.formatUnits(
    totalSupply - burned - totalTreasuryLocked,
    9
  );
  return circulating;
}

module.exports = { getCirculatingSupply };
