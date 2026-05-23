export const apiBaseUrl =
  process.env.CONTENT_PLATFORM_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3000";

export type ApiAuth = {
  applicationId: string;
  token: string;
};

export function getServerApiAuth(): ApiAuth {
  const applicationId = process.env.CONTENT_PLATFORM_APPLICATION_ID?.trim();
  const token = process.env.CONTENT_PLATFORM_API_TOKEN?.trim();

  if (!applicationId || !token) {
    throw new Error(
      "Missing CONTENT_PLATFORM_APPLICATION_ID or CONTENT_PLATFORM_API_TOKEN server environment variable."
    );
  }

  return { applicationId, token };
}

function maskToken(token: string): string {
  if (token.length <= 10) {
    return "***";
  }
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export async function apiFetch<T>(path: string, auth: ApiAuth): Promise<T> {
  const url = `${apiBaseUrl}${path}`;
  const headers = {
    "X-Application-Id": auth.applicationId,
    "X-Application-Token": auth.token
  };

  console.log("[contentplatform:req]", {
    method: "GET",
    url,
    headers: {
      "X-Application-Id": headers["X-Application-Id"],
      "X-Application-Token": maskToken(headers["X-Application-Token"])
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
