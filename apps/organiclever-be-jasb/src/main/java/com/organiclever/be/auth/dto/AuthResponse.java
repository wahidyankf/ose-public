package com.organiclever.be.auth.dto;

public record AuthResponse(String token, String type) {
    public static AuthResponse bearer(final String token) {
        return new AuthResponse(token, "Bearer");
    }
}
