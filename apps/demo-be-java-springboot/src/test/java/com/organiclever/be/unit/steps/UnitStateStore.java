package com.organiclever.be.unit.steps;

import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;

/**
 * Holds per-scenario state for unit tests: the last service response or exception, plus token and
 * ID context. Mirrors the role of ResponseStore + TokenStore in the integration tests but without
 * any HTTP/MockMvc dependency.
 */
@Component
@Scope("cucumber-glue")
public class UnitStateStore {

    /** The status code equivalent — derived from service outcome. */
    private int statusCode = 0;

    /** The last response object returned by a service call (may be null on error). */
    private @Nullable Object responseBody;

    /** The last exception thrown by a service call (null on success). */
    private @Nullable Exception lastException;

    /** The stored JWT access token (simulated). */
    private @Nullable String accessToken;

    /** The stored raw refresh token. */
    private @Nullable String refreshToken;

    /** The original refresh token before rotation. */
    private @Nullable String originalRefreshToken;

    /** The admin's JWT access token. */
    private @Nullable String adminToken;

    /** Alice's user ID. */
    private @Nullable UUID aliceId;

    /** Admin user ID. */
    private @Nullable UUID adminUserId;

    /** The last created expense ID. */
    private @Nullable UUID expenseId;

    /** The last created attachment ID. */
    private @Nullable UUID attachmentId;

    /** Bob's expense ID (for cross-user tests). */
    private @Nullable UUID bobExpenseId;

    /** The logged-in username for the current scenario context. */
    private @Nullable String currentUsername;

    public void setStatusCode(final int statusCode) {
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setResponseBody(final @Nullable Object responseBody) {
        this.responseBody = responseBody;
    }

    public @Nullable Object getResponseBody() {
        return responseBody;
    }

    public void setLastException(final @Nullable Exception lastException) {
        this.lastException = lastException;
    }

    public @Nullable Exception getLastException() {
        return lastException;
    }

    public void setAccessToken(final @Nullable String accessToken) {
        this.accessToken = accessToken;
    }

    public @Nullable String getAccessToken() {
        return accessToken;
    }

    public void setRefreshToken(final @Nullable String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public @Nullable String getRefreshToken() {
        return refreshToken;
    }

    public void setOriginalRefreshToken(final @Nullable String originalRefreshToken) {
        this.originalRefreshToken = originalRefreshToken;
    }

    public @Nullable String getOriginalRefreshToken() {
        return originalRefreshToken;
    }

    public void setAdminToken(final @Nullable String adminToken) {
        this.adminToken = adminToken;
    }

    public @Nullable String getAdminToken() {
        return adminToken;
    }

    public void setAliceId(final @Nullable UUID aliceId) {
        this.aliceId = aliceId;
    }

    public @Nullable UUID getAliceId() {
        return aliceId;
    }

    public void setAdminUserId(final @Nullable UUID adminUserId) {
        this.adminUserId = adminUserId;
    }

    public @Nullable UUID getAdminUserId() {
        return adminUserId;
    }

    public void setExpenseId(final @Nullable UUID expenseId) {
        this.expenseId = expenseId;
    }

    public @Nullable UUID getExpenseId() {
        return expenseId;
    }

    public void setAttachmentId(final @Nullable UUID attachmentId) {
        this.attachmentId = attachmentId;
    }

    public @Nullable UUID getAttachmentId() {
        return attachmentId;
    }

    public void setBobExpenseId(final @Nullable UUID bobExpenseId) {
        this.bobExpenseId = bobExpenseId;
    }

    public @Nullable UUID getBobExpenseId() {
        return bobExpenseId;
    }

    public void setCurrentUsername(final @Nullable String currentUsername) {
        this.currentUsername = currentUsername;
    }

    public @Nullable String getCurrentUsername() {
        return currentUsername;
    }

    /** Clears all state between scenarios. */
    public void clear() {
        statusCode = 0;
        responseBody = null;
        lastException = null;
        accessToken = null;
        refreshToken = null;
        originalRefreshToken = null;
        adminToken = null;
        aliceId = null;
        adminUserId = null;
        expenseId = null;
        attachmentId = null;
        bobExpenseId = null;
        currentUsername = null;
    }
}
