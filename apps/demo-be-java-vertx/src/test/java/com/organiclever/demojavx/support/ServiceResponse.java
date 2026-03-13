package com.organiclever.demojavx.support;

import io.vertx.core.json.JsonObject;
import org.jspecify.annotations.Nullable;

/**
 * Lightweight value object representing an HTTP-like response returned by
 * {@link DirectCallService}. It holds a numeric status code and an optional
 * JSON body so that Cucumber step assertions can be written against it in the
 * same way as they were against a real {@code HttpResponse}.
 */
public final class ServiceResponse {

    private final int statusCode;
    @Nullable
    private final JsonObject body;

    public ServiceResponse(int statusCode, @Nullable JsonObject body) {
        this.statusCode = statusCode;
        this.body = body;
    }

    public static ServiceResponse of(int statusCode) {
        return new ServiceResponse(statusCode, null);
    }

    public static ServiceResponse of(int statusCode, JsonObject body) {
        return new ServiceResponse(statusCode, body);
    }

    public int statusCode() {
        return statusCode;
    }

    @Nullable
    public JsonObject body() {
        return body;
    }

    @Override
    public String toString() {
        return "ServiceResponse{statusCode=" + statusCode + ", body=" + body + "}";
    }
}
