export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://tasks.epowex.com').replace(/\/$/, '');

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`EPWX API request failed (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

export type DailyClaimRecord = {
  id: number;
  wallet: string;
  claimedAt: string;
  amount: string;
  status: 'pending' | 'paid' | 'failed';
  txHash: string | null;
  streakDay?: number;
  drawEntries?: number;
};

export type DailyClaimEmailEligibility = {
  enrolled: boolean;
  verified: boolean;
  blocked?: boolean;
  code?: string;
  error?: string;
};

export type DailyClaimResult = {
  success: boolean;
  message?: string;
  amount?: string;
  status?: 'pending' | 'paid' | 'failed';
  txHash?: string | null;
  streak?: {
    day: number;
    drawEntries: number;
    continued: boolean;
  };
  error?: string;
  code?: string;
};

export async function getDailyClaimHistory(wallet: string, limit = 10) {
  return request<{ claims: DailyClaimRecord[] }>(
    `/api/epwx/daily-claims?wallet=${encodeURIComponent(wallet)}&limit=${limit}`,
  );
}

export function getDailyClaimEmailEligibility(wallet: string) {
  return request<DailyClaimEmailEligibility>(
    `/api/epwx/daily-claim/email/eligibility?wallet=${encodeURIComponent(wallet)}`,
  );
}

export function getTelegramEligibility(wallet: string) {
  return request<{ verified: boolean }>(
    `/api/epwx/telegram-verified?wallet=${encodeURIComponent(wallet)}`,
  );
}

export async function enrollDailyClaimEmail(input: {
  wallet: string;
  email: string;
  signature: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/epwx/daily-claim/email/enroll`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...input,
      remindersEnabled: true,
      successEmailsEnabled: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    }),
  });
  const body = await response.json().catch(() => ({})) as {
    success?: boolean;
    message?: string;
    emailSent?: boolean;
    error?: string;
  };

  if (!response.ok || !body.success) {
    throw new Error(body.error || `Email enrollment failed (${response.status}).`);
  }

  return body;
}

export type DailyClaimEmailPreference = {
  enrolled: boolean;
  emailMasked?: string;
  verified?: boolean;
  remindersEnabled?: boolean;
  successEmailsEnabled?: boolean;
  unsubscribedAt?: string | null;
};

export async function getDailyClaimEmailStatus(wallet: string, signature: string) {
  const response = await fetch(`${API_BASE_URL}/api/epwx/daily-claim/email/status`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ wallet, signature }),
  });
  const body = await response.json().catch(() => ({})) as DailyClaimEmailPreference & { error?: string };
  if (!response.ok) throw new Error(body.error || 'Unable to load email settings.');
  return body;
}

export async function updateDailyClaimEmailPreferences(input: {
  wallet: string;
  signature: string;
  remindersEnabled: boolean;
  successEmailsEnabled: boolean;
}) {
  const response = await fetch(`${API_BASE_URL}/api/epwx/daily-claim/email/preferences`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({})) as {
    success?: boolean;
    message?: string;
    preference?: DailyClaimEmailPreference;
    error?: string;
  };
  if (!response.ok || !body.success) throw new Error(body.error || 'Unable to update email settings.');
  return body;
}

export async function submitDailyClaim(input: {
  wallet: string;
  signature: string;
  ageConfirmed: boolean;
  jurisdictionConfirmed: boolean;
}) {
  const response = await fetch(`${API_BASE_URL}/api/epwx/daily-claim`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({})) as DailyClaimResult;

  if (!response.ok || !body.success) {
    const error = new Error(body.error || `Daily claim failed (${response.status}).`);
    if (body.code) error.name = body.code;
    throw error;
  }

  return body;
}
