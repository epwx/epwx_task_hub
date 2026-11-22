import { API_BASE_URL } from './api';

export type MobileUser = {
  id: number;
  walletAddress: string;
  role?: string;
  totalEarned?: string;
  tasksCompleted?: number;
};

export type WalletChallenge = {
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  domain: string;
  chainId: number;
  message: string;
};

type ConnectResponse = {
  success: boolean;
  data: {
    user: MobileUser;
    token: string;
  };
};

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof body?.error === 'string' ? body.error : `EPWX authentication failed (${response.status}).`;
    throw new Error(message);
  }

  return body as T;
}

export function requestWalletChallenge(walletAddress: string) {
  return jsonRequest<WalletChallenge>('/api/auth/nonce', {
    method: 'POST',
    body: JSON.stringify({ walletAddress, chainId: 8453 }),
  });
}

export function connectWallet(challenge: WalletChallenge, walletAddress: string, signature: string) {
  return jsonRequest<ConnectResponse>('/api/auth/connect', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress,
      signature,
      ...challenge,
    }),
  });
}

export async function getCurrentUser(token: string) {
  return jsonRequest<{ success: boolean; data: MobileUser }>('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
