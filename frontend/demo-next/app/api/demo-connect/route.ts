import { NextRequest, NextResponse } from "next/server";
import { API_TOKEN_COOKIE, APPLICATION_ID_COOKIE } from "../../lib/api";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { applicationId?: string; token?: string } | null;
  const applicationId = body?.applicationId?.trim();
  const token = body?.token?.trim();
  if (!applicationId || !token || applicationId.length > 80 || token.length > 300) return NextResponse.json({ message: "Invalid demo credentials." }, { status: 400 });
  const response = NextResponse.json({ ok: true });
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: 12 * 60 * 60, path: "/" };
  response.cookies.set(APPLICATION_ID_COOKIE, applicationId, options);
  response.cookies.set(API_TOKEN_COOKIE, token, options);
  return response;
}
