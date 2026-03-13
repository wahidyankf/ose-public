package com.organiclever.be.unit.steps;

import com.organiclever.be.auth.controller.AuthController;
import com.organiclever.be.auth.dto.AuthResponse;
import com.organiclever.be.auth.dto.RefreshRequest;
import com.organiclever.be.auth.repository.RefreshTokenRepository;
import com.organiclever.be.auth.service.AccountNotActiveException;
import com.organiclever.be.auth.service.AuthService;
import com.organiclever.be.auth.service.InvalidTokenException;
import com.organiclever.be.auth.service.TokenExpiredException;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.http.ResponseEntity;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit-level step definitions for token lifecycle scenarios (refresh, logout, logout-all).
 */
@Scope("cucumber-glue")
public class UnitTokenLifecycleSteps {

    @Autowired
    private UnitStateStore stateStore;

    @Autowired
    private AuthService authService;

    @Autowired
    private AuthController authController;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @When("^alice sends POST /api/v1/auth/refresh with her refresh token$")
    public void aliceSendsPostRefreshWithHerRefreshToken() {
        String rt = stateStore.getRefreshToken();
        if (rt == null) {
            stateStore.setStatusCode(401);
            return;
        }
        performRefresh(rt);
    }

    @Given("alice's refresh token has expired")
    public void alicesRefreshTokenHasExpired() {
        String rt = stateStore.getRefreshToken();
        if (rt == null) {
            return;
        }
        String tokenHash = hashToken(rt);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setExpiresAt(java.time.Instant.now().minus(1, ChronoUnit.DAYS));
            refreshTokenRepository.save(token);
        });
    }

    @Given("alice has used her refresh token to get a new token pair")
    public void aliceHasUsedHerRefreshTokenToGetANewTokenPair() {
        String originalRt = stateStore.getRefreshToken();
        stateStore.setOriginalRefreshToken(originalRt);
        try {
            AuthResponse resp = authService.refresh(originalRt);
            stateStore.setAccessToken(resp.accessToken());
            stateStore.setRefreshToken(resp.refreshToken());
        } catch (InvalidTokenException | AccountNotActiveException e) {
            throw new RuntimeException("Expected refresh to succeed: " + e.getMessage(), e);
        }
    }

    @When("^alice sends POST /api/v1/auth/refresh with her original refresh token$")
    public void aliceSendsPostRefreshWithHerOriginalRefreshToken() {
        String originalRt = stateStore.getOriginalRefreshToken();
        if (originalRt == null) {
            stateStore.setStatusCode(401);
            return;
        }
        performRefresh(originalRt);
    }

    @When("^alice sends POST /api/v1/auth/logout with her access token$")
    public void aliceSendsPostLogoutWithHerAccessToken() {
        String token = stateStore.getAccessToken();
        if (token == null) {
            stateStore.setStatusCode(401);
            return;
        }
        String username = stateStore.getCurrentUsername();
        if (username == null) {
            username = "alice";
        }
        ResponseEntity<Void> resp = authController.logout(
                UnitAuthSteps.mockRequest(token),
                UnitAuthSteps.userDetails(username));
        stateStore.setStatusCode(resp.getStatusCode().value());
        stateStore.setResponseBody(java.util.Map.of("message", "Logged out"));
    }

    @When("^alice sends POST /api/v1/auth/logout-all with her access token$")
    public void aliceSendsPostLogoutAllWithHerAccessToken() {
        String token = stateStore.getAccessToken();
        if (token == null) {
            stateStore.setStatusCode(401);
            return;
        }
        String username = stateStore.getCurrentUsername();
        if (username == null) {
            username = "alice";
        }
        ResponseEntity<Void> resp = authController.logoutAll(
                UnitAuthSteps.mockRequest(token),
                UnitAuthSteps.userDetails(username));
        stateStore.setStatusCode(resp.getStatusCode().value());
        stateStore.setResponseBody(java.util.Map.of("message", "Logged out from all devices"));
    }

    @Then("alice's access token should be invalidated")
    public void alicesAccessTokenShouldBeInvalidated() {
        String token = stateStore.getAccessToken();
        assertThat(token).isNotNull();
        boolean revoked = authService.isTokenRevoked(token);
        assertThat(revoked).isTrue();
    }

    @Given("alice has already logged out once")
    public void aliceHasAlreadyLoggedOutOnce() {
        String token = stateStore.getAccessToken();
        if (token != null) {
            authService.logout(token);
        }
    }

    // ============================================================
    // Helpers
    // ============================================================

    private void performRefresh(final String rawRefreshToken) {
        try {
            ResponseEntity<AuthResponse> response =
                    authController.refresh(new RefreshRequest(rawRefreshToken));
            AuthResponse resp = response.getBody();
            stateStore.setStatusCode(response.getStatusCode().value());
            stateStore.setResponseBody(resp);
            stateStore.setLastException(null);
            if (resp != null) {
                stateStore.setAccessToken(resp.accessToken());
                stateStore.setRefreshToken(resp.refreshToken());
            }
        } catch (TokenExpiredException e) {
            stateStore.setStatusCode(401);
            stateStore.setLastException(e);
            stateStore.setResponseBody(null);
        } catch (InvalidTokenException e) {
            stateStore.setStatusCode(401);
            stateStore.setLastException(e);
            stateStore.setResponseBody(null);
        } catch (AccountNotActiveException e) {
            stateStore.setStatusCode(401);
            stateStore.setLastException(e);
            stateStore.setResponseBody(null);
        }
    }

    private String hashToken(final String token) {
        try {
            java.security.MessageDigest md =
                    java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash =
                    md.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
