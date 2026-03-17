package com.demobejavx.handler;

import com.auth0.jwt.exceptions.JWTVerificationException;
import com.demobejavx.auth.JwtService;
import com.demobejavx.auth.PasswordService;
import com.demobejavx.domain.model.TokenRevocation;
import com.demobejavx.domain.model.User;
import com.demobejavx.domain.validation.DomainException;
import com.demobejavx.domain.validation.UserValidator;
import com.demobejavx.domain.validation.ValidationException;
import com.demobejavx.repository.TokenRevocationRepository;
import com.demobejavx.repository.UserRepository;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import java.time.Instant;

public class AuthHandler implements Handler<RoutingContext> {

    private static final int MAX_FAILED_ATTEMPTS = 5;

    private final UserRepository userRepo;
    private final TokenRevocationRepository revocationRepo;
    private final JwtService jwtService;
    private final PasswordService passwordService;
    private final String action;

    public AuthHandler(String action, UserRepository userRepo,
            TokenRevocationRepository revocationRepo,
            JwtService jwtService, PasswordService passwordService) {
        this.action = action;
        this.userRepo = userRepo;
        this.revocationRepo = revocationRepo;
        this.jwtService = jwtService;
        this.passwordService = passwordService;
    }

    @Override
    public void handle(RoutingContext ctx) {
        switch (action) {
            case "register" -> handleRegister(ctx);
            case "login" -> handleLogin(ctx);
            case "refresh" -> handleRefresh(ctx);
            case "logout" -> handleLogout(ctx);
            case "logout-all" -> handleLogoutAll(ctx);
            default -> ctx.fail(500);
        }
    }

    private void handleRegister(RoutingContext ctx) {
        JsonObject body = ctx.body().asJsonObject();
        if (body == null) {
            ctx.fail(new ValidationException("body", "Request body is required"));
            return;
        }
        String username = body.getString("username", "");
        String email = body.getString("email", "");
        String password = body.getString("password", "");

        try {
            UserValidator.validateRegistration(username, email, password);
        } catch (ValidationException e) {
            ctx.fail(e);
            return;
        }

        userRepo.existsByUsername(username)
                .compose(exists -> {
                    if (exists) {
                        return Future.failedFuture(new DomainException(409,
                                "Username already exists"));
                    }
                    String hash = passwordService.hash(password);
                    User newUser = new User(null, username, email, username,
                            hash, User.ROLE_USER, User.STATUS_ACTIVE, 0, Instant.now());
                    return userRepo.save(newUser);
                })
                .onSuccess(user -> {
                    JsonObject resp = new JsonObject()
                            .put("id", user.id())
                            .put("username", user.username())
                            .put("email", user.email())
                            .put("displayName", user.displayName())
                            .put("role", user.role());
                    ctx.response()
                            .setStatusCode(201)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleLogin(RoutingContext ctx) {
        JsonObject body = ctx.body().asJsonObject();
        if (body == null) {
            ctx.fail(401);
            return;
        }
        String username = body.getString("username", "");
        String password = body.getString("password", "");

        userRepo.findByUsername(username)
                .compose(userOpt -> {
                    if (userOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(401,
                                "Invalid credentials"));
                    }
                    User user = userOpt.get();
                    if (User.STATUS_INACTIVE.equals(user.status())) {
                        return Future.failedFuture(new DomainException(401,
                                "Account deactivated"));
                    }
                    if (User.STATUS_DISABLED.equals(user.status())) {
                        return Future.failedFuture(new DomainException(401,
                                "Account disabled"));
                    }
                    if (User.STATUS_LOCKED.equals(user.status())) {
                        return Future.failedFuture(new DomainException(401,
                                "Account locked"));
                    }
                    if (!passwordService.verify(password, user.passwordHash())) {
                        int attempts = user.failedLoginAttempts() + 1;
                        User updated = user.withFailedLoginAttempts(attempts);
                        if (attempts >= MAX_FAILED_ATTEMPTS) {
                            updated = updated.withStatus(User.STATUS_LOCKED);
                        }
                        return userRepo.update(updated)
                                .compose(u -> Future.failedFuture(
                                        new DomainException(401, "Invalid credentials")));
                    }
                    User resetUser = user.withFailedLoginAttempts(0);
                    return userRepo.update(resetUser);
                })
                .compose(user -> {
                    JwtService.TokenPair tokens = jwtService.generateTokenPair(user);
                    return Future.succeededFuture(tokens);
                })
                .onSuccess(tokens -> {
                    JsonObject resp = new JsonObject()
                            .put("accessToken", tokens.accessToken())
                            .put("refreshToken", tokens.refreshToken())
                            .put("tokenType", "Bearer");
                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleRefresh(RoutingContext ctx) {
        JsonObject body = ctx.body().asJsonObject();
        if (body == null) {
            ctx.fail(401);
            return;
        }
        String refreshToken = body.getString("refreshToken", "");

        JwtService.Claims claims;
        try {
            claims = jwtService.validate(refreshToken);
        } catch (JWTVerificationException e) {
            ctx.fail(new DomainException(401, "Token expired or invalid"));
            return;
        }

        if (!"refresh".equals(claims.type())) {
            ctx.fail(new DomainException(401, "Invalid token type"));
            return;
        }

        revocationRepo.isRevoked(claims.jti())
                .compose(revoked -> {
                    if (revoked) {
                        return Future.failedFuture(new DomainException(401,
                                "Token invalid"));
                    }
                    return userRepo.findById(claims.subject());
                })
                .compose(userOpt -> {
                    if (userOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(401, "User not found"));
                    }
                    User user = userOpt.get();
                    if (User.STATUS_DISABLED.equals(user.status())) {
                        return Future.failedFuture(new DomainException(401,
                                "Account disabled"));
                    }
                    if (!User.STATUS_ACTIVE.equals(user.status())) {
                        return Future.failedFuture(new DomainException(401,
                                "Account deactivated"));
                    }
                    String uid = user.id();
                    if (uid == null) {
                        return Future.failedFuture(new DomainException(500, "User id is null"));
                    }
                    TokenRevocation revoke = new TokenRevocation(claims.jti(), uid,
                            Instant.now());
                    return revocationRepo.save(revoke).map(ignored -> user);
                })
                .compose(user -> {
                    JwtService.TokenPair tokens = jwtService.generateTokenPair(user);
                    String uid = user.id();
                    if (uid == null) {
                        return Future.failedFuture(new DomainException(500, "User id is null"));
                    }
                    TokenRevocation revocation = new TokenRevocation(
                            tokens.refreshJti(), uid, Instant.now());
                    return revocationRepo.save(revocation).map(ignored -> tokens);
                })
                .onSuccess(tokens -> {
                    JsonObject resp = new JsonObject()
                            .put("accessToken", tokens.accessToken())
                            .put("refreshToken", tokens.refreshToken())
                            .put("tokenType", "Bearer");
                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleLogout(RoutingContext ctx) {
        String authHeader = ctx.request().getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            ctx.response().setStatusCode(200).end();
            return;
        }
        String token = authHeader.substring(7);

        JwtService.Claims claims;
        try {
            claims = jwtService.decode(token);
        } catch (Exception e) {
            ctx.response().setStatusCode(200).end();
            return;
        }

        TokenRevocation revocation = new TokenRevocation(claims.jti(), claims.subject(),
                Instant.now());
        revocationRepo.save(revocation)
                .onSuccess(ignored -> ctx.response().setStatusCode(200).end())
                .onFailure(ctx::fail);
    }

    private void handleLogoutAll(RoutingContext ctx) {
        String userId = ctx.get("userId");
        String jti = ctx.get("jti");

        if (userId == null || jti == null) {
            ctx.fail(400);
            return;
        }
        // Revoke the current access token
        TokenRevocation accessRevocation = new TokenRevocation(jti, userId, Instant.now());
        // Revoke a sentinel entry for "all sessions" to block any existing refresh tokens
        TokenRevocation allRevoke = new TokenRevocation(
                "all-" + userId, userId, Instant.now());
        revocationRepo.save(accessRevocation)
                .compose(ignored -> revocationRepo.save(allRevoke))
                .onSuccess(ignored -> ctx.response().setStatusCode(200).end())
                .onFailure(ctx::fail);
    }
}
