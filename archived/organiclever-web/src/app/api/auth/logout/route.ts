import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST(request: Request) {
  // Clear the auth cookie by setting it to an empty value and expiring it.
  // Use the same secure/sameSite attributes as the login route so browsers
  // (especially WebKit) match and overwrite the existing cookie correctly.
  const requestUrl = new URL(request.url);
  const cookie = serialize("auth_token", "", {
    httpOnly: true,
    secure: requestUrl.protocol === "https:",
    sameSite: "lax",
    maxAge: -1, // Expire the cookie immediately
    path: "/",
  });

  return NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: { "Set-Cookie": cookie },
    },
  );
}
