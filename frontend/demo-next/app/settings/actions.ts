"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_TOKEN_COOKIE, APPLICATION_ID_COOKIE } from "../lib/api";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30
};

export async function saveCredentials(formData: FormData) {
  const applicationId = String(formData.get("applicationId") || "").trim();
  const apiToken = String(formData.get("apiToken") || "").trim();

  if (!applicationId || !apiToken) {
    redirect("/settings?error=missing");
  }

  const cookieStore = cookies();
  cookieStore.set(APPLICATION_ID_COOKIE, applicationId, cookieOptions);
  cookieStore.set(API_TOKEN_COOKIE, apiToken, cookieOptions);

  redirect("/posts");
}

export async function clearCredentials() {
  const cookieStore = cookies();
  cookieStore.delete(APPLICATION_ID_COOKIE);
  cookieStore.delete(API_TOKEN_COOKIE);

  redirect("/settings?cleared=1");
}
