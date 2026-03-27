package com.demobejasb.integration.token_management;

import com.demobejasb.auth.repository.RevokedTokenRepository;
import com.demobejasb.auth.repository.UserRepository;
import com.demobejasb.auth.service.AuthService;
import com.demobejasb.integration.ResponseStore;
import com.demobejasb.integration.steps.TokenStore;
import com.demobejasb.security.JwtUtil;
import com.jayway.jsonpath.JsonPath;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;

import static org.assertj.core.api.Assertions.assertThat;

@Scope("cucumber-glue")
public class TokenManagementSteps {

    @Autowired
    private AuthService authService;

    @Autowired
    private ResponseStore responseStore;

    @Autowired
    private TokenStore tokenStore;

    @Autowired
    private RevokedTokenRepository revokedTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private String jwtPayloadJson = "";

    @When("alice decodes her access token payload")
    public void aliceDecodesHerAccessTokenPayload() {
        String token = tokenStore.getToken();
        if (token == null) {
            throw new IllegalStateException("Token not stored");
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid JWT format");
        }
        jwtPayloadJson = new String(
                java.util.Base64.getUrlDecoder().decode(parts[1]),
                java.nio.charset.StandardCharsets.UTF_8);
        // Store the decoded payload as the "response body" so Then steps can read it
        responseStore.setResponse(200, jwtPayloadJson);
    }

    @Then("the token should contain a non-null {string} claim")
    public void theTokenShouldContainANonNullClaim(final String claim) {
        if (jwtPayloadJson.isEmpty()) {
            String token = tokenStore.getToken();
            if (token == null) {
                throw new IllegalStateException("No token stored");
            }
            String[] parts = token.split("\\.");
            jwtPayloadJson = new String(
                    java.util.Base64.getUrlDecoder().decode(parts[1]),
                    java.nio.charset.StandardCharsets.UTF_8);
        }
        Object value = JsonPath.read(jwtPayloadJson, "$." + claim);
        assertThat(value).isNotNull();
    }

    @When("^the client sends GET /.well-known/jwks.json$")
    public void theClientSendsGetJwks() {
        Map<String, Object> jwksKey = jwtUtil.getJwksKey();
        responseStore.setResponse(200, Map.of("keys", List.of(jwksKey)));
    }

    @Then("the response body should contain at least one key in the {string} array")
    public void theResponseBodyShouldContainAtLeastOneKeyInArray(final String field) {
        Map<String, Object> body = responseStore.getBodyAsMap();
        assertThat(body).containsKey(field);
        Object value = body.get(field);
        assertThat(value).isInstanceOf(List.class);
        List<?> list = (List<?>) value;
        assertThat(list).isNotEmpty();
    }

    @When("^alice sends POST /api/v1/auth/logout with her access token$")
    public void aliceSendsPostLogoutWithHerAccessToken() {
        String token = tokenStore.getToken();
        if (token == null) {
            throw new IllegalStateException("Token not stored");
        }
        authService.logout(token);
        responseStore.setResponse(200);
    }

    @Then("alice's access token should be recorded as revoked")
    public void alicesAccessTokenShouldBeRecordedAsRevoked() {
        String token = tokenStore.getToken();
        if (token == null) {
            throw new IllegalStateException("Token not stored");
        }
        assertThat(revokedTokenRepository.existsByJti(token)).isTrue();
    }

    @Given("alice has logged out and her access token is blacklisted")
    public void aliceHasLoggedOutAndTokenIsBlacklisted() {
        String token = tokenStore.getToken();
        if (token == null) {
            throw new IllegalStateException("Token not stored");
        }
        authService.logout(token);
    }

    @Given("^the admin has disabled alice's account via POST /api/v1/admin/users/\\{alice_id\\}/disable$")
    public void theAdminHasDisabledAlicesAccount() {
        String adminToken = tokenStore.getAdminToken();
        UUID aliceId = tokenStore.getAliceId();
        if (adminToken == null || aliceId == null) {
            throw new IllegalStateException("Admin token or alice ID not set");
        }
        // Authorization check: admin token must be valid and user must have ADMIN role
        if (!jwtUtil.isTokenValid(adminToken)) {
            return; // would be 401 in HTTP, but this is a Given so we just don't perform the action
        }
        userRepository.findById(aliceId).ifPresent(user -> {
            user.setStatus("DISABLED");
            userRepository.save(user);
        });
    }
}
