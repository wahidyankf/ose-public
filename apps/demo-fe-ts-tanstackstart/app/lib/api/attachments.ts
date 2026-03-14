import { apiFetch, getAccessToken } from "./client";
import type { Attachment } from "./types";

export function listAttachments(expenseId: string): Promise<Attachment[]> {
  return apiFetch<Attachment[]>(`/api/v1/expenses/${expenseId}/attachments`);
}

export async function uploadAttachment(expenseId: string, file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api/v1/expenses/${expenseId}/attachments`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(`Upload failed: ${res.status} ${JSON.stringify(body)}`);
  }

  return res.json() as Promise<Attachment>;
}

export function deleteAttachment(expenseId: string, attachmentId: string): Promise<void> {
  return apiFetch(`/api/v1/expenses/${expenseId}/attachments/${attachmentId}`, { method: "DELETE" });
}
