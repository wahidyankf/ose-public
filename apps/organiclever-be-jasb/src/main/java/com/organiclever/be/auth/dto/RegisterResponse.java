package com.organiclever.be.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record RegisterResponse(UUID id, String username, Instant createdAt) {}
