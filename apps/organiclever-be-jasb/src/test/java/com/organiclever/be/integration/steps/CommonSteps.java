package com.organiclever.be.integration.steps;

import com.organiclever.be.integration.ResponseStore;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import org.jspecify.annotations.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.DefaultTransactionDefinition;

@Scope("cucumber-glue")
public class CommonSteps {

    @Autowired
    private ResponseStore responseStore;

    @Autowired
    private TokenStore tokenStore;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Nullable
    private TransactionStatus transactionStatus;

    @Before
    public void beginScenario() {
        // Start a transaction that will be rolled back after every scenario.
        // With @SpringBootTest(webEnvironment = MOCK), MockMvc dispatches requests
        // synchronously on the test thread. The service's @Transactional(REQUIRED)
        // joins this outer transaction, so ALL database writes made via MockMvc are
        // covered by the rollback. No deleteAllInBatch() call is needed.
        DefaultTransactionDefinition def = new DefaultTransactionDefinition();
        def.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);
        transactionStatus = transactionManager.getTransaction(def);
        responseStore.clear();
        tokenStore.clear();
    }

    @After
    public void rollbackScenario() {
        if (transactionStatus != null) {
            transactionManager.rollback(transactionStatus);
            transactionStatus = null;
        }
    }

    @Given("the OrganicLever API is running")
    public void theOrganicLeverApiIsRunning() {
        // No-op: MockMvc context is always ready when scenarios execute.
    }

    @Then("the response status code should be {int}")
    public void theResponseStatusCodeShouldBe(final int expectedStatusCode) throws Exception {
        MockMvcResultMatchers.status()
            .is(expectedStatusCode)
            .match(responseStore.getResult());
    }
}
