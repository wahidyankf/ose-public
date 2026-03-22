import { db, ensureMigrations } from "@/db/client";
import { createUserRepository } from "./user-repository";
import { createSessionRepository } from "./session-repository";
import { createExpenseRepository } from "./expense-repository";
import { createAttachmentRepository } from "./attachment-repository";
import type { Repositories } from "./interfaces";

let _repos: Repositories | null = null;
let _migrationPromise: Promise<void> | null = null;

export function getRepositories(): Repositories {
  if (!_repos) {
    _repos = {
      users: createUserRepository(db),
      sessions: createSessionRepository(db),
      expenses: createExpenseRepository(db),
      attachments: createAttachmentRepository(db),
    };
    _migrationPromise = ensureMigrations();
  }
  return _repos;
}

export async function ensureReady(): Promise<void> {
  getRepositories();
  if (_migrationPromise) await _migrationPromise;
}
