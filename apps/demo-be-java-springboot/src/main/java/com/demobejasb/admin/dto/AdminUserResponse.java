package com.demobejasb.admin.dto;

import com.demobejasb.auth.model.User;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String username,
        String email,
        String status,
        String role,
        String displayName) {

    public static AdminUserResponse from(final User user) {
        String email = user.getEmail() != null ? user.getEmail() : "";
        String displayName =
                user.getDisplayName() != null ? user.getDisplayName() : user.getUsername();
        return new AdminUserResponse(
                user.getId(),
                user.getUsername(),
                email,
                user.getStatus(),
                user.getRole(),
                displayName);
    }
}
