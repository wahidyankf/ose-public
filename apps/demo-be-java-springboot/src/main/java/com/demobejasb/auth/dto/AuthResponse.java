package com.demobejasb.auth.dto;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType) {

    public static AuthResponse bearer(final String accessToken, final String refreshToken) {
        return new AuthResponse(accessToken, refreshToken, "Bearer");
    }
}
