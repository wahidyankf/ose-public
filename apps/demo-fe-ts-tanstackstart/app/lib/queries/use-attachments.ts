import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as attachmentsApi from "../api/attachments";

export function useAttachments(expenseId: string) {
  return useQuery({
    queryKey: ["attachments", expenseId],
    queryFn: () => attachmentsApi.listAttachments(expenseId),
    enabled: !!expenseId,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, file }: { expenseId: string; file: File }) =>
      attachmentsApi.uploadAttachment(expenseId, file),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["attachments", variables.expenseId],
      });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, attachmentId }: { expenseId: string; attachmentId: string }) =>
      attachmentsApi.deleteAttachment(expenseId, attachmentId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["attachments", variables.expenseId],
      });
    },
  });
}
