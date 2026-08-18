import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ adminUrl: process.env.ADMIN_PUBLIC_URL || "http://localhost:3002" });
}
