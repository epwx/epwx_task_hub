import { ethers } from 'ethers';
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)"
];

const EPWX_TOKEN = process.env.EPWX_TOKEN_ADDRESS; // Set this in your .env
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
const DEAD_ADDRESS = process.env.DEAD_ADDRESS || '0x000000000000000000000000000000000000dEaD';

export async function getBurnedSupply() {
  const contract = new ethers.Contract(EPWX_TOKEN, ERC20_ABI, provider);
  const burned = await contract.balanceOf(DEAD_ADDRESS);
  // Use 9 decimals as per token config
  return ethers.formatUnits(burned, 9);
}
