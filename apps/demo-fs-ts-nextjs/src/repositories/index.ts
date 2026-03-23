import { db, ensureMigrations } from "@/db/client";
import { createUserRepository } from "./user-repository";
import { createSessionRepository } from "./session-repository";
import { createExpenseRepository } from "./expense-repository";
import { createAttachmentRepository } from "./attachment-repository";
import type { Repositories } from "./interfaces";

let _repos: Repositories | null = null;
let _ready: Promise<void> | null = null;

function initRepos(): Repositories {
  if (!_repos) {
    _repos = {
      users: createUserRepository(db),
      sessions: createSessionRepository(db),
      expenses: createExpenseRepository(db),
      attachments: createAttachmentRepository(db),
    };
    _ready = ensureMigrations();
  }
  return _repos;
}

export async function getRepositories(): Promise<Repositories> {
  const repos = initRepos();
  if (_ready) await _ready;
  return repos;
}
