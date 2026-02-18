export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export type ApiAuth = {
  applicationId: string;
  token: string;
};

function maskToken(token: string): string {
  if (token.length <= 10) {
    return "***";
  }
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export async function apiFetch<T>(path: string, auth: ApiAuth): Promise<T> {
  const url = `${apiBaseUrl}${path}`;
  const headers = {
    "x-app-id": auth.applicationId,
    "x-application-token": auth.token,
    Authorization: `Bearer ${auth.token}`
  };

  console.log("[contentplatform:req]", {
    method: "GET",
    url,
    headers: {
      "x-app-id": headers["x-app-id"],
      "x-application-token": maskToken(headers["x-application-token"])
    }
  });

  const response = await fetch(url, {
    headers,
    next: { revalidate: 30 }
  });

  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();
  let parsedBody: unknown = rawBody;
  if (contentType.includes("application/json") && rawBody.trim().length > 0) {
    parsedBody = JSON.parse(rawBody);
  }

  console.log("[contentplatform:res]", {
    url,
    status: response.status,
    ok: response.ok,
    body: parsedBody
  });

  if (!response.ok) {
    const errorMessage =
      typeof parsedBody === "object" &&
      parsedBody !== null &&
      "message" in parsedBody &&
      typeof (parsedBody as { message?: unknown }).message === "string"
        ? (parsedBody as { message: string }).message
        : "Unknown error";
    throw new Error(`Request failed: ${response.status} ${errorMessage} (${url})`);
  }

  return parsedBody as T;
}

export function getSingleParam(value: string | string[] | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = Array.isArray(value) ? value[0] : value;
  const trimmed = normalized.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
