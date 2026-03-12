package com.organiclever.demojavx.handler;

import com.organiclever.demojavx.auth.PasswordService;
import com.organiclever.demojavx.domain.model.User;
import com.organiclever.demojavx.domain.validation.DomainException;
import com.organiclever.demojavx.domain.validation.ValidationException;
import com.organiclever.demojavx.repository.TokenRevocationRepository;
import com.organiclever.demojavx.repository.UserRepository;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;

public class UserHandler implements Handler<RoutingContext> {

    private final UserRepository userRepo;
    private final TokenRevocationRepository revocationRepo;
    private final PasswordService passwordService;
    private final String action;

    public UserHandler(String action, UserRepository userRepo,
            TokenRevocationRepository revocationRepo, PasswordService passwordService) {
        this.action = action;
        this.userRepo = userRepo;
        this.revocationRepo = revocationRepo;
        this.passwordService = passwordService;
    }

    @Override
    public void handle(RoutingContext ctx) {
        switch (action) {
            case "getMe" -> handleGetMe(ctx);
            case "updateMe" -> handleUpdateMe(ctx);
            case "changePassword" -> handleChangePassword(ctx);
            case "deactivate" -> handleDeactivate(ctx);
            default -> ctx.fail(500);
        }
    }

    private void handleGetMe(RoutingContext ctx) {
        String userId = ctx.get("userId");
        if (userId == null) {
            ctx.fail(400);
            return;
        }
        userRepo.findById(userId)
                .onSuccess(userOpt -> {
                    if (userOpt.isEmpty()) {
                        ctx.fail(404);
                        return;
                    }
                    User user = userOpt.get();
                    JsonObject resp = buildUserResponse(user);
                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleUpdateMe(RoutingContext ctx) {
        String userId = ctx.get("userId");
        JsonObject body = ctx.body().asJsonObject();
        if (body == null) {
            ctx.fail(400);
            return;
        }
        if (userId == null) {
            ctx.fail(400);
            return;
        }
        String displayName = body.getString("display_name", "");

        userRepo.findById(userId)
                .compose(userOpt -> {
                    if (userOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(404, "User not found"));
                    }
                    User updated = userOpt.get().withDisplayName(displayName);
                    return userRepo.update(updated);
                })
                .onSuccess(user -> {
                    JsonObject resp = buildUserResponse(user);
                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleChangePassword(RoutingContext ctx) {
        String userId = ctx.get("userId");
        JsonObject body = ctx.body().asJsonObject();
        if (body == null) {
            ctx.fail(400);
            return;
        }
        if (userId == null) {
            ctx.fail(400);
            return;
        }
        String oldPassword = body.getString("old_password", "");
        String newPassword = body.getString("new_password", "");

        if (newPassword.isEmpty()) {
            ctx.fail(new ValidationException("new_password", "New password must not be empty"));
            return;
        }

        userRepo.findById(userId)
                .compose(userOpt -> {
                    if (userOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(404, "User not found"));
                    }
                    User user = userOpt.get();
                    if (!passwordService.verify(oldPassword, user.passwordHash())) {
                        return Future.failedFuture(new DomainException(401,
                                "Invalid credentials"));
                    }
                    String newHash = passwordService.hash(newPassword);
                    return userRepo.update(user.withPasswordHash(newHash));
                })
                .onSuccess(user -> ctx.response().setStatusCode(200).end())
                .onFailure(ctx::fail);
    }

    private void handleDeactivate(RoutingContext ctx) {
        String userId = ctx.get("userId");
        if (userId == null) {
            ctx.fail(400);
            return;
        }

        userRepo.findById(userId)
                .compose(userOpt -> {
                    if (userOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(404, "User not found"));
                    }
                    User updated = userOpt.get().withStatus(User.STATUS_INACTIVE);
                    return userRepo.update(updated);
                })
                .compose(user -> revocationRepo.deleteByUserId(userId))
                .onSuccess(ignored -> ctx.response().setStatusCode(200).end())
                .onFailure(ctx::fail);
    }

    private JsonObject buildUserResponse(User user) {
        return new JsonObject()
                .put("id", user.id())
                .put("username", user.username())
                .put("email", user.email())
                .put("display_name", user.displayName())
                .put("role", user.role())
                .put("status", user.status());
    }
}
