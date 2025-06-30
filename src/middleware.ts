import { NextResponse, type NextRequest } from "next/server";
// import axios from "axios"; // No longer needed
import { Session } from "./lib/better-auth/auth-types";

// Example: parse session from cookie (adjust to your session format)
function getMiddlewareSession(req: NextRequest): Session | null {
  const cookie = req.cookies.get("session")?.value;
  if (!cookie) return null;
  try {
    // If using JWT or JSON, decode here
    return JSON.parse(Buffer.from(cookie, "base64").toString()) as Session;
  } catch {
    return null;
  }
}

export default function authMiddleware(req: NextRequest) {
  const session = getMiddlewareSession(req);
  // You can now use `session` for auth logic

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};