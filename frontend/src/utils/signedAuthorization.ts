type SignMessage = (args: { message: string }) => Promise<`0x${string}`>;

type Authorization = {
  wallet: string;
  issuedAt: string;
  nonce: string;
  signature: `0x${string}`;
};

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function createNonce() {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function createTaskSubmissionAuthorization({
  wallet,
  campaignId,
  twitterUsername,
  signMessage,
}: {
  wallet: string;
  campaignId: number;
  twitterUsername: string;
  signMessage: SignMessage;
}): Promise<Authorization> {
  const issuedAt = new Date().toISOString();
  const nonce = createNonce();
  const normalizedWallet = wallet.toLowerCase();
  const normalizedUsername = twitterUsername.trim().replace(/^@/, "").toLowerCase();
  const message = [
    "EPWX Task Submission",
    `Wallet: ${normalizedWallet}`,
    `Campaign: ${campaignId}`,
    `Twitter: ${normalizedUsername}`,
    `Issued At: ${issuedAt}`,
    `Nonce: ${nonce}`,
  ].join("\n");
  const signature = await signMessage({ message });
  return { wallet: normalizedWallet, issuedAt, nonce, signature };
}

export async function createAdminClaimAuthorization({
  wallet,
  claimId,
  action,
  status = "",
  reason = "",
  signMessage,
}: {
  wallet: string;
  claimId: string | number;
  action: "mark-status" | "settle";
  status?: string;
  reason?: string;
  signMessage: SignMessage;
}): Promise<Authorization> {
  const issuedAt = new Date().toISOString();
  const nonce = createNonce();
  const normalizedWallet = wallet.toLowerCase();
  const reasonHash = await sha256(reason.trim());
  const message = [
    "EPWX Admin Claim Action",
    `Wallet: ${normalizedWallet}`,
    `Claim: ${claimId}`,
    `Action: ${action}`,
    `Status: ${status}`,
    `Reason SHA-256: ${reasonHash}`,
    `Issued At: ${issuedAt}`,
    `Nonce: ${nonce}`,
  ].join("\n");
  const signature = await signMessage({ message });
  return { wallet: normalizedWallet, issuedAt, nonce, signature };
}

export async function adminAuthorizedFetch({
  url,
  wallet,
  signMessage,
  init = {},
}: {
  url: string;
  wallet: string;
  signMessage: SignMessage;
  init?: RequestInit;
}) {
  const issuedAt = new Date().toISOString();
  const nonce = createNonce();
  const method = String(init.method || "GET").toUpperCase();
  const normalizedWallet = wallet.toLowerCase();
  const body = method === "GET" || method === "HEAD" ? "" : String(init.body || "");
  const bodyHash = await sha256(body);
  const message = [
    "EPWX Administrative Request",
    `Wallet: ${normalizedWallet}`,
    `Method: ${method}`,
    `Path: ${url}`,
    `Body SHA-256: ${bodyHash}`,
    `Issued At: ${issuedAt}`,
    `Nonce: ${nonce}`,
  ].join("\n");
  const signature = await signMessage({ message });
  const headers = new Headers(init.headers);
  headers.set("x-admin-wallet", normalizedWallet);
  headers.set("x-admin-issued-at", issuedAt);
  headers.set("x-admin-nonce", nonce);
  headers.set("x-admin-signature", signature);
  return fetch(url, { ...init, headers });
}

export async function createReferralAuthorization({
  referrerWallet,
  referredWallet,
  signMessage,
}: {
  referrerWallet: string;
  referredWallet: string;
  signMessage: SignMessage;
}) {
  const issuedAt = new Date().toISOString();
  const nonce = createNonce();
  const normalizedReferrer = referrerWallet.toLowerCase();
  const normalizedReferred = referredWallet.toLowerCase();
  const message = [
    "EPWX Wallet Referral",
    `Referrer: ${normalizedReferrer}`,
    `Referred Wallet: ${normalizedReferred}`,
    `Issued At: ${issuedAt}`,
    `Nonce: ${nonce}`,
  ].join("\n");
  const signature = await signMessage({ message });
  return {
    wallet: normalizedReferred,
    issuedAt,
    nonce,
    signature,
  };
}
