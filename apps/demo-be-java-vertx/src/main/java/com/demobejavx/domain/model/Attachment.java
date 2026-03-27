package com.demobejavx.domain.model;

import java.time.Instant;
import org.jspecify.annotations.Nullable;

public record Attachment(
        @Nullable String id,
        String expenseId,
        String filename,
        String contentType,
        long size,
        byte[] data,
        Instant createdAt) {

    public Attachment withId(String newId) {
        return new Attachment(newId, expenseId, filename, contentType, size, data,
                createdAt);
    }
}
