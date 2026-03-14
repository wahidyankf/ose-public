import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/auth";
import { setTokens, clearTokens, getRefreshToken } from "../api/client";
import type { LoginRequest, RegisterRequest } from "../api/types";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: authApi.getHealth,
    retry: false,
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (tokens) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
      void queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useRefreshToken() {
  return useMutation({
    mutationFn: () => {
      const token = getRefreshToken();
      if (!token) throw new Error("No refresh token");
      return authApi.refreshToken(token);
    },
    onSuccess: (tokens) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const token = getRefreshToken();
      if (!token) return Promise.resolve();
      return authApi.logout(token);
    },
    onSettled: () => {
      clearTokens();
      queryClient.clear();
    },
  });
}

export function useLogoutAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSettled: () => {
      clearTokens();
      queryClient.clear();
    },
  });
}
