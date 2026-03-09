package com.organiclever.be.integration.steps;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.organiclever.be.integration.ResponseStore;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@Scope("cucumber-glue")
public class AuthSteps {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ResponseStore responseStore;

    @Autowired
    private TokenStore tokenStore;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @When("^a client sends POST /api/v1/auth/register with body:$")
    public void postRegister(final String body) throws Exception {
        responseStore.setResult(
            mockMvc.perform(
                post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andReturn());
    }

    @When("^a client sends POST /api/v1/auth/login with body:$")
    public void postLogin(final String body) throws Exception {
        responseStore.setResult(
            mockMvc.perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andReturn());
    }

    @Given("a user {string} is already registered")
    public void userIsAlreadyRegistered(final String username) throws Exception {
        mockMvc.perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("username", username, "password", "s3cur3Pass!"))))
        .andExpect(MockMvcResultMatchers.status().isCreated());
    }

    @Given("a user {string} is already registered with password {string}")
    public void userIsAlreadyRegisteredWithPassword(final String username, final String password)
            throws Exception {
        mockMvc.perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("username", username, "password", password))))
        .andExpect(MockMvcResultMatchers.status().isCreated());
    }

    @Given("the client has logged in as {string} and stored the JWT token")
    public void clientLoggedIn(final String username) throws Exception {
        MvcResult result = mockMvc.perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("username", username, "password", "s3cur3Pass!"))))
        .andExpect(MockMvcResultMatchers.status().isOk())
        .andReturn();
        String token = JsonPath.read(result.getResponse().getContentAsString(), "$.token");
        tokenStore.setToken(token);
    }

    @Then("the response body should contain {string} equal to {string}")
    public void responseBodyContainsFieldEqualTo(final String field, final String value)
            throws Exception {
        MockMvcResultMatchers.jsonPath("$." + field).value(value)
            .match(responseStore.getResult());
    }

    @Then("the response body should not contain a {string} field")
    public void responseBodyShouldNotContainField(final String field) throws Exception {
        MockMvcResultMatchers.jsonPath("$." + field).doesNotExist()
            .match(responseStore.getResult());
    }

    @Then("the response body should contain a non-null {string} field")
    public void responseBodyContainsNonNullField(final String field) throws Exception {
        MockMvcResultMatchers.jsonPath("$." + field).exists()
            .match(responseStore.getResult());
        MockMvcResultMatchers.jsonPath("$." + field).isNotEmpty()
            .match(responseStore.getResult());
    }

    @Then("the response body should contain a {string} field")
    public void responseBodyContainsField(final String field) throws Exception {
        MockMvcResultMatchers.jsonPath("$." + field).exists()
            .match(responseStore.getResult());
    }

    @Then("the response body should contain an error message about duplicate username")
    public void responseBodyContainsDuplicateUsernameError() throws Exception {
        final String body = responseStore.getResult().getResponse().getContentAsString();
        assertThat(body).containsIgnoringCase("already exists");
    }

    @Then("the response body should contain an error message about invalid credentials")
    public void responseBodyContainsInvalidCredentialsError() throws Exception {
        final String body = responseStore.getResult().getResponse().getContentAsString();
        assertThat(body).containsIgnoringCase("invalid");
    }

    @Then("the response body should contain a validation error for {string}")
    public void responseBodyContainsValidationError(final String field) throws Exception {
        MockMvcResultMatchers.status().isBadRequest().match(responseStore.getResult());
    }
}
