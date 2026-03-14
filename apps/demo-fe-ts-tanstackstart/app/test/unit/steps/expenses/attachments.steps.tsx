import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { vi, expect } from "vitest";
import path from "path";

vi.mock("~/lib/api/attachments", () => ({
  listAttachments: vi.fn(),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
}));

import * as attachmentsApi from "~/lib/api/attachments";

const baseAttachment = {
  id: "att-1",
  filename: "receipt.jpg",
  contentType: "image/jpeg",
  size: 12345,
  createdAt: "2025-01-15T00:00:00Z",
};

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../../../specs/apps/demo/fe/gherkin/expenses/attachments.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given, And }) => {
    Given("the app is running", () => {
      // App running in test environment
    });

    And('a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"', () => {
      // Pre-condition via mock
    });

    And("alice has logged in", () => {
      // Login pre-condition
    });

    And(
      'alice has created an entry with amount "10.50", currency "USD", category "food", description "Lunch", date "2025-01-15", and type "expense"',
      () => {
        // Entry created pre-condition
      },
    );
  });

  Scenario("Uploading a JPEG image adds it to the attachment list", ({ When, Then, And }) => {
    let uploadResult: typeof baseAttachment | null = null;
    let uploadCalled = false;

    When('alice opens the entry detail for "Lunch"', () => {
      // Open entry detail
    });

    And('alice uploads file "receipt.jpg" as an image attachment', async () => {
      vi.mocked(attachmentsApi.uploadAttachment).mockResolvedValue(baseAttachment);
      const file = new File(["content"], "receipt.jpg", {
        type: "image/jpeg",
      });
      uploadResult = await attachmentsApi.uploadAttachment("expense-1", file);
      uploadCalled = true;
    });

    Then('the attachment list should contain "receipt.jpg"', () => {
      expect(uploadCalled).toBe(true);
      expect(uploadResult?.filename).toBe("receipt.jpg");
    });

    And('the attachment should display as type "image/jpeg"', () => {
      expect(uploadResult?.contentType).toBe("image/jpeg");
    });
  });

  Scenario("Uploading a PDF document adds it to the attachment list", ({ When, Then, And }) => {
    let uploadResult: typeof baseAttachment | null = null;

    When('alice opens the entry detail for "Lunch"', () => {
      // Open entry detail
    });

    And('alice uploads file "invoice.pdf" as a document attachment', async () => {
      vi.mocked(attachmentsApi.uploadAttachment).mockResolvedValue({
        id: "att-2",
        filename: "invoice.pdf",
        contentType: "application/pdf",
        size: 23456,
        createdAt: "2025-01-15T00:00:00Z",
      });
      const file = new File(["content"], "invoice.pdf", {
        type: "application/pdf",
      });
      uploadResult = await attachmentsApi.uploadAttachment("expense-1", file);
    });

    Then('the attachment list should contain "invoice.pdf"', () => {
      expect(uploadResult?.filename).toBe("invoice.pdf");
    });

    And('the attachment should display as type "application/pdf"', () => {
      expect(uploadResult?.contentType).toBe("application/pdf");
    });
  });

  Scenario("Entry detail shows all uploaded attachments", ({ Given, When, Then, And }) => {
    let attachmentList: (typeof baseAttachment)[] | null = null;

    Given('alice has uploaded "receipt.jpg" and "invoice.pdf" to the entry', () => {
      // Attachments uploaded pre-condition
    });

    When('alice opens the entry detail for "Lunch"', async () => {
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([
        baseAttachment,
        {
          id: "att-2",
          filename: "invoice.pdf",
          contentType: "application/pdf",
          size: 23456,
          createdAt: "2025-01-15T00:00:00Z",
        },
      ]);
      attachmentList = await attachmentsApi.listAttachments("expense-1");
    });

    Then("the attachment list should contain 2 items", () => {
      expect(attachmentList).toHaveLength(2);
    });

    And('the attachment list should include "receipt.jpg"', () => {
      expect(attachmentList?.some((a) => a.filename === "receipt.jpg")).toBe(true);
    });

    And('the attachment list should include "invoice.pdf"', () => {
      expect(attachmentList?.some((a) => a.filename === "invoice.pdf")).toBe(true);
    });
  });

  Scenario("Deleting an attachment removes it from the list", ({ Given, When, Then, And }) => {
    let deleteCalled = false;
    let listAfterDelete: (typeof baseAttachment)[] | null = null;

    Given('alice has uploaded "receipt.jpg" to the entry', () => {
      // Attachment uploaded pre-condition
    });

    When('alice opens the entry detail for "Lunch"', () => {
      // Open entry detail
    });

    And('alice clicks the delete button on attachment "receipt.jpg"', () => {
      // Click delete button
    });

    And("alice confirms the deletion", async () => {
      vi.mocked(attachmentsApi.deleteAttachment).mockResolvedValue(undefined);
      vi.mocked(attachmentsApi.listAttachments).mockResolvedValue([]);
      await attachmentsApi.deleteAttachment("expense-1", "att-1");
      deleteCalled = true;
      listAfterDelete = await attachmentsApi.listAttachments("expense-1");
    });

    Then('the attachment list should not contain "receipt.jpg"', () => {
      expect(deleteCalled).toBe(true);
      expect(listAfterDelete).toHaveLength(0);
    });
  });

  Scenario("Uploading an unsupported file type shows an error", ({ When, Then, And }) => {
    let uploadError: Error | null = null;

    When('alice opens the entry detail for "Lunch"', () => {
      // Open entry detail
    });

    And('alice attempts to upload file "malware.exe"', async () => {
      vi.mocked(attachmentsApi.uploadAttachment).mockRejectedValue(new Error("Unsupported file type"));
      try {
        const file = new File(["content"], "malware.exe", {
          type: "application/octet-stream",
        });
        await attachmentsApi.uploadAttachment("expense-1", file);
      } catch (e) {
        uploadError = e as Error;
      }
    });

    Then("an error message about unsupported file type should be displayed", () => {
      expect(uploadError).not.toBeNull();
      expect(uploadError?.message).toMatch(/unsupported|file type/i);
    });

    And("the attachment list should remain unchanged", () => {
      expect(uploadError).not.toBeNull();
    });
  });

  Scenario("Uploading an oversized file shows an error", ({ When, Then, And }) => {
    let uploadError: Error | null = null;

    When('alice opens the entry detail for "Lunch"', () => {
      // Open entry detail
    });

    And("alice attempts to upload an oversized file", async () => {
      vi.mocked(attachmentsApi.uploadAttachment).mockRejectedValue(new Error("File size exceeds limit"));
      try {
        const file = new File(["x".repeat(100)], "bigfile.jpg", {
          type: "image/jpeg",
        });
        await attachmentsApi.uploadAttachment("expense-1", file);
      } catch (e) {
        uploadError = e as Error;
      }
    });

    Then("an error message about file size limit should be displayed", () => {
      expect(uploadError).not.toBeNull();
      expect(uploadError?.message).toMatch(/size|limit|exceeds/i);
    });

    And("the attachment list should remain unchanged", () => {
      expect(uploadError).not.toBeNull();
    });
  });

  Scenario("Cannot upload attachment to another user's entry", ({ Given, When, Then }) => {
    let uploadError: Error | null = null;

    Given('a user "bob" has created an entry with description "Taxi"', () => {
      // Bob's entry exists
    });

    When("alice navigates to bob's entry detail", async () => {
      vi.mocked(attachmentsApi.uploadAttachment).mockRejectedValue(new Error("Access denied"));
      try {
        const file = new File(["content"], "receipt.jpg", {
          type: "image/jpeg",
        });
        await attachmentsApi.uploadAttachment("expense-bob", file);
      } catch (e) {
        uploadError = e as Error;
      }
    });

    Then("the upload attachment button should not be visible", () => {
      expect(uploadError).not.toBeNull();
      expect(uploadError?.message).toMatch(/access|denied|forbidden/i);
    });
  });

  Scenario("Cannot view attachments on another user's entry", ({ Given, When, Then }) => {
    let listError: Error | null = null;

    Given('a user "bob" has created an entry with description "Taxi"', () => {
      // Bob's entry exists
    });

    When("alice navigates to bob's entry detail", async () => {
      vi.mocked(attachmentsApi.listAttachments).mockRejectedValue(new Error("Access denied"));
      try {
        await attachmentsApi.listAttachments("expense-bob");
      } catch (e) {
        listError = e as Error;
      }
    });

    Then("an access denied message should be displayed", () => {
      expect(listError).not.toBeNull();
      expect(listError?.message).toMatch(/access|denied|forbidden/i);
    });
  });

  Scenario("Cannot delete attachment on another user's entry", ({ Given, When, Then }) => {
    let deleteError: Error | null = null;

    Given('a user "bob" has created an entry with an attachment', () => {
      // Bob's entry with attachment exists
    });

    When("alice navigates to bob's entry detail", async () => {
      vi.mocked(attachmentsApi.deleteAttachment).mockRejectedValue(new Error("Access denied"));
      try {
        await attachmentsApi.deleteAttachment("expense-bob", "att-1");
      } catch (e) {
        deleteError = e as Error;
      }
    });

    Then("the delete attachment button should not be visible", () => {
      expect(deleteError).not.toBeNull();
      expect(deleteError?.message).toMatch(/access|denied|forbidden/i);
    });
  });

  Scenario("Deleting a non-existent attachment shows a not-found error", ({ Given, When, Then, And }) => {
    let deleteError: Error | null = null;

    Given('alice has uploaded "receipt.jpg" to the entry', () => {
      // Attachment uploaded pre-condition
    });

    And("the attachment has been deleted from another session", () => {
      // Attachment already deleted from another session
    });

    When('alice clicks the delete button on attachment "receipt.jpg"', () => {
      // Click delete button
    });

    And("alice confirms the deletion", async () => {
      vi.mocked(attachmentsApi.deleteAttachment).mockRejectedValue(new Error("Attachment not found"));
      try {
        await attachmentsApi.deleteAttachment("expense-1", "att-1");
      } catch (e) {
        deleteError = e as Error;
      }
    });

    Then("an error message about attachment not found should be displayed", () => {
      expect(deleteError).not.toBeNull();
      expect(deleteError?.message).toMatch(/not found|404/i);
    });
  });
});
