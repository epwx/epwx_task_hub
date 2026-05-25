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

export const USDT_TOKEN_ADDRESS =
  (process.env.NEXT_PUBLIC_USDT_TOKEN as `0x${string}`) ||
  "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";

export const EPWX_USDT_PAIR_ADDRESS =
  process.env.NEXT_PUBLIC_EPWX_USDT_PAIR || "Not configured";

export const PANCAKESWAP_ROUTER_ADDRESS =
  (process.env.NEXT_PUBLIC_PANCAKESWAP_ROUTER as `0x${string}`) ||
  "0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb";

export const BASE_WETH_ADDRESS =
  (process.env.NEXT_PUBLIC_BASE_WETH as `0x${string}`) ||
  "0x4200000000000000000000000000000000000006";

export const EPWX_DECIMALS = Number(process.env.NEXT_PUBLIC_EPWX_DECIMALS || 9);
export const EPWX_SWAP_SLIPPAGE_BPS = 600;
export const EPWX_SWAP_SLIPPAGE_PERCENT = EPWX_SWAP_SLIPPAGE_BPS / 100;

export function getEpwxPriceApiUrl() {
  return `${process.env.NEXT_PUBLIC_API_URL}/api/price/epwx`;
}

export async function fetchEpwxPriceData(): Promise<EpwxPriceData> {
  const response = await fetch(getEpwxPriceApiUrl(), { cache: "no-store" });
  const payload = await response.json();

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