package com.organiclever.demojavx.unit;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.organiclever.demojavx.auth.JwtService;
import com.organiclever.demojavx.auth.PasswordService;
import com.organiclever.demojavx.handler.AdminHandler;
import com.organiclever.demojavx.handler.AttachmentHandler;
import com.organiclever.demojavx.handler.AuthHandler;
import com.organiclever.demojavx.handler.ExpenseHandler;
import com.organiclever.demojavx.handler.ReportHandler;
import com.organiclever.demojavx.handler.UserHandler;
import com.organiclever.demojavx.repository.AttachmentRepository;
import com.organiclever.demojavx.repository.ExpenseRepository;
import com.organiclever.demojavx.repository.TokenRevocationRepository;
import com.organiclever.demojavx.repository.UserRepository;
import io.vertx.ext.web.RoutingContext;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for null-guard branches added for NullAway compliance in handler classes.
 *
 * <p>These branches are unreachable through normal HTTP routing (Vert.x router always
 * provides path params when a route matches, and JwtAuthHandler always sets userId before
 * delegating to a protected handler). They exist solely to satisfy NullAway's static
 * null-safety analysis. Unit tests with mocked RoutingContext are the only way to exercise
 * these paths and keep coverage above the 90% threshold.
 */
@ExtendWith(MockitoExtension.class)
class HandlerNullGuardTest {

    // ─────────────────────────── AdminHandler ────────────────────────────

    @Test
    void adminDisable_nullPathParam_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.pathParam("id")).thenReturn(null);

        new AdminHandler("disable", mock(UserRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    @Test
    void adminEnable_nullPathParam_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.pathParam("id")).thenReturn(null);

        new AdminHandler("enable", mock(UserRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    @Test
    void adminUnlock_nullPathParam_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.pathParam("id")).thenReturn(null);

        new AdminHandler("unlock", mock(UserRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    @Test
    void adminForcePasswordReset_nullPathParam_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.pathParam("id")).thenReturn(null);

        new AdminHandler("forcePasswordReset", mock(UserRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    // ─────────────────────────── AttachmentHandler ───────────────────────

    @Test
    void attachmentUpload_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.<String>get("userId")).thenReturn(null);

        new AttachmentHandler("upload", mock(ExpenseRepository.class),
                mock(AttachmentRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    @Test
    void attachmentList_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.<String>get("userId")).thenReturn(null);

        new AttachmentHandler("list", mock(ExpenseRepository.class),
                mock(AttachmentRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    @Test
    void attachmentDelete_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.<String>get("userId")).thenReturn(null);

        new AttachmentHandler("delete", mock(ExpenseRepository.class),
                mock(AttachmentRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    // ─────────────────────────── AuthHandler ─────────────────────────────

    @Test
    void authLogoutAll_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.<String>get("userId")).thenReturn(null);
        when(ctx.<String>get("jti")).thenReturn(null);

        new AuthHandler("logout-all", mock(UserRepository.class),
                mock(TokenRevocationRepository.class),
                mock(JwtService.class),
                mock(PasswordService.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    // ─────────────────────────── ExpenseHandler ──────────────────────────

    @Test
    void expenseCreate_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        // body is non-null so the body null guard passes first
        when(ctx.body()).thenReturn(mock(io.vertx.ext.web.RequestBody.class));
        when(ctx.body().asJsonObject()).thenReturn(new io.vertx.core.json.JsonObject());
        when(ctx.<String>get("userId")).thenReturn(null);

        new ExpenseHandler("create", mock(ExpenseRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    @Test
    void expenseList_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.<String>get("userId")).thenReturn(null);

        new ExpenseHandler("list", mock(ExpenseRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    @Test
    void expenseGet_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.<String>get("userId")).thenReturn(null);
        when(ctx.pathParam("id")).thenReturn(null);

        new ExpenseHandler("get", mock(ExpenseRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    @Test
    void expenseUpdate_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        // body is non-null so the body null guard passes first
        when(ctx.body()).thenReturn(mock(io.vertx.ext.web.RequestBody.class));
        when(ctx.body().asJsonObject()).thenReturn(new io.vertx.core.json.JsonObject());
        when(ctx.<String>get("userId")).thenReturn(null);
        when(ctx.pathParam("id")).thenReturn(null);

        new ExpenseHandler("update", mock(ExpenseRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    @Test
    void expenseDelete_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.<String>get("userId")).thenReturn(null);
        when(ctx.pathParam("id")).thenReturn(null);

        new ExpenseHandler("delete", mock(ExpenseRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    @Test
    void expenseSummary_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.<String>get("userId")).thenReturn(null);

        new ExpenseHandler("summary", mock(ExpenseRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    // ─────────────────────────── ReportHandler ───────────────────────────

    @Test
    void report_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.<String>get("userId")).thenReturn(null);

        new ReportHandler(mock(ExpenseRepository.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    // ─────────────────────────── UserHandler ─────────────────────────────

    @Test
    void userGetMe_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.<String>get("userId")).thenReturn(null);

        new UserHandler("getMe", mock(UserRepository.class),
                mock(TokenRevocationRepository.class),
                mock(PasswordService.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    @Test
    void userUpdateMe_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        // body is non-null so the body null guard passes first
        when(ctx.body()).thenReturn(mock(io.vertx.ext.web.RequestBody.class));
        when(ctx.body().asJsonObject()).thenReturn(new io.vertx.core.json.JsonObject());
        when(ctx.<String>get("userId")).thenReturn(null);

        new UserHandler("updateMe", mock(UserRepository.class),
                mock(TokenRevocationRepository.class),
                mock(PasswordService.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    @Test
    void userChangePassword_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        // body must be non-null so the body guard passes first; password must be non-empty
        when(ctx.body()).thenReturn(mock(io.vertx.ext.web.RequestBody.class));
        io.vertx.core.json.JsonObject body = new io.vertx.core.json.JsonObject()
                .put("old_password", "old")
                .put("new_password", "NewPass#1234");
        when(ctx.body().asJsonObject()).thenReturn(body);
        when(ctx.<String>get("userId")).thenReturn(null);

        new UserHandler("changePassword", mock(UserRepository.class),
                mock(TokenRevocationRepository.class),
                mock(PasswordService.class)).handle(ctx);

        verify(ctx).fail(400);
    }

    @Test
    void userDeactivate_nullUserId_fails400() {
        RoutingContext ctx = mock(RoutingContext.class);
        when(ctx.<String>get("userId")).thenReturn(null);

        new UserHandler("deactivate", mock(UserRepository.class),
                mock(TokenRevocationRepository.class),
                mock(PasswordService.class)).handle(ctx);

        verify(ctx).fail(400);
    }
}
