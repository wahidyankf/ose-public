import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "../api/admin";
import type { DisableRequest } from "../api/types";

export function useAdminUsers(page = 0, size = 20, search?: string) {
  return useQuery({
    queryKey: ["adminUsers", page, size, search],
    queryFn: () => adminApi.listUsers(page, size, search),
  });
}

export function useDisableUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: DisableRequest }) => adminApi.disableUser(userId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
}

export function useEnableUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.enableUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
}

export function useUnlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.unlockUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });
}

export function useForcePasswordReset() {
  return useMutation({
    mutationFn: (userId: string) => adminApi.forcePasswordReset(userId),
  });
}
