const { ethers } = require('ethers');
const ERC20_ABI = [
  // Only the function we need
  "function totalSupply() view returns (uint256)"
];

const EPWX_TOKEN = process.env.EPWX_TOKEN_ADDRESS; // Set this in your .env
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);

async function getTotalSupply() {
  const contract = new ethers.Contract(EPWX_TOKEN, ERC20_ABI, provider);
  const totalSupply = await contract.totalSupply();
  // Adjust decimals to 9 as per BaseScan
  return ethers.formatUnits(totalSupply, 9);
}

module.exports = { getTotalSupply };
