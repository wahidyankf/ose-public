import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "../api/users";
import type { UpdateProfileRequest, ChangePasswordRequest } from "../api/types";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: usersApi.getCurrentUser,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => usersApi.updateProfile(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => usersApi.changePassword(data),
  });
}

export function useDeactivateAccount() {
  return useMutation({
    mutationFn: () => usersApi.deactivateAccount(),
  });
}
