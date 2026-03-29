import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const verifyToken = async (token: string) => {
  console.log("Verifying token:", token);
  // TODO: Implement token verification logic here
  return true;
};

export async function GET() {
  const cookieStore = await cookies();
  const authTokenCookie = cookieStore.get("auth_token");

  if (!authTokenCookie) {
    return NextResponse.json({ isAuthenticated: false });
  }

  try {
    const decodedToken = await verifyToken(authTokenCookie.value);
    return NextResponse.json({ isAuthenticated: true, user: decodedToken });
  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.json({ isAuthenticated: false });
  }
}
