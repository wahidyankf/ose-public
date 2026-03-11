import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { setResponse, getResponse } from "../../utils/response-store";
import {
  getTokenForUser,
  getLastExpenseId,
  getIdForUser,
  setLastAttachmentId,
  getLastAttachmentId,
} from "../../utils/token-store";

const { Given, When, Then } = createBdd();

// ---------------------------------------------------------------------------
// Attachment steps
// ---------------------------------------------------------------------------

When(
  /^alice uploads file "([^"]+)" with content type "([^"]+)" to POST \/api\/v1\/expenses\/\{expenseId\}\/attachments$/,
  async ({ request }, filename: string, contentType: string) => {
    const token = getTokenForUser("alice");
    const expenseId = getLastExpenseId();
    const res = await request.post(`/api/v1/expenses/${expenseId}/attachments`, {
      multipart: {
        file: {
          name: filename,
          mimeType: contentType,
          buffer: Buffer.from("fake-file-data"),
        },
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    setResponse(res);
    const body = (await res.json()) as Record<string, unknown>;
    if (body["id"]) {
      setLastAttachmentId(body["id"] as string);
    }
  },
);

Given(
  "alice has uploaded file {string} with content type {string} to the entry",
  async ({ request }, filename: string, contentType: string) => {
    const token = getTokenForUser("alice");
    const expenseId = getLastExpenseId();
    const res = await request.post(`/api/v1/expenses/${expenseId}/attachments`, {
      multipart: {
        file: {
          name: filename,
          mimeType: contentType,
          buffer: Buffer.from("fake-file-data"),
        },
      },
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json()) as Record<string, unknown>;
    if (body["id"]) {
      setLastAttachmentId(body["id"] as string);
    }
  },
);

When(/^alice sends GET \/api\/v1\/expenses\/\{expenseId\}\/attachments$/, async ({ request }) => {
  const token = getTokenForUser("alice");
  const expenseId = getLastExpenseId();
  setResponse(
    await request.get(`/api/v1/expenses/${expenseId}/attachments`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
});

Then(
  "the response body should contain {int} items in the {string} array",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, count: number, field: string) => {
    const body = (await getResponse().json()) as Record<string, unknown>;
    const arr = body[field] as unknown[];
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.length).toBe(count);
  },
);

Then(
  "the response body should contain an attachment with {string} equal to {string}",
  // oxlint-disable-next-line no-empty-pattern
  async ({}, field: string, value: string) => {
    const body = (await getResponse().json()) as Record<string, unknown>;
    const attachments = body["attachments"] as Array<Record<string, unknown>>;
    expect(Array.isArray(attachments)).toBe(true);
    const match = attachments.find((a) => a[field] === value);
    expect(match).toBeDefined();
  },
);

When(/^alice sends DELETE \/api\/v1\/expenses\/\{expenseId\}\/attachments\/\{attachmentId\}$/, async ({ request }) => {
  const token = getTokenForUser("alice");
  const expenseId = getLastExpenseId();
  const attachmentId = getLastAttachmentId();
  setResponse(
    await request.delete(`/api/v1/expenses/${expenseId}/attachments/${attachmentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
});

When(
  /^alice uploads an oversized file to POST \/api\/v1\/expenses\/\{expenseId\}\/attachments$/,
  async ({ request }) => {
    const token = getTokenForUser("alice");
    const expenseId = getLastExpenseId();
    // Create a buffer larger than the expected max size (e.g. 11MB to exceed 10MB limit)
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024, "x");
    setResponse(
      await request.post(`/api/v1/expenses/${expenseId}/attachments`, {
        multipart: {
          file: {
            name: "large-file.jpg",
            mimeType: "image/jpeg",
            buffer: oversizedBuffer,
          },
        },
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  },
);

Then("the response body should contain an error message about file size", async () => {
  const body = (await getResponse().json()) as { message: string };
  expect(body.message).toMatch(/size|large|limit|too big/i);
});

When(
  /^alice uploads file "([^"]+)" with content type "([^"]+)" to POST \/api\/v1\/expenses\/\{bobExpenseId\}\/attachments$/,
  async ({ request }, filename: string, contentType: string) => {
    const token = getTokenForUser("alice");
    const bobExpenseId = getIdForUser("bob_last_expense");
    setResponse(
      await request.post(`/api/v1/expenses/${bobExpenseId}/attachments`, {
        multipart: {
          file: {
            name: filename,
            mimeType: contentType,
            buffer: Buffer.from("fake-file-data"),
          },
        },
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  },
);

When(/^alice sends GET \/api\/v1\/expenses\/\{bobExpenseId\}\/attachments$/, async ({ request }) => {
  const token = getTokenForUser("alice");
  const bobExpenseId = getIdForUser("bob_last_expense");
  setResponse(
    await request.get(`/api/v1/expenses/${bobExpenseId}/attachments`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  );
});

When(
  /^alice sends DELETE \/api\/v1\/expenses\/\{bobExpenseId\}\/attachments\/\{attachmentId\}$/,
  async ({ request }) => {
    const token = getTokenForUser("alice");
    const bobExpenseId = getIdForUser("bob_last_expense");
    const attachmentId = getLastAttachmentId();
    setResponse(
      await request.delete(`/api/v1/expenses/${bobExpenseId}/attachments/${attachmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  },
);

When(
  /^alice sends DELETE \/api\/v1\/expenses\/\{expenseId\}\/attachments\/\{randomAttachmentId\}$/,
  async ({ request }) => {
    const token = getTokenForUser("alice");
    const expenseId = getLastExpenseId();
    const randomId = crypto.randomUUID();
    setResponse(
      await request.delete(`/api/v1/expenses/${expenseId}/attachments/${randomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
  },
);
