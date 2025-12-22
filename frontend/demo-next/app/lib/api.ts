export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    next: { revalidate: 30 }
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
