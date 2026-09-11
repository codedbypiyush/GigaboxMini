type RequestOptions = {
  signal?: AbortSignal;
};

/**
 * Thin GET helper for DummyJSON.
 * Pass an AbortSignal from search so stale requests can be cancelled.
 */
export async function apiGet<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {Accept: 'application/json'},
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
