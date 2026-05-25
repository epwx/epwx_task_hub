import { ethers } from "ethers";

import {
  BASE_WETH_ADDRESS,
  EPWX_DECIMALS,
  EPWX_SWAP_SLIPPAGE_BPS,
  EPWX_TOKEN_ADDRESS,
  PANCAKESWAP_ROUTER_ADDRESS,
} from "@/utils/epwxMarket";

// Minimal ABI for swapExactETHForTokens
const PANCAKESWAP_ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)",
  "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable",
];

export interface EpwxSwapQuote {
  amountInWei: bigint;
  quotedOutWei: bigint;
  minOutWei: bigint;
  quotedOutFormatted: string;
  minOutFormatted: string;
}

function getEpwxSwapPath() {
  return [BASE_WETH_ADDRESS, EPWX_TOKEN_ADDRESS];
}

export async function getEpwxSwapQuote({
  provider,
  amountEth,
  slippageBps = EPWX_SWAP_SLIPPAGE_BPS,
}: {
  provider: ethers.Provider;
  amountEth: string;
  slippageBps?: number;
}): Promise<EpwxSwapQuote> {
  const router = new ethers.Contract(PANCAKESWAP_ROUTER_ADDRESS, PANCAKESWAP_ROUTER_ABI, provider);
  const amountInWei = ethers.parseEther(amountEth);
  const path = getEpwxSwapPath();
  const amountsOut = await router.getAmountsOut(amountInWei, path);
  const quotedOutWei = BigInt(amountsOut[amountsOut.length - 1].toString());

  if (quotedOutWei <= BigInt(0)) {
    throw new Error("No EPWX quote available for this swap amount");
  }

  const minOutWei =
    (quotedOutWei * BigInt(10_000 - slippageBps)) /
    BigInt(10_000);

  return {
    amountInWei,
    quotedOutWei,
    minOutWei,
    quotedOutFormatted: ethers.formatUnits(quotedOutWei, EPWX_DECIMALS),
    minOutFormatted: ethers.formatUnits(minOutWei, EPWX_DECIMALS),
  };
}

export async function swapEthToEpwx({ provider, amountEth, userAddress }: { provider: ethers.BrowserProvider, amountEth: string, userAddress: string }) {
  if (!provider || !userAddress) throw new Error("Wallet not connected");
  const signer = await provider.getSigner();
  const router = new ethers.Contract(PANCAKESWAP_ROUTER_ADDRESS, PANCAKESWAP_ROUTER_ABI, signer);
  const path = getEpwxSwapPath();
  const quote = await getEpwxSwapQuote({ provider, amountEth });
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

  const tx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
    quote.minOutWei,
    path,
    userAddress,
    deadline,
    { value: quote.amountInWei }
  );
  await tx.wait();
  return tx.hash;
}
