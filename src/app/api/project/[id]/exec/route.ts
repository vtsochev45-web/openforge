import { NextResponse } from "next/server";

// Command execution is disabled on Vercel
export async function POST() {
  return NextResponse.json({
    success: false,
    error: "Command execution is disabled on Vercel. Download and run locally to use this feature.",
  });
}
