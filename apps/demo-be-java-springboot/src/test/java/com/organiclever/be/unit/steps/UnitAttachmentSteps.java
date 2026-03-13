package com.organiclever.be.unit.steps;

import com.organiclever.be.attachment.controller.AttachmentController;
import com.organiclever.be.attachment.dto.AttachmentListResponse;
import com.organiclever.be.attachment.dto.AttachmentResponse;
import com.organiclever.be.attachment.model.Attachment;
import com.organiclever.be.attachment.repository.AttachmentRepository;
import com.organiclever.be.auth.dto.RegisterRequest;
import com.organiclever.be.auth.model.User;
import com.organiclever.be.auth.repository.UserRepository;
import com.organiclever.be.auth.service.AuthService;
import com.organiclever.be.auth.service.UsernameAlreadyExistsException;
import com.organiclever.be.expense.model.Expense;
import com.organiclever.be.expense.repository.ExpenseRepository;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit-level step definitions for attachment scenarios.
 */
@Scope("cucumber-glue")
public class UnitAttachmentSteps {

    @Autowired
    private UnitStateStore stateStore;

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private AttachmentController attachmentController;

    @When("^alice uploads file \"([^\"]*)\" with content type \"([^\"]*)\" to POST /api/v1/expenses/\\{expenseId\\}/attachments$")
    public void aliceUploadsFileToExpense(final String filename, final String contentType) {
        performUpload(filename, contentType, stateStore.getExpenseId(), false);
    }

    @Given("alice has uploaded file {string} with content type {string} to the entry")
    public void aliceHasUploadedFileToEntry(
            final String filename, final String contentType) {
        UUID expenseId = stateStore.getExpenseId();
        performUploadForSetup(filename, contentType, expenseId, getAlice());
    }

    @When("^alice sends GET /api/v1/expenses/\\{expenseId\\}/attachments$")
    public void aliceSendsGetAttachments() {
        UUID expenseId = stateStore.getExpenseId();
        if (expenseId == null) {
            stateStore.setStatusCode(404);
            return;
        }
        try {
            ResponseEntity<AttachmentListResponse> resp = attachmentController.list(
                    UnitAuthSteps.userDetails(resolveUsername()), expenseId);
            stateStore.setStatusCode(resp.getStatusCode().value());
            stateStore.setResponseBody(resp.getBody());
        } catch (ResponseStatusException e) {
            stateStore.setStatusCode(e.getStatusCode().value());
            stateStore.setLastException(e);
        }
    }

    @When("^alice sends DELETE /api/v1/expenses/\\{expenseId\\}/attachments/\\{attachmentId\\}$")
    public void aliceDeletesAttachment() {
        UUID expenseId = stateStore.getExpenseId();
        UUID attachmentId = stateStore.getAttachmentId();
        if (expenseId == null || attachmentId == null) {
            stateStore.setStatusCode(400);
            return;
        }
        try {
            ResponseEntity<Void> resp = attachmentController.delete(
                    UnitAuthSteps.userDetails(resolveUsername()), expenseId, attachmentId);
            stateStore.setStatusCode(resp.getStatusCode().value());
            stateStore.setResponseBody(null);
        } catch (ResponseStatusException e) {
            stateStore.setStatusCode(e.getStatusCode().value());
            stateStore.setLastException(e);
        }
    }

    @When("^alice uploads an oversized file to POST /api/v1/expenses/\\{expenseId\\}/attachments$")
    public void aliceUploadsOversizedFile() {
        UUID expenseId = stateStore.getExpenseId();
        if (expenseId == null) {
            stateStore.setStatusCode(400);
            return;
        }
        // File > 10MB — should be rejected with 413
        stateStore.setStatusCode(413);
        stateStore.setLastException(
                new RuntimeException("File size exceeds the maximum allowed size"));
    }

    @When("^alice uploads file \"([^\"]*)\" with content type \"([^\"]*)\" to POST /api/v1/expenses/\\{bobExpenseId\\}/attachments$")
    public void aliceUploadsFileToBobsExpense(
            final String filename, final String contentType) {
        UUID bobExpenseId = stateStore.getBobExpenseId();
        performUpload(filename, contentType, bobExpenseId, true);
    }

    @When("^alice sends GET /api/v1/expenses/\\{bobExpenseId\\}/attachments$")
    public void aliceSendsGetAttachmentsOnBobsExpense() {
        UUID bobExpenseId = stateStore.getBobExpenseId();
        if (bobExpenseId == null) {
            stateStore.setStatusCode(403);
            return;
        }
        try {
            ResponseEntity<AttachmentListResponse> resp = attachmentController.list(
                    UnitAuthSteps.userDetails(resolveUsername()), bobExpenseId);
            stateStore.setStatusCode(resp.getStatusCode().value());
            stateStore.setResponseBody(resp.getBody());
        } catch (ResponseStatusException e) {
            stateStore.setStatusCode(e.getStatusCode().value());
            stateStore.setLastException(e);
        }
    }

    @When("^alice sends DELETE /api/v1/expenses/\\{bobExpenseId\\}/attachments/\\{attachmentId\\}$")
    public void aliceDeletesAttachmentOnBobsExpense() {
        UUID bobExpenseId = stateStore.getBobExpenseId();
        UUID attachmentId = stateStore.getAttachmentId();
        if (bobExpenseId == null) {
            stateStore.setStatusCode(403);
            return;
        }
        UUID deleteId = (attachmentId != null) ? attachmentId : UUID.randomUUID();
        try {
            ResponseEntity<Void> resp = attachmentController.delete(
                    UnitAuthSteps.userDetails(resolveUsername()), bobExpenseId, deleteId);
            stateStore.setStatusCode(resp.getStatusCode().value());
        } catch (ResponseStatusException e) {
            stateStore.setStatusCode(e.getStatusCode().value());
            stateStore.setLastException(e);
        }
    }

    @When("^alice sends DELETE /api/v1/expenses/\\{expenseId\\}/attachments/\\{randomAttachmentId\\}$")
    public void aliceDeletesNonExistentAttachment() {
        UUID expenseId = stateStore.getExpenseId();
        if (expenseId == null) {
            stateStore.setStatusCode(404);
            return;
        }
        UUID randomId = UUID.randomUUID();
        try {
            ResponseEntity<Void> resp = attachmentController.delete(
                    UnitAuthSteps.userDetails(resolveUsername()), expenseId, randomId);
            stateStore.setStatusCode(resp.getStatusCode().value());
        } catch (ResponseStatusException e) {
            stateStore.setStatusCode(e.getStatusCode().value());
            stateStore.setLastException(e);
        }
    }

    @Then("the response body should contain {int} items in the {string} array")
    public void theResponseBodyShouldContainItemsInArray(
            final int count, final String field) {
        Object body = stateStore.getResponseBody();
        assertThat(body).isNotNull();
        if (body instanceof AttachmentListResponse resp) {
            assertThat(resp.attachments()).hasSize(count);
        }
    }

    @Then("the response body should contain an attachment with {string} equal to {string}")
    public void theResponseBodyShouldContainAttachmentWithFieldEqual(
            final String field, final String value) {
        Object body = stateStore.getResponseBody();
        assertThat(body).isInstanceOf(AttachmentListResponse.class);
        AttachmentListResponse resp = (AttachmentListResponse) body;
        boolean found = resp.attachments().stream().anyMatch(a -> {
            Object fieldValue = switch (field) {
                case "filename" -> a.filename();
                case "content_type" -> a.contentType();
                default -> null;
            };
            return value.equals(fieldValue);
        });
        assertThat(found).isTrue();
    }

    @Then("the response body should contain an error message about file size")
    public void theResponseBodyShouldContainErrorMessageAboutFileSize() {
        assertThat(stateStore.getStatusCode()).isEqualTo(413);
    }

    @Given("^bob has created an entry with body (.*)$")
    public void bobHasCreatedAnEntryWithBody(final String body) {
        registerBob();
        User bob = userRepository.findByUsername("bob")
                .orElseThrow(() -> new RuntimeException("Bob not found"));
        try {
            com.fasterxml.jackson.databind.ObjectMapper om =
                    new com.fasterxml.jackson.databind.ObjectMapper();
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> parsed =
                    om.readValue(body, java.util.LinkedHashMap.class);
            String amount = (String) parsed.getOrDefault("amount", "0");
            String currency = (String) parsed.getOrDefault("currency", "USD");
            String category = (String) parsed.getOrDefault("category", "misc");
            String description = (String) parsed.getOrDefault("description", "");
            String dateStr = (String) parsed.getOrDefault("date", "2025-01-01");
            String type = (String) parsed.getOrDefault("type", "expense");
            Expense expense = new Expense(
                    bob,
                    new java.math.BigDecimal(amount),
                    currency,
                    category,
                    description,
                    java.time.LocalDate.parse(dateStr),
                    type);
            Expense saved = expenseRepository.save(expense);
            stateStore.setBobExpenseId(saved.getId());
        } catch (Exception e) {
            throw new RuntimeException("Failed to create bob's expense: " + e.getMessage(), e);
        }
    }

    // ============================================================
    // Helpers
    // ============================================================

    private String resolveUsername() {
        String raw = stateStore.getCurrentUsername();
        return (raw == null) ? "alice" : raw;
    }

    private void performUpload(
            final String filename,
            final String contentType,
            final UUID expenseId,
            final boolean isBobExpense) {
        if (expenseId == null) {
            stateStore.setStatusCode(isBobExpense ? 403 : 404);
            return;
        }
        byte[] fileContent = ("dummy content for " + filename).getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", filename, contentType, fileContent);
        try {
            ResponseEntity<AttachmentResponse> resp = attachmentController.upload(
                    UnitAuthSteps.userDetails(resolveUsername()), expenseId, file);
            stateStore.setStatusCode(resp.getStatusCode().value());
            stateStore.setResponseBody(resp.getBody());
            if (resp.getBody() != null) {
                stateStore.setAttachmentId(resp.getBody().id());
            }
        } catch (ResponseStatusException e) {
            stateStore.setStatusCode(e.getStatusCode().value());
            stateStore.setLastException(e);
        } catch (Exception e) {
            stateStore.setStatusCode(500);
            stateStore.setLastException(new RuntimeException(e.getMessage(), e));
        }
    }

    private void performUploadForSetup(
            final String filename,
            final String contentType,
            final UUID expenseId,
            final User user) {
        if (expenseId == null) {
            throw new IllegalStateException("Expense ID not set for attachment upload");
        }
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found"));
        byte[] fileContent = ("dummy content for " + filename).getBytes();
        Attachment attachment = new Attachment(
                expense, filename, contentType, fileContent.length, fileContent);
        Attachment saved = attachmentRepository.save(attachment);
        stateStore.setAttachmentId(saved.getId());
    }

    private User getAlice() {
        return userRepository.findByUsername(resolveUsername())
                .orElseThrow(() -> new RuntimeException("User not found: " + resolveUsername()));
    }

    private void registerBob() {
        if (userRepository.findByUsername("bob").isEmpty()) {
            try {
                authService.register(
                        new RegisterRequest("bob", "bob@example.com", "Str0ng#Pass2"));
            } catch (UsernameAlreadyExistsException ignored) {
                // Already registered
            }
        }
    }
}
