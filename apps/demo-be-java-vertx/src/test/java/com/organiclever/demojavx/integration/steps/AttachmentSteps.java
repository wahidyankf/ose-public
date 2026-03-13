package com.organiclever.demojavx.integration.steps;

import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.junit.jupiter.api.Assertions;

public class AttachmentSteps {

    private static final int MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private final ScenarioState state;

    public AttachmentSteps(ScenarioState state) {
        this.state = state;
    }

    @When("^alice uploads file \"([^\"]*)\" with content type \"([^\"]*)\" to POST /api/v1/expenses/\\{expenseId\\}/attachments$")
    public void aliceUploadsFileToExpense(String filename, String contentType) throws Exception {
        String token = state.getAccessToken();
        String expenseId = state.getExpenseId();
        Assertions.assertNotNull(expenseId, "Expense ID must be set");

        byte[] content = createSampleContent(filename);
        ServiceResponse response = AppFactory.getService()
                .uploadAttachment(token, expenseId, filename, contentType, content);
        state.setLastResponse(response);
        if (response.statusCode() == 201) {
            JsonObject body = response.body();
            if (body != null) {
                state.setAttachmentId(body.getString("id"));
            }
        }
    }

    @When("^alice uploads file \"([^\"]*)\" with content type \"([^\"]*)\" to POST /api/v1/expenses/\\{bobExpenseId\\}/attachments$")
    public void aliceUploadsFileToBobsExpense(String filename,
            String contentType) throws Exception {
        String token = state.getAccessToken();
        String expenseId = state.getBobExpenseId();
        Assertions.assertNotNull(expenseId, "Bob's expense ID must be set");

        byte[] content = createSampleContent(filename);
        ServiceResponse response = AppFactory.getService()
                .uploadAttachment(token, expenseId, filename, contentType, content);
        state.setLastResponse(response);
    }

    @When("^alice uploads an oversized file to POST /api/v1/expenses/\\{expenseId\\}/attachments$")
    public void aliceUploadsOversizedFile() throws Exception {
        String token = state.getAccessToken();
        String expenseId = state.getExpenseId();
        Assertions.assertNotNull(expenseId, "Expense ID must be set");

        byte[] oversizedContent = new byte[MAX_FILE_SIZE + 1024];
        ServiceResponse response = AppFactory.getService()
                .uploadAttachment(token, expenseId, "big.jpg", "image/jpeg", oversizedContent);
        state.setLastResponse(response);
    }

    @When("^alice sends GET /api/v1/expenses/\\{expenseId\\}/attachments$")
    public void aliceSendsGetAttachments() throws Exception {
        String token = state.getAccessToken();
        String expenseId = state.getExpenseId();
        Assertions.assertNotNull(expenseId, "Expense ID must be set");

        ServiceResponse response = AppFactory.getService()
                .listAttachments(token, expenseId);
        state.setLastResponse(response);
    }

    @When("^alice sends GET /api/v1/expenses/\\{bobExpenseId\\}/attachments$")
    public void aliceSendsGetBobsAttachments() throws Exception {
        String token = state.getAccessToken();
        String expenseId = state.getBobExpenseId();
        Assertions.assertNotNull(expenseId, "Bob's expense ID must be set");

        ServiceResponse response = AppFactory.getService()
                .listAttachments(token, expenseId);
        state.setLastResponse(response);
    }

    @When("^alice sends DELETE /api/v1/expenses/\\{expenseId\\}/attachments/\\{attachmentId\\}$")
    public void aliceSendsDeleteAttachment() throws Exception {
        String token = state.getAccessToken();
        String expenseId = state.getExpenseId();
        String attachmentId = state.getAttachmentId();
        Assertions.assertNotNull(expenseId, "Expense ID must be set");
        Assertions.assertNotNull(attachmentId, "Attachment ID must be set");

        ServiceResponse response = AppFactory.getService()
                .deleteAttachment(token, expenseId, attachmentId);
        state.setLastResponse(response);
    }

    @When("^alice sends DELETE /api/v1/expenses/\\{bobExpenseId\\}/attachments/\\{attachmentId\\}$")
    public void aliceSendsDeleteBobsAttachment() throws Exception {
        String token = state.getAccessToken();
        String expenseId = state.getBobExpenseId();
        String attachmentId = state.getAttachmentId();
        Assertions.assertNotNull(expenseId, "Bob's expense ID must be set");
        Assertions.assertNotNull(attachmentId, "Attachment ID must be set");

        ServiceResponse response = AppFactory.getService()
                .deleteAttachment(token, expenseId, attachmentId);
        state.setLastResponse(response);
    }

    @When("^alice sends DELETE /api/v1/expenses/\\{expenseId\\}/attachments/\\{randomAttachmentId\\}$")
    public void aliceSendsDeleteNonExistentAttachment() throws Exception {
        String token = state.getAccessToken();
        String expenseId = state.getExpenseId();
        Assertions.assertNotNull(expenseId, "Expense ID must be set");

        ServiceResponse response = AppFactory.getService()
                .deleteAttachment(token, expenseId, "99999");
        state.setLastResponse(response);
    }

    @Given("alice has uploaded file {string} with content type {string} to the entry")
    public void aliceHasUploadedFileToEntry(String filename,
            String contentType) throws Exception {
        aliceUploadsFileToExpense(filename, contentType);
        ServiceResponse resp = state.getLastResponse();
        if (resp != null && resp.statusCode() == 201) {
            JsonObject body = resp.body();
            if (body != null) {
                state.setAttachmentId(body.getString("id"));
            }
        }
    }

    @Given("^bob has created an entry with body \\{ \"amount\": \"([^\"]*)\", \"currency\": \"([^\"]*)\", \"category\": \"([^\"]*)\", \"description\": \"([^\"]*)\", \"date\": \"([^\"]*)\", \"type\": \"([^\"]*)\" \\}$")
    public void bobHasCreatedEntry(String amount, String currency, String category,
            String description, String date, String type) throws Exception {
        String bobToken = state.getBobAccessToken();
        Assertions.assertNotNull(bobToken, "Bob's access token must be set");
        ServiceResponse resp = AppFactory.getService()
                .createExpense(bobToken, amount, currency, category, description, date, type);
        Assertions.assertEquals(201, resp.statusCode(),
                "Expected 201 creating bob's entry but got " + resp.statusCode());
        JsonObject body = resp.body();
        Assertions.assertNotNull(body);
        state.setBobExpenseId(body.getString("id"));
    }

    @Then("the response body should contain {int} items in the {string} array")
    public void responseBodyContainsItemsInArray(int count, String field) {
        ServiceResponse response = state.getLastResponse();
        Assertions.assertNotNull(response);
        JsonObject body = response.body();
        Assertions.assertNotNull(body);
        JsonArray arr = body.getJsonArray(field);
        Assertions.assertNotNull(arr, "Expected '" + field + "' array in response");
        Assertions.assertEquals(count, arr.size(),
                "Expected " + count + " items in '" + field + "' but got " + arr.size());
    }

    @Then("the response body should contain an attachment with {string} equal to {string}")
    public void responseBodyContainsAttachmentWithField(String field, String value) {
        ServiceResponse response = state.getLastResponse();
        Assertions.assertNotNull(response);
        JsonObject body = response.body();
        Assertions.assertNotNull(body);
        JsonArray attachments = body.getJsonArray("attachments");
        Assertions.assertNotNull(attachments, "Expected 'attachments' array");
        boolean found = false;
        for (int i = 0; i < attachments.size(); i++) {
            JsonObject att = attachments.getJsonObject(i);
            if (value.equals(att.getString(field))) {
                found = true;
                break;
            }
        }
        Assertions.assertTrue(found,
                "Expected attachment with '" + field + "' = '" + value + "'");
    }

    private byte[] createSampleContent(String filename) {
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
            return new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};
        } else if (filename.endsWith(".pdf")) {
            return "%PDF-1.4 sample".getBytes();
        } else {
            return "sample content".getBytes();
        }
    }
}
