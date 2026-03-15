const BACKEND_URL = process.env["BACKEND_URL"] ?? "http://localhost:8201";

export async function resetDatabase(): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/v1/test/reset-db`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`resetDatabase failed: ${response.status}`);
  }
}

export async function registerUser(username: string, email: string, password: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!response.ok && response.status !== 409) {
    throw new Error(`registerUser failed: ${response.status}`);
  }
}

export async function loginUser(
  username: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(`loginUser failed: ${response.status}`);
  }
  const data = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

export async function promoteToAdmin(username: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/v1/test/promote-admin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!response.ok) {
    throw new Error(`promoteToAdmin failed: ${response.status}`);
  }
}

export async function deactivateUser(accessToken: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/v1/users/me/deactivate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`deactivateUser failed: ${response.status}`);
  }
}

export async function disableUser(adminToken: string, userId: string, reason: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/users/${userId}/disable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) {
    throw new Error(`disableUser failed: ${response.status}`);
  }
}

export async function createExpense(accessToken: string, data: object): Promise<object> {
  const response = await fetch(`${BACKEND_URL}/api/v1/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`createExpense failed: ${response.status}`);
  }
  return response.json() as Promise<object>;
}

export async function getCurrentUser(accessToken: string): Promise<{ id: string; username: string; email: string }> {
  const response = await fetch(`${BACKEND_URL}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`getCurrentUser failed: ${response.status}`);
  }
  return response.json() as Promise<{
    id: string;
    username: string;
    email: string;
  }>;
}

export async function lockUserByBruteForce(username: string, password: string): Promise<void> {
  // Attempt login with wrong password enough times to trigger lockout (typically 5)
  const wrongPassword = "WrongP@ssword999";
  for (let i = 0; i < 5; i++) {
    await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: wrongPassword }),
    });
  }
  void password;
}

export async function unlockUser(adminToken: string, userId: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/users/${userId}/unlock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`unlockUser failed: ${response.status}`);
  }
}

export async function enableUser(adminToken: string, userId: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/users/${userId}/enable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`enableUser failed: ${response.status}`);
  }
}

export async function listExpenses(
  accessToken: string,
): Promise<Array<{ id: string; description: string }>> {
  const response = await fetch(`${BACKEND_URL}/api/v1/expenses?page=0&size=100`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`listExpenses failed: ${response.status}`);
  }
  const data = (await response.json()) as { content: Array<{ id: string; description: string }> };
  return data.content;
}

export async function uploadAttachmentApi(
  accessToken: string,
  expenseId: string,
  filePath: string,
  filename: string,
  mimeType: string,
): Promise<void> {
  const fs = await import("node:fs");
  const fileBuffer = fs.readFileSync(filePath);
  const formData = new FormData();
  formData.append("file", new Blob([fileBuffer], { type: mimeType }), filename);
  const response = await fetch(`${BACKEND_URL}/api/v1/expenses/${expenseId}/attachments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`uploadAttachmentApi failed: ${response.status}`);
  }
}

export async function listAttachmentsApi(
  accessToken: string,
  expenseId: string,
): Promise<Array<{ id: string; filename: string }>> {
  const response = await fetch(`${BACKEND_URL}/api/v1/expenses/${expenseId}/attachments`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`listAttachmentsApi failed: ${response.status}`);
  }
  const data = (await response.json()) as
    | { attachments: Array<{ id: string; filename: string }> }
    | Array<{ id: string; filename: string }>;
  if (Array.isArray(data)) return data;
  return data.attachments ?? [];
}

export async function deleteAttachmentApi(
  accessToken: string,
  expenseId: string,
  attachmentId: string,
): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/v1/expenses/${expenseId}/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`deleteAttachmentApi failed: ${response.status}`);
  }
}

export async function getUserByUsername(
  adminToken: string,
  username: string,
): Promise<{ id: string; username: string; status: string }> {
  const response = await fetch(`${BACKEND_URL}/api/v1/admin/users?search=${encodeURIComponent(username)}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!response.ok) {
    throw new Error(`getUserByUsername failed: ${response.status}`);
  }
  const data = (await response.json()) as {
    content: Array<{ id: string; username: string; status: string }>;
  };
  const user = data.content[0];
  if (!user) {
    throw new Error(`User ${username} not found`);
  }
  return user;
}
