package com.organiclever.demojavx.domain.model;

import java.time.Instant;
import org.jspecify.annotations.Nullable;

public record User(
        @Nullable String id,
        String username,
        String email,
        @Nullable String displayName,
        String passwordHash,
        String role,
        String status,
        int failedLoginAttempts,
        Instant createdAt) {

    public static final String ROLE_USER = "USER";
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_DISABLED = "DISABLED";
    public static final String STATUS_LOCKED = "LOCKED";

    public User withId(String newId) {
        return new User(newId, username, email, displayName, passwordHash, role, status,
                failedLoginAttempts, createdAt);
    }

    public User withStatus(String newStatus) {
        return new User(id, username, email, displayName, passwordHash, role, newStatus,
                failedLoginAttempts, createdAt);
    }

    public User withFailedLoginAttempts(int attempts) {
        return new User(id, username, email, displayName, passwordHash, role, status,
                attempts, createdAt);
    }

    public User withDisplayName(@Nullable String newDisplayName) {
        return new User(id, username, email, newDisplayName, passwordHash, role, status,
                failedLoginAttempts, createdAt);
    }

    public User withPasswordHash(String newHash) {
        return new User(id, username, email, displayName, newHash, role, status,
                failedLoginAttempts, createdAt);
    }

    public User withRole(String newRole) {
        return new User(id, username, email, displayName, passwordHash, newRole, status,
                failedLoginAttempts, createdAt);
    }
}
