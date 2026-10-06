import { ethers } from "ethers";

import {
  BASE_WETH_ADDRESS,
  EPWX_DECIMALS,
  EPWX_SWAP_ROUTERS,
  EPWX_SWAP_SLIPPAGE_BPS,
  EPWX_TOKEN_ADDRESS,
} from "@/utils/epwxMarket";

const V2_ROUTER_ABI = [
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
  dexName: string;
  routerAddress: `0x${string}`;
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
  dexName,
  routerAddress,
}: {
  provider: ethers.Provider;
  amountInWei: bigint;
  path: string[];
  outputDecimals: number;
  outputLabel: string;
  slippageBps: number;
  dexName: string;
  routerAddress: `0x${string}`;
}): Promise<EpwxSwapQuote> {
  const router = new ethers.Contract(routerAddress, V2_ROUTER_ABI, provider);
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
    dexName,
    routerAddress,
  };
}

async function getSwapQuotes({
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
}): Promise<EpwxSwapQuote[]> {
  const results = await Promise.allSettled(EPWX_SWAP_ROUTERS.map((dex) => getSwapQuote({
    provider,
    amountInWei,
    path,
    outputDecimals,
    outputLabel,
    slippageBps,
    dexName: dex.name,
    routerAddress: dex.address,
  })));
  const quotes = results
    .filter((result): result is PromiseFulfilledResult<EpwxSwapQuote> => result.status === "fulfilled")
    .map((result) => result.value);

  if (quotes.length === 0) {
    throw new Error(`No ${outputLabel} quote available from supported exchanges`);
  }

  return quotes.sort((firstQuote, secondQuote) => (
    firstQuote.quotedOutWei > secondQuote.quotedOutWei ? -1 : firstQuote.quotedOutWei < secondQuote.quotedOutWei ? 1 : 0
  ));
}

export async function getEpwxSwapQuotes({
  provider,
  amountEth,
  slippageBps = EPWX_SWAP_SLIPPAGE_BPS,
}: {
  provider: ethers.Provider;
  amountEth: string;
  slippageBps?: number;
}): Promise<EpwxSwapQuote[]> {
  const amountInWei = ethers.parseEther(amountEth);
  return getSwapQuotes({
    provider,
    amountInWei,
    path: getEpwxSwapPath(),
    outputDecimals: EPWX_DECIMALS,
    outputLabel: "EPWX",
    slippageBps,
  });
}

export async function getEpwxSwapQuote(options: Parameters<typeof getEpwxSwapQuotes>[0]): Promise<EpwxSwapQuote> {
  const quotes = await getEpwxSwapQuotes(options);
  return quotes[0];
}

export async function getEpwxToEthSwapQuotes({
  provider,
  amountEpwx,
  slippageBps = EPWX_SWAP_SLIPPAGE_BPS,
}: {
  provider: ethers.Provider;
  amountEpwx: string;
  slippageBps?: number;
}): Promise<EpwxSwapQuote[]> {
  const amountInWei = ethers.parseUnits(amountEpwx, EPWX_DECIMALS);
  return getSwapQuotes({
    provider,
    amountInWei,
    path: getEthSwapPath(),
    outputDecimals: 18,
    outputLabel: "ETH",
    slippageBps,
  });
}

export async function getEpwxToEthSwapQuote(options: Parameters<typeof getEpwxToEthSwapQuotes>[0]): Promise<EpwxSwapQuote> {
  const quotes = await getEpwxToEthSwapQuotes(options);
  return quotes[0];
}

export async function swapEthToEpwx({ provider, amountEth, userAddress, quote: providedQuote }: { provider: ethers.BrowserProvider, amountEth: string, userAddress: string, quote?: EpwxSwapQuote }) {
  if (!provider || !userAddress) throw new Error("Wallet not connected");
  const signer = await provider.getSigner();
  const path = getEpwxSwapPath();
  const quote = providedQuote || await getEpwxSwapQuote({ provider, amountEth });
  if (quote.amountInWei !== ethers.parseEther(amountEth)) {
    throw new Error("Swap amount changed. Wait for an updated quote and try again.");
  }
  const router = new ethers.Contract(quote.routerAddress, V2_ROUTER_ABI, signer);
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

export async function swapEpwxToEth({ provider, amountEpwx, userAddress, quote: providedQuote }: { provider: ethers.BrowserProvider, amountEpwx: string, userAddress: string, quote?: EpwxSwapQuote }) {
  if (!provider || !userAddress) throw new Error("Wallet not connected");
  const signer = await provider.getSigner();
  const epwxToken = new ethers.Contract(EPWX_TOKEN_ADDRESS, ERC20_ABI, signer);
  const quote = providedQuote || await getEpwxToEthSwapQuote({ provider, amountEpwx });
  if (quote.amountInWei !== ethers.parseUnits(amountEpwx, EPWX_DECIMALS)) {
    throw new Error("Swap amount changed. Wait for an updated quote and try again.");
  }
  const router = new ethers.Contract(quote.routerAddress, V2_ROUTER_ABI, signer);
  const currentAllowance = await epwxToken.allowance(userAddress, quote.routerAddress);

  if (BigInt(currentAllowance.toString()) < quote.amountInWei) {
    const approvalTx = await epwxToken.approve(quote.routerAddress, quote.amountInWei);
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
