package com.organiclever.be.integration.steps;

import com.organiclever.be.integration.ResponseStore;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@Scope("cucumber-glue")
public class HelloSteps {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ResponseStore responseStore;

    @Autowired
    private TokenStore tokenStore;

    @When("^a client sends GET /api/v1/hello$")
    public void aClientSendsGetHello() throws Exception {
        responseStore.setResult(mockMvc.perform(get("/api/v1/hello")).andReturn());
    }

    @When("^a client sends GET /api/v1/hello with an Origin header of (.+)$")
    public void aClientSendsGetHelloWithOrigin(final String origin) throws Exception {
        responseStore.setResult(
            mockMvc.perform(get("/api/v1/hello").header(HttpHeaders.ORIGIN, origin)).andReturn()
        );
    }

    @When("^a client sends GET /api/v1/hello without an Authorization header$")
    public void aClientSendsGetHelloWithoutAuthHeader() throws Exception {
        responseStore.setResult(mockMvc.perform(get("/api/v1/hello")).andReturn());
    }

    @When("^a client sends GET /api/v1/hello with the stored Bearer token$")
    public void aClientSendsGetHelloWithStoredToken() throws Exception {
        final String token = tokenStore.getToken();
        responseStore.setResult(
            mockMvc.perform(
                get("/api/v1/hello")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
            .andReturn());
    }

    @When("^a client sends GET /api/v1/hello with the stored Bearer token and Origin header (.+)$")
    public void aClientSendsGetHelloWithTokenAndOrigin(final String origin) throws Exception {
        final String token = tokenStore.getToken();
        responseStore.setResult(
            mockMvc.perform(
                get("/api/v1/hello")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .header(HttpHeaders.ORIGIN, origin))
            .andReturn());
    }

    @When("^a client sends GET /api/v1/hello with an expired Bearer token$")
    public void aClientSendsGetHelloWithExpiredToken() throws Exception {
        // This token was signed with a valid secret but has exp in the past.
        final String expiredToken =
            "eyJhbGciOiJIUzI1NiJ9"
                + ".eyJzdWIiOiJ0ZXN0dXNlciIsImlhdCI6MTAwMDAwMDAwMCwiZXhwIjoxMDAwMDAwMDAxfQ"
                + ".invalid";
        responseStore.setResult(
            mockMvc.perform(
                get("/api/v1/hello")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredToken))
            .andReturn());
    }

    @When("^a client sends GET /api/v1/hello with Authorization header \"(.+)\"$")
    public void aClientSendsGetHelloWithAuthHeader(final String header) throws Exception {
        responseStore.setResult(
            mockMvc.perform(
                get("/api/v1/hello")
                    .header(HttpHeaders.AUTHORIZATION, header))
            .andReturn());
    }

    @Then("^the response body should be \\{\"message\":\"world!\"\\}$")
    public void theResponseBodyShouldBeHelloWorld() throws Exception {
        MockMvcResultMatchers.jsonPath("$.message").value("world!")
            .match(responseStore.getResult());
    }

    @Then("^the response Content-Type should be application/json$")
    public void theResponseContentTypeShouldBeJson() throws Exception {
        MockMvcResultMatchers.content()
            .contentTypeCompatibleWith("application/json")
            .match(responseStore.getResult());
    }

    @Then("the response should include an Access-Control-Allow-Origin header permitting the request")
    public void theResponseShouldIncludeAcaoHeader() {
        final String acao = responseStore.getResult()
            .getResponse()
            .getHeader("Access-Control-Allow-Origin");
        assertThat(acao).isNotBlank();
    }
}
