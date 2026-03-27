package com.demobejasb.unit.steps;

import com.demobejasb.auth.controller.JwksController;
import com.demobejasb.auth.repository.RevokedTokenRepository;
import com.demobejasb.auth.repository.UserRepository;
import com.demobejasb.auth.service.AuthService;
import com.demobejasb.security.JwtUtil;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit-level step definitions for token management scenarios (JWT claims, JWKS, revocation).
 */
@Scope("cucumber-glue")
public class UnitTokenManagementSteps {

    @Autowired
    private UnitStateStore stateStore;

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private JwksController jwksController;

    @Autowired
    private RevokedTokenRepository revokedTokenRepository;

    @Autowired
    private UserRepository userRepository;

    /** Decoded JWT payload stored between When/Then steps. */
    private String jwtPayloadJson = "";

    @When("alice decodes her access token payload")
    public void aliceDecodesHerAccessTokenPayload() {
        String token = stateStore.getAccessToken();
        assertThat(token).isNotNull();
        // Exercise JwtUtil methods to increase coverage
        assertThat(jwtUtil.isTokenValid(token)).isTrue();
        assertThat(jwtUtil.extractUsername(token)).isNotNull();
        assertThat(jwtUtil.extractClaims(token)).isNotNull();
        assertThat(jwtUtil.getIssuer()).isEqualTo("demo-be");
        // generateToken (simple username-only token)
        String simpleToken = jwtUtil.generateToken("alice");
        assertThat(jwtUtil.isTokenValid(simpleToken)).isTrue();
        assertThat(jwtUtil.extractUsername(simpleToken)).isEqualTo("alice");

        String[] parts = token.split("\\.");
        assertThat(parts).hasSize(3);
        jwtPayloadJson = new String(
                java.util.Base64.getUrlDecoder().decode(parts[1]),
                java.nio.charset.StandardCharsets.UTF_8);
        stateStore.setStatusCode(200);
        stateStore.setResponseBody(jwtPayloadJson);
    }

    @Then("the token should contain a non-null {string} claim")
    public void theTokenShouldContainANonNullClaim(final String claim) {
        if (jwtPayloadJson.isEmpty()) {
            String token = stateStore.getAccessToken();
            assertThat(token).isNotNull();
            String[] parts = token.split("\\.");
            jwtPayloadJson = new String(
                    java.util.Base64.getUrlDecoder().decode(parts[1]),
                    java.nio.charset.StandardCharsets.UTF_8);
        }
        Object value = com.jayway.jsonpath.JsonPath.read(jwtPayloadJson, "$." + claim);
        assertThat(value).isNotNull();
    }

    @When("^the client sends GET /.well-known/jwks.json$")
    public void theClientSendsGetJwks() {
        Map<String, Object> result = jwksController.getJwks();
        stateStore.setStatusCode(200);
        stateStore.setResponseBody(result);
    }

    @Then("the response body should contain at least one key in the {string} array")
    public void theResponseBodyShouldContainAtLeastOneKeyInArray(final String field) {
        Object body = stateStore.getResponseBody();
        assertThat(body).isNotNull();
        assertThat(body).isInstanceOf(Map.class);
        @SuppressWarnings("unchecked")
        Map<String, Object> map = (Map<String, Object>) body;
        Object keys = map.get(field);
        assertThat(keys).isNotNull();
        assertThat(keys).isInstanceOf(java.util.List.class);
        assertThat((java.util.List<?>) keys).isNotEmpty();
    }

    @Then("alice's access token should be recorded as revoked")
    public void alicesAccessTokenShouldBeRecordedAsRevoked() {
        String token = stateStore.getAccessToken();
        assertThat(token).isNotNull();
        assertThat(revokedTokenRepository.existsByJti(token)).isTrue();
    }

    @Given("alice has logged out and her access token is blacklisted")
    public void aliceHasLoggedOutAndTokenIsBlacklisted() {
        String token = stateStore.getAccessToken();
        if (token != null) {
            authService.logout(token);
        }
    }

    @Given("^the admin has disabled alice's account via POST /api/v1/admin/users/\\{alice_id\\}/disable$")
    public void theAdminHasDisabledAlicesAccount() {
        java.util.UUID aliceId = stateStore.getAliceId();
        if (aliceId == null) {
            throw new IllegalStateException("Alice ID not set");
        }
        userRepository.findById(aliceId).ifPresent(user -> {
            user.setStatus("DISABLED");
            userRepository.save(user);
        });
    }

}
