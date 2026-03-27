package com.demobejasb.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "revoked_tokens")
public class RevokedToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "jti", nullable = false, unique = true, length = 255)
    private String jti;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "revoked_at", nullable = false)
    private Instant revokedAt = Instant.now();

    @SuppressWarnings("NullAway")
    protected RevokedToken() {}

    @SuppressWarnings("NullAway")
    public RevokedToken(final String jti) {
        this.jti = jti;
        this.userId = UUID.fromString("00000000-0000-0000-0000-000000000000");
    }

    @SuppressWarnings("NullAway")
    public RevokedToken(final String jti, final UUID userId) {
        this.jti = jti;
        this.userId = userId;
    }

    public UUID getId() {
        return id;
    }

    public String getJti() {
        return jti;
    }

    public UUID getUserId() {
        return userId;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }
}
