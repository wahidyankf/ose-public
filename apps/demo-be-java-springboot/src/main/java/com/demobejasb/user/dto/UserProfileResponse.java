package com.demobejasb.user.dto;

import com.demobejasb.auth.model.User;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record UserProfileResponse(
        UUID id,
        String username,
        @Nullable String email,
        @Nullable String displayName,
        String status,
        String role) {

    public static UserProfileResponse from(final User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getStatus(),
                user.getRole());
    }
}
