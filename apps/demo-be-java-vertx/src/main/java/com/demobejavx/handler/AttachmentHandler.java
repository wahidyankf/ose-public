package com.demobejavx.handler;

import com.demobejavx.contracts.Attachment;
import com.demobejavx.domain.model.Expense;
import com.demobejavx.domain.validation.DomainException;
import com.demobejavx.domain.validation.ExpenseValidator;
import com.demobejavx.repository.AttachmentRepository;
import com.demobejavx.repository.ExpenseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.ext.web.FileUpload;
import io.vertx.ext.web.RoutingContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class AttachmentHandler implements Handler<RoutingContext> {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

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

                    com.demobejavx.domain.model.Attachment attachment =
                            new com.demobejavx.domain.model.Attachment(null, expenseId,
                                    upload.fileName(), contentType, size, new byte[0],
                                    Instant.now());
                    return attachmentRepo.save(attachment);
                })
                .onSuccess(attachment -> {
                    java.util.Map<String, Object> resp = buildUploadResponse(attachment);
                    AuthHandler.sendJson(ctx, 201, resp);
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
                    List<Attachment> items = new ArrayList<>();
                    for (com.demobejavx.domain.model.Attachment a : attachments) {
                        items.add(buildContractAttachment(a));
                    }
                    try {
                        java.util.Map<String, Object> wrapper = new java.util.HashMap<>();
                        wrapper.put("attachments", items);
                        String json = MAPPER.writeValueAsString(wrapper);
                        ctx.response()
                                .setStatusCode(200)
                                .putHeader("Content-Type", "application/json")
                                .end(json);
                    } catch (Exception e) {
                        ctx.fail(500);
                    }
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

    private Attachment buildContractAttachment(
            com.demobejavx.domain.model.Attachment attachment) {
        java.time.OffsetDateTime createdAt = attachment.createdAt() != null
                ? attachment.createdAt().atOffset(java.time.ZoneOffset.UTC)
                : java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC);
        return new Attachment()
                .id(attachment.id() != null ? attachment.id() : "")
                .filename(attachment.filename())
                .contentType(attachment.contentType())
                .size((int) attachment.size())
                .createdAt(createdAt);
    }

    private java.util.Map<String, Object> buildUploadResponse(
            com.demobejavx.domain.model.Attachment attachment) {
        java.util.Map<String, Object> resp = new java.util.LinkedHashMap<>();
        resp.put("id", attachment.id() != null ? attachment.id() : "");
        resp.put("filename", attachment.filename());
        resp.put("contentType", attachment.contentType());
        resp.put("size", (int) attachment.size());
        java.time.OffsetDateTime createdAt = attachment.createdAt() != null
                ? attachment.createdAt().atOffset(java.time.ZoneOffset.UTC)
                : java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC);
        resp.put("createdAt", createdAt);
        String expenseId = attachment.expenseId() != null ? attachment.expenseId() : "";
        String attachmentId = attachment.id() != null ? attachment.id() : "";
        resp.put("url",
                "/api/v1/expenses/" + expenseId + "/attachments/" + attachmentId + "/data");
        return resp;
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
