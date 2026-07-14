export const TEMPORARY_LIVE_DATA_MESSAGE = 'The entire homepage is temporarily unavailable. Please try again in a few minutes.';
export const RATE_LIMITED_MESSAGE = 'Too many requests. Please wait a minute and try again.';

type ErrorPayload = {
  error?: string;
  message?: string;
};

function isRateLimitedResponse(response: Response, bodyText: string) {
  return response.status === 429 || /too many requests|rate limit/i.test(bodyText);
}

function extractPayloadError(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as ErrorPayload;
  return candidate.error || candidate.message || null;
}

export async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const bodyText = await response.text();
  const rateLimited = isRateLimitedResponse(response, bodyText);

  if (!bodyText) {
    if (!response.ok) {
      throw new Error(rateLimited ? RATE_LIMITED_MESSAGE : fallbackMessage);
    }

    return {} as T;
  }

  let payload: unknown;

  try {
    payload = JSON.parse(bodyText);
  } catch {
    throw new Error(rateLimited ? RATE_LIMITED_MESSAGE : fallbackMessage);
  }

  if (!response.ok) {
    const payloadError = extractPayloadError(payload);
    throw new Error(rateLimited ? payloadError || RATE_LIMITED_MESSAGE : payloadError || fallbackMessage);
  }

  return payload as T;
}