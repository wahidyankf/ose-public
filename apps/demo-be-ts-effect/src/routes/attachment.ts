import { HttpRouter, HttpServerResponse, HttpServerRequest, Multipart } from "@effect/platform";
import { Effect, Stream, Chunk } from "effect";
import { AttachmentRepository } from "../infrastructure/db/attachment-repo.js";
import { ExpenseRepository } from "../infrastructure/db/expense-repo.js";
import { requireAuth } from "../auth/middleware.js";
import { NotFoundError, ForbiddenError, FileTooLargeError, UnsupportedMediaTypeError } from "../domain/errors.js";
import { isAllowedContentType, MAX_ATTACHMENT_SIZE } from "../domain/attachment.js";
import type { Attachment } from "../lib/api/types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function attachmentToResponse(attachment: any) {
  const id = attachment.id as string;
  const expenseId = attachment.expenseId as string;
  return {
    id,
    expense_id: expenseId,
    filename: attachment.filename as string,
    contentType: attachment.contentType as string,
    size: attachment.size as number,
    url: `/api/v1/expenses/${expenseId}/attachments/${id}`,
  };
}

const uploadAttachment = HttpRouter.params.pipe(
  Effect.flatMap((params) =>
    HttpServerRequest.HttpServerRequest.pipe(
      Effect.flatMap((req) =>
        Effect.gen(function* () {
          const claims = yield* requireAuth(req);
          const expenseId = params["expenseId"] ?? "";

          const expenseRepo = yield* ExpenseRepository;
          const expense = yield* expenseRepo.findById(expenseId);
          if (!expense) {
            return yield* Effect.fail(new NotFoundError({ resource: "Expense" }));
          }
          if (expense.userId !== claims.sub) {
            return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
          }

          // Check Content-Length header first to reject oversized files early
          const contentLength = parseInt((req.headers["content-length"] as string) ?? "0", 10);
          if (!isNaN(contentLength) && contentLength > MAX_ATTACHMENT_SIZE) {
            return yield* Effect.fail(new FileTooLargeError());
          }

          // Collect all file parts from the multipart stream
          const parts = yield* Stream.runCollect(req.multipartStream);
          const partArray = Chunk.toArray(parts);

          let filename = "upload";
          let contentType = "application/octet-stream";
          let fileData: Buffer | null = null;

          for (const part of partArray) {
            if (Multipart.isFile(part)) {
              filename = part.name !== "" ? part.name : "upload";
              contentType = part.contentType;
              const data = yield* part.contentEffect;
              fileData = Buffer.from(data);
            }
          }

          if (!fileData) {
            return yield* Effect.fail(new UnsupportedMediaTypeError());
          }

          if (!isAllowedContentType(contentType)) {
            return yield* Effect.fail(new UnsupportedMediaTypeError());
          }

          if (fileData.length > MAX_ATTACHMENT_SIZE) {
            return yield* Effect.fail(new FileTooLargeError());
          }

          const attachmentRepo = yield* AttachmentRepository;
          const attachment = yield* attachmentRepo.create({
            expenseId,
            userId: claims.sub,
            filename,
            contentType,
            size: fileData.length,
            data: fileData,
          });

          return yield* HttpServerResponse.json(attachmentToResponse(attachment) as unknown as Attachment, {
            status: 201,
          });
        }),
      ),
    ),
  ),
);

const listAttachments = HttpRouter.params.pipe(
  Effect.flatMap((params) =>
    HttpServerRequest.HttpServerRequest.pipe(
      Effect.flatMap((req) =>
        Effect.gen(function* () {
          const claims = yield* requireAuth(req);
          const expenseId = params["expenseId"] ?? "";

          const expenseRepo = yield* ExpenseRepository;
          const expense = yield* expenseRepo.findById(expenseId);
          if (!expense) {
            return yield* Effect.fail(new NotFoundError({ resource: "Expense" }));
          }
          if (expense.userId !== claims.sub) {
            return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
          }

          const attachmentRepo = yield* AttachmentRepository;
          const attachments = yield* attachmentRepo.findByExpenseId(expenseId);

          return yield* HttpServerResponse.json({
            attachments: attachments.map(attachmentToResponse),
          });
        }),
      ),
    ),
  ),
);

const deleteAttachment = HttpRouter.params.pipe(
  Effect.flatMap((params) =>
    HttpServerRequest.HttpServerRequest.pipe(
      Effect.flatMap((req) =>
        Effect.gen(function* () {
          const claims = yield* requireAuth(req);
          const expenseId = params["expenseId"] ?? "";
          const attachmentId = params["attachmentId"] ?? "";

          const expenseRepo = yield* ExpenseRepository;
          const expense = yield* expenseRepo.findById(expenseId);
          if (!expense) {
            return yield* Effect.fail(new NotFoundError({ resource: "Expense" }));
          }
          if (expense.userId !== claims.sub) {
            return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
          }

          const attachmentRepo = yield* AttachmentRepository;
          const attachment = yield* attachmentRepo.findById(attachmentId);
          if (!attachment) {
            return yield* Effect.fail(new NotFoundError({ resource: "Attachment" }));
          }
          if (attachment.userId !== claims.sub) {
            return yield* Effect.fail(new ForbiddenError({ reason: "Access denied" }));
          }

          yield* attachmentRepo.delete(attachmentId);
          return yield* HttpServerResponse.empty({ status: 204 });
        }),
      ),
    ),
  ),
);

export const attachmentRouter = HttpRouter.empty.pipe(
  HttpRouter.post("/api/v1/expenses/:expenseId/attachments", uploadAttachment),
  HttpRouter.get("/api/v1/expenses/:expenseId/attachments", listAttachments),
  HttpRouter.del("/api/v1/expenses/:expenseId/attachments/:attachmentId", deleteAttachment),
);
