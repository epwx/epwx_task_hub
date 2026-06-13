export const TEMPORARY_LIVE_DATA_MESSAGE = 'Live data is temporarily unavailable right now. Please try again in a few minutes.';

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
      throw new Error(rateLimited ? TEMPORARY_LIVE_DATA_MESSAGE : fallbackMessage);
    }

    return {} as T;
  }

  let payload: unknown;

  try {
    payload = JSON.parse(bodyText);
  } catch {
    throw new Error(rateLimited ? TEMPORARY_LIVE_DATA_MESSAGE : fallbackMessage);
  }

  if (!response.ok) {
    throw new Error(rateLimited ? TEMPORARY_LIVE_DATA_MESSAGE : extractPayloadError(payload) || fallbackMessage);
  }

  return payload as T;
}