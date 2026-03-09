package com.organiclever.be.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank
    @Size(min = 5, max = 50)
    @Pattern(
        regexp = "^[a-zA-Z0-9_]{5,50}$",
        message = "Username must contain only letters, digits, or underscores")
    String username,

    @NotBlank
    @Size(min = 8, max = 128)
    @Pattern(
        regexp =
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\,.<>/?]).{8,128}$",
        message =
            "Password must contain at least one uppercase letter, one lowercase letter,"
                + " one digit, and one special character")
    String password) {}
