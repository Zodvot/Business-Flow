export async function request(path: string, method = 'GET', body?: object) {
  const response = await fetch('/api/' + path, method === 'GET' ? {} : {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
  });
  if (response.status === 401) window.dispatchEvent(new Event('session-expired'));
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Request failed. Please try again.');
  return result;
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Request failed.';
}
