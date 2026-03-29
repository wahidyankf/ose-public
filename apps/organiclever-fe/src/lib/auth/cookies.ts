import type { NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "organiclever_access_token";
const REFRESH_TOKEN_COOKIE = "organiclever_refresh_token";

const COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: "lax" as const,
  path: "/",
};

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_BASE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...COOKIE_BASE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...COOKIE_BASE_OPTIONS,
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    ...COOKIE_BASE_OPTIONS,
    maxAge: 0,
  });
}
