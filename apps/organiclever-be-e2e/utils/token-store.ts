// Named token map: email -> access token
const tokenMap = new Map<string, string>();
// Named refresh token map: email -> refresh token
const refreshTokenMap = new Map<string, string>();

export function setTokenForUser(email: string, token: string): void {
  tokenMap.set(email, token);
}

export function getTokenForUser(email: string): string {
  const token = tokenMap.get(email);
  if (!token) {
    throw new Error(`No token stored for user "${email}". A login step must run first.`);
  }
  return token;
}

export function setRefreshTokenForUser(email: string, token: string): void {
  refreshTokenMap.set(email, token);
}

export function getRefreshTokenForUser(email: string): string {
  const token = refreshTokenMap.get(email);
  if (!token) {
    throw new Error(`No refresh token stored for user "${email}". A login step must run first.`);
  }
  return token;
}

export function clearAll(): void {
  tokenMap.clear();
  refreshTokenMap.clear();
}
