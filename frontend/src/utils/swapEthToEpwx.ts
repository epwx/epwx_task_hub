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
  "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline)",
];

const ERC20_ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
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

function getEthSwapPath() {
  return [EPWX_TOKEN_ADDRESS, BASE_WETH_ADDRESS];
}

async function getSwapQuote({
  provider,
  amountInWei,
  path,
  outputDecimals,
  outputLabel,
  slippageBps,
}: {
  provider: ethers.Provider;
  amountInWei: bigint;
  path: string[];
  outputDecimals: number;
  outputLabel: string;
  slippageBps: number;
}): Promise<EpwxSwapQuote> {
  const router = new ethers.Contract(PANCAKESWAP_ROUTER_ADDRESS, PANCAKESWAP_ROUTER_ABI, provider);
  const amountsOut = await router.getAmountsOut(amountInWei, path);
  const quotedOutWei = BigInt(amountsOut[amountsOut.length - 1].toString());

  if (quotedOutWei <= BigInt(0)) {
    throw new Error(`No ${outputLabel} quote available for this swap amount`);
  }

  const minOutWei = (quotedOutWei * BigInt(10_000 - slippageBps)) / BigInt(10_000);

  return {
    amountInWei,
    quotedOutWei,
    minOutWei,
    quotedOutFormatted: ethers.formatUnits(quotedOutWei, outputDecimals),
    minOutFormatted: ethers.formatUnits(minOutWei, outputDecimals),
  };
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
  const amountInWei = ethers.parseEther(amountEth);
  return getSwapQuote({
    provider,
    amountInWei,
    path: getEpwxSwapPath(),
    outputDecimals: EPWX_DECIMALS,
    outputLabel: "EPWX",
    slippageBps,
  });
}

export async function getEpwxToEthSwapQuote({
  provider,
  amountEpwx,
  slippageBps = EPWX_SWAP_SLIPPAGE_BPS,
}: {
  provider: ethers.Provider;
  amountEpwx: string;
  slippageBps?: number;
}): Promise<EpwxSwapQuote> {
  const amountInWei = ethers.parseUnits(amountEpwx, EPWX_DECIMALS);
  return getSwapQuote({
    provider,
    amountInWei,
    path: getEthSwapPath(),
    outputDecimals: 18,
    outputLabel: "ETH",
    slippageBps,
  });
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

export async function swapEpwxToEth({ provider, amountEpwx, userAddress }: { provider: ethers.BrowserProvider, amountEpwx: string, userAddress: string }) {
  if (!provider || !userAddress) throw new Error("Wallet not connected");
  const signer = await provider.getSigner();
  const router = new ethers.Contract(PANCAKESWAP_ROUTER_ADDRESS, PANCAKESWAP_ROUTER_ABI, signer);
  const epwxToken = new ethers.Contract(EPWX_TOKEN_ADDRESS, ERC20_ABI, signer);
  const quote = await getEpwxToEthSwapQuote({ provider, amountEpwx });
  const currentAllowance = await epwxToken.allowance(userAddress, PANCAKESWAP_ROUTER_ADDRESS);

  if (BigInt(currentAllowance.toString()) < quote.amountInWei) {
    const approvalTx = await epwxToken.approve(PANCAKESWAP_ROUTER_ADDRESS, quote.amountInWei);
    await approvalTx.wait();
  }

  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
  const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
    quote.amountInWei,
    quote.minOutWei,
    getEthSwapPath(),
    userAddress,
    deadline
  );
  await tx.wait();
  return tx.hash;
}
