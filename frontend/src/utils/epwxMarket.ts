import { parseJsonResponse } from '@/utils/apiErrors';

export interface EpwxPriceData {
  priceUSD: number;
  liquidityUSD: number;
  marketCap: number;
  epwxReserve: number;
  wethReserve: number;
}

export const EPWX_TOKEN_ADDRESS =
  (process.env.NEXT_PUBLIC_EPWX_TOKEN as `0x${string}`) ||
  "0xef5f5751cf3eca6cc3572768298b7783d33d60eb";

export const WETH_TOKEN_ADDRESS =
  (process.env.NEXT_PUBLIC_WETH_TOKEN as `0x${string}`) ||
  (process.env.NEXT_PUBLIC_BASE_WETH as `0x${string}`) ||
  "0x4200000000000000000000000000000000000006";

export const EPWX_WETH_PAIR_ADDRESS =
  process.env.NEXT_PUBLIC_EPWX_WETH_PAIR ||
  process.env.NEXT_PUBLIC_EPWX_USDT_PAIR ||
  "0x9793d47dd47024ac4e1f17988d2e92da53a94541";

export const PANCAKESWAP_ROUTER_ADDRESS =
  (process.env.NEXT_PUBLIC_PANCAKESWAP_ROUTER as `0x${string}`) ||
  "0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb";

export const BASE_WETH_ADDRESS =
  WETH_TOKEN_ADDRESS;

export const EPWX_DECIMALS = Number(process.env.NEXT_PUBLIC_EPWX_DECIMALS || 9);
export const EPWX_SWAP_SLIPPAGE_BPS = 600;
export const EPWX_SWAP_SLIPPAGE_PERCENT = EPWX_SWAP_SLIPPAGE_BPS / 100;

export function getEpwxPriceApiUrl() {
  return `${process.env.NEXT_PUBLIC_API_URL}/api/price/epwx`;
}

export async function fetchEpwxPriceData(): Promise<EpwxPriceData> {
  const response = await fetch(getEpwxPriceApiUrl(), { cache: "no-store" });
  const payload = await parseJsonResponse<{ data?: EpwxPriceData; error?: string }>(response, "Failed to fetch EPWX market data");

  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error || "Failed to fetch EPWX market data");
  }

  return payload.data as EpwxPriceData;
}

export function formatEpwxBalance(normalized: number) {
  if (!Number.isFinite(normalized) || normalized === 0) {
    return "0";
  }

  if (normalized >= 1) {
    return normalized.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  if (normalized >= 0.0001) {
    return normalized.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }

  if (normalized >= 0.00000001) {
    return normalized.toLocaleString(undefined, { maximumFractionDigits: 8 });
  }

  return "<0.00000001";
}