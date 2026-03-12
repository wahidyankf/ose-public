export interface Attachment {
  readonly id: string;
  readonly expenseId: string;
  readonly userId: string;
  readonly filename: string;
  readonly contentType: string;
  readonly size: number;
  readonly data: Buffer;
  readonly createdAt: Date;
}

export interface CreateAttachmentData {
  readonly expenseId: string;
  readonly userId: string;
  readonly filename: string;
  readonly contentType: string;
  readonly size: number;
  readonly data: Buffer;
}

export const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;

export type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

export function isAllowedContentType(value: string): value is AllowedContentType {
  return ALLOWED_CONTENT_TYPES.includes(value as AllowedContentType);
}

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
