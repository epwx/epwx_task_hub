import { ethers } from "ethers";

// PancakeSwap Router and EPWX token addresses (Base network)
const PANCAKESWAP_ROUTER_ADDRESS = "0x9793d47dd47024ac4e1f17988d2e92da53a94541";
const EPWX_TOKEN_ADDRESS = "0xef5f5751cf3eca6cc3572768298b7783d33d60eb";
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

// Minimal ABI for swapExactETHForTokens
const PANCAKESWAP_ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)"
];

export async function swapEthToEpwx({ provider, amountEth, userAddress }: { provider: ethers.BrowserProvider, amountEth: string, userAddress: string }) {
  if (!provider || !userAddress) throw new Error("Wallet not connected");
  const signer = await provider.getSigner();
  const router = new ethers.Contract(PANCAKESWAP_ROUTER_ADDRESS, PANCAKESWAP_ROUTER_ABI, signer);

  // Set up swap path: ETH -> EPWX
  const path = [WETH_ADDRESS, EPWX_TOKEN_ADDRESS];

  // Set slippage and deadline
  const amountOutMin = 0; // For demo, set to 0. In production, calculate minimum out with slippage
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

  // Execute swap
  const tx = await router.swapExactETHForTokens(
    amountOutMin,
    path,
    userAddress,
    deadline,
    { value: ethers.parseEther(amountEth.toString()) }
  );
  await tx.wait();
  return tx.hash;
}
