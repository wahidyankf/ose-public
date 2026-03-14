import { useQuery } from "@tanstack/react-query";
import * as tokensApi from "../api/tokens";
import { getAccessToken } from "../api/client";

export function useTokenClaims() {
  return useQuery({
    queryKey: ["tokenClaims"],
    queryFn: () => {
      const token = getAccessToken();
      if (!token) throw new Error("No access token");
      return tokensApi.decodeTokenClaims(token);
    },
    retry: false,
  });
}

export function useJwks() {
  return useQuery({
    queryKey: ["jwks"],
    queryFn: () => tokensApi.getJwks(),
  });
}
