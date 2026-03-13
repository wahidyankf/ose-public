package com.demobejasb.auth.dto;

import java.util.UUID;

public record RegisterResponse(UUID id, String username, String createdAt) {}
