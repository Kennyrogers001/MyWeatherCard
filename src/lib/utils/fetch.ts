const rateLimitMap = new Map<string, number>();

type RetryFetchOptions = {
  retries?: number;
  baseDelayMs?: number;
  minIntervalMs?: number;
  cacheKey?: string;
  signal?: AbortSignal;
};

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function enforceRateLimit(cacheKey: string, minIntervalMs: number): Promise<void> {
  const now = Date.now();
  const previous = rateLimitMap.get(cacheKey) ?? 0;
  const elapsed = now - previous;

  if (elapsed < minIntervalMs) {
    await sleep(minIntervalMs - elapsed);
  }

  rateLimitMap.set(cacheKey, Date.now());
}

function backoffDelay(baseDelayMs: number, attempt: number): number {
  const jitter = Math.floor(Math.random() * 200);
  return baseDelayMs * 2 ** attempt + jitter;
}

export async function fetchJsonWithRetry<T>(
  url: string,
  {
    retries = 3,
    baseDelayMs = 300,
    minIntervalMs = 300,
    cacheKey = url,
    signal
  }: RetryFetchOptions = {}
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    await enforceRateLimit(cacheKey, minIntervalMs);

    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          Accept: "application/json"
        },
        cache: "no-store",
        signal
      });
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      await sleep(backoffDelay(baseDelayMs, attempt));
      continue;
    }

    if (response.ok) {
      return (await response.json()) as T;
    }

    if (!RETRYABLE_STATUSES.has(response.status) || attempt === retries) {
      throw new Error(`Request failed (${response.status}) for ${url}`);
    }

    await sleep(backoffDelay(baseDelayMs, attempt));
  }

  throw new Error(`Exhausted retries for ${url}`);
}
