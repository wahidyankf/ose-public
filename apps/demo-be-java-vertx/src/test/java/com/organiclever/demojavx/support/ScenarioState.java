package com.organiclever.demojavx.support;

import org.jspecify.annotations.Nullable;

/**
 * Per-scenario mutable state shared across Cucumber step definition classes via
 * PicoContainer constructor injection. Every field is reset before each scenario
 * by {@link com.organiclever.demojavx.integration.steps.CommonSteps#resetState}.
 */
public class ScenarioState {

    @Nullable
    private ServiceResponse lastResponse;
    @Nullable
    private String accessToken;
    @Nullable
    private String refreshToken;
    @Nullable
    private String password;
    @Nullable
    private String userId;
    @Nullable
    private String expenseId;
    @Nullable
    private String attachmentId;
    @Nullable
    private String adminAccessToken;
    @Nullable
    private String bobAccessToken;
    @Nullable
    private String bobExpenseId;

    public void reset() {
        lastResponse = null;
        accessToken = null;
        refreshToken = null;
        password = null;
        userId = null;
        expenseId = null;
        attachmentId = null;
        adminAccessToken = null;
        bobAccessToken = null;
        bobExpenseId = null;
    }

    @Nullable
    public ServiceResponse getLastResponse() {
        return lastResponse;
    }

    public void setLastResponse(ServiceResponse response) {
        this.lastResponse = response;
    }

    @Nullable
    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String token) {
        this.accessToken = token;
    }

    @Nullable
    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String token) {
        this.refreshToken = token;
    }

    @Nullable
    public String getPassword() {
        return password;
    }

    public void setPassword(String pwd) {
        this.password = pwd;
    }

    @Nullable
    public String getUserId() {
        return userId;
    }

    public void setUserId(String id) {
        this.userId = id;
    }

    @Nullable
    public String getExpenseId() {
        return expenseId;
    }

    public void setExpenseId(String id) {
        this.expenseId = id;
    }

    @Nullable
    public String getAttachmentId() {
        return attachmentId;
    }

    public void setAttachmentId(String id) {
        this.attachmentId = id;
    }

    @Nullable
    public String getAdminAccessToken() {
        return adminAccessToken;
    }

    public void setAdminAccessToken(String token) {
        this.adminAccessToken = token;
    }

    @Nullable
    public String getBobAccessToken() {
        return bobAccessToken;
    }

    public void setBobAccessToken(String token) {
        this.bobAccessToken = token;
    }

    @Nullable
    public String getBobExpenseId() {
        return bobExpenseId;
    }

    public void setBobExpenseId(String id) {
        this.bobExpenseId = id;
    }
}
