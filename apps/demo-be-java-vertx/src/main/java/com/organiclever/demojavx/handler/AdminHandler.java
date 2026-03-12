package com.organiclever.demojavx.handler;

import com.organiclever.demojavx.domain.model.User;
import com.organiclever.demojavx.domain.validation.DomainException;
import com.organiclever.demojavx.repository.UserRepository;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import java.util.List;
import java.util.UUID;

public class AdminHandler implements Handler<RoutingContext> {

    private final UserRepository userRepo;
    private final String action;

    public AdminHandler(String action, UserRepository userRepo) {
        this.action = action;
        this.userRepo = userRepo;
    }

    @Override
    public void handle(RoutingContext ctx) {
        switch (action) {
            case "list" -> handleList(ctx);
            case "disable" -> handleDisable(ctx);
            case "enable" -> handleEnable(ctx);
            case "unlock" -> handleUnlock(ctx);
            case "forcePasswordReset" -> handleForcePasswordReset(ctx);
            default -> ctx.fail(500);
        }
    }

    private void handleList(RoutingContext ctx) {
        String emailFilter = ctx.queryParam("email").stream().findFirst().orElse(null);
        String pageParam = ctx.queryParam("page").stream().findFirst().orElse("1");
        String sizeParam = ctx.queryParam("size").stream().findFirst().orElse("20");

        int page = Math.max(1, parseInt(pageParam, 1));
        int size = Math.max(1, parseInt(sizeParam, 20));

        userRepo.findByEmail(emailFilter)
                .onSuccess(users -> {
                    int total = users.size();
                    int start = (page - 1) * size;
                    List<User> pageUsers = users.stream()
                            .skip(start)
                            .limit(size)
                            .toList();

                    JsonArray data = new JsonArray();
                    for (User u : pageUsers) {
                        data.add(buildUserSummary(u));
                    }

                    JsonObject resp = new JsonObject()
                            .put("data", data)
                            .put("total", total)
                            .put("page", page)
                            .put("size", size);

                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleDisable(RoutingContext ctx) {
        String userId = ctx.pathParam("id");
        if (userId == null) {
            ctx.fail(400);
            return;
        }
        userRepo.findById(userId)
                .compose(userOpt -> {
                    if (userOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(404, "User not found"));
                    }
                    return userRepo.update(userOpt.get().withStatus(User.STATUS_DISABLED));
                })
                .onSuccess(user -> {
                    JsonObject resp = new JsonObject()
                            .put("id", user.id())
                            .put("status", user.status());
                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleEnable(RoutingContext ctx) {
        String userId = ctx.pathParam("id");
        if (userId == null) {
            ctx.fail(400);
            return;
        }
        userRepo.findById(userId)
                .compose(userOpt -> {
                    if (userOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(404, "User not found"));
                    }
                    return userRepo.update(userOpt.get().withStatus(User.STATUS_ACTIVE));
                })
                .onSuccess(user -> {
                    JsonObject resp = new JsonObject()
                            .put("id", user.id())
                            .put("status", user.status());
                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleUnlock(RoutingContext ctx) {
        String userId = ctx.pathParam("id");
        if (userId == null) {
            ctx.fail(400);
            return;
        }
        userRepo.findById(userId)
                .compose(userOpt -> {
                    if (userOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(404, "User not found"));
                    }
                    User updated = userOpt.get()
                            .withStatus(User.STATUS_ACTIVE)
                            .withFailedLoginAttempts(0);
                    return userRepo.update(updated);
                })
                .onSuccess(user -> ctx.response().setStatusCode(200).end())
                .onFailure(ctx::fail);
    }

    private void handleForcePasswordReset(RoutingContext ctx) {
        String userId = ctx.pathParam("id");
        if (userId == null) {
            ctx.fail(400);
            return;
        }
        userRepo.findById(userId)
                .compose(userOpt -> {
                    if (userOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(404, "User not found"));
                    }
                    return Future.succeededFuture(userOpt.get());
                })
                .onSuccess(user -> {
                    String resetToken = UUID.randomUUID().toString();
                    JsonObject resp = new JsonObject().put("reset_token", resetToken);
                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private JsonObject buildUserSummary(User user) {
        return new JsonObject()
                .put("id", user.id())
                .put("username", user.username())
                .put("email", user.email())
                .put("display_name", user.displayName())
                .put("role", user.role())
                .put("status", user.status());
    }

    private int parseInt(String value, int defaultValue) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
