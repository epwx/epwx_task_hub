import { ethers } from 'ethers';
const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

const EPWX_TOKEN = process.env.EPWX_TOKEN_ADDRESS; // Set this in your .env
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const DEAD_ADDRESS = process.env.DEAD_ADDRESS || '0x000000000000000000000000000000000000dEaD';

export function calculateNetTotalSupply(totalSupply, burnedSupply) {
  if (burnedSupply > totalSupply) {
    throw new RangeError('Burned supply cannot exceed the contract total supply');
  }

  return totalSupply - burnedSupply;
}

export async function getTotalSupply() {
  const contract = new ethers.Contract(EPWX_TOKEN, ERC20_ABI, provider);
  const [totalSupply, burnedSupply] = await Promise.all([
    contract.totalSupply(),
    contract.balanceOf(DEAD_ADDRESS),
  ]);

  return ethers.formatUnits(calculateNetTotalSupply(totalSupply, burnedSupply), 9);
}
