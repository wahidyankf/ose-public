package com.organiclever.be.integration.steps;

import com.organiclever.be.integration.ResponseStore;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

@Scope("cucumber-glue")
public class HealthSteps {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ResponseStore responseStore;

    @When("^an operations engineer sends GET /health$")
    public void anOperationsEngineerSendsGetHealth() throws Exception {
        responseStore.setResult(mockMvc.perform(get("/health")).andReturn());
    }

    @When("^an unauthenticated engineer sends GET /health$")
    public void anUnauthenticatedEngineerSendsGetHealth() throws Exception {
        responseStore.setResult(mockMvc.perform(get("/health")).andReturn());
    }

    @When("^a client sends GET /health$")
    public void aClientSendsGetHealth() throws Exception {
        responseStore.setResult(mockMvc.perform(get("/health")).andReturn());
    }

    @Then("the health status should be {string}")
    public void theHealthStatusShouldBe(final String expectedStatus) throws Exception {
        MockMvcResultMatchers.jsonPath("$.status").value(expectedStatus)
            .match(responseStore.getResult());
    }

    @Then("the response should not include detailed component health information")
    public void theResponseShouldNotIncludeComponentDetails() throws Exception {
        final String body = responseStore.getResult().getResponse().getContentAsString();
        assertThat(body).doesNotContain("components");
    }
}
