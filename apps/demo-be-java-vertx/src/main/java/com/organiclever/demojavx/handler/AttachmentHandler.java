package com.organiclever.demojavx.handler;

import com.organiclever.demojavx.domain.model.Attachment;
import com.organiclever.demojavx.domain.model.Expense;
import com.organiclever.demojavx.domain.validation.DomainException;
import com.organiclever.demojavx.domain.validation.ExpenseValidator;
import com.organiclever.demojavx.repository.AttachmentRepository;
import com.organiclever.demojavx.repository.ExpenseRepository;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.FileUpload;
import io.vertx.ext.web.RoutingContext;
import java.time.Instant;
import java.util.List;

public class AttachmentHandler implements Handler<RoutingContext> {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final ExpenseRepository expenseRepo;
    private final AttachmentRepository attachmentRepo;
    private final String action;

    public AttachmentHandler(String action, ExpenseRepository expenseRepo,
            AttachmentRepository attachmentRepo) {
        this.action = action;
        this.expenseRepo = expenseRepo;
        this.attachmentRepo = attachmentRepo;
    }

    @Override
    public void handle(RoutingContext ctx) {
        switch (action) {
            case "upload" -> handleUpload(ctx);
            case "list" -> handleList(ctx);
            case "delete" -> handleDelete(ctx);
            default -> ctx.fail(500);
        }
    }

    private void handleUpload(RoutingContext ctx) {
        String userId = ctx.get("userId");
        String expenseId = ctx.pathParam("id");

        if (userId == null || expenseId == null) {
            ctx.fail(400);
            return;
        }
        expenseRepo.findById(expenseId)
                .compose(expOpt -> {
                    if (expOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(404, "Expense not found"));
                    }
                    Expense exp = expOpt.get();
                    if (!exp.userId().equals(userId)) {
                        return Future.failedFuture(new DomainException(403, "Forbidden"));
                    }

                    List<FileUpload> uploads = ctx.fileUploads();
                    if (uploads.isEmpty()) {
                        return Future.failedFuture(new DomainException(400, "No file uploaded"));
                    }

                    FileUpload upload = uploads.get(0);
                    String contentType = upload.contentType();
                    long size = upload.size();

                    if (size > MAX_FILE_SIZE) {
                        return Future.failedFuture(new FileSizeLimitException(
                                "File exceeds maximum size of 10MB"));
                    }

                    if (!ExpenseValidator.isSupportedAttachmentType(contentType)) {
                        return Future.failedFuture(new UnsupportedMediaTypeException(
                                "Unsupported file type: " + contentType));
                    }

                    Attachment attachment = new Attachment(null, expenseId, userId,
                            upload.fileName(), contentType, size, new byte[0], Instant.now());
                    return attachmentRepo.save(attachment);
                })
                .onSuccess(attachment -> {
                    JsonObject resp = buildAttachmentResponse(attachment);
                    ctx.response()
                            .setStatusCode(201)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleList(RoutingContext ctx) {
        String userId = ctx.get("userId");
        String expenseId = ctx.pathParam("id");

        if (userId == null || expenseId == null) {
            ctx.fail(400);
            return;
        }
        expenseRepo.findById(expenseId)
                .compose(expOpt -> {
                    if (expOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(404, "Expense not found"));
                    }
                    Expense exp = expOpt.get();
                    if (!exp.userId().equals(userId)) {
                        return Future.failedFuture(new DomainException(403, "Forbidden"));
                    }
                    return attachmentRepo.findByExpenseId(expenseId);
                })
                .onSuccess(attachments -> {
                    JsonArray arr = new JsonArray();
                    for (Attachment a : attachments) {
                        arr.add(buildAttachmentResponse(a));
                    }
                    JsonObject resp = new JsonObject().put("attachments", arr);
                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleDelete(RoutingContext ctx) {
        String userId = ctx.get("userId");
        String expenseId = ctx.pathParam("id");
        String attachmentId = ctx.pathParam("aid");

        if (userId == null || expenseId == null || attachmentId == null) {
            ctx.fail(400);
            return;
        }
        expenseRepo.findById(expenseId)
                .compose(expOpt -> {
                    if (expOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(404, "Expense not found"));
                    }
                    Expense exp = expOpt.get();
                    if (!exp.userId().equals(userId)) {
                        return Future.failedFuture(new DomainException(403, "Forbidden"));
                    }
                    return attachmentRepo.findById(attachmentId);
                })
                .compose(attOpt -> {
                    if (attOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(404, "Attachment not found"));
                    }
                    return attachmentRepo.deleteById(attachmentId);
                })
                .onSuccess(ignored -> ctx.response().setStatusCode(204).end())
                .onFailure(ctx::fail);
    }

    private JsonObject buildAttachmentResponse(Attachment attachment) {
        return new JsonObject()
                .put("id", attachment.id())
                .put("filename", attachment.filename())
                .put("content_type", attachment.contentType())
                .put("size", attachment.size())
                .put("url", "/api/v1/expenses/" + attachment.expenseId()
                        + "/attachments/" + attachment.id());
    }

    public static class FileSizeLimitException extends RuntimeException {
        public FileSizeLimitException(String message) {
            super(message);
        }
    }

    public static class UnsupportedMediaTypeException extends RuntimeException {
        public UnsupportedMediaTypeException(String message) {
            super(message);
        }
    }
}
