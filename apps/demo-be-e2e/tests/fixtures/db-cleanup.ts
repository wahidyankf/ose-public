import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://organiclever:organiclever@localhost:5432/demo_be";

export async function cleanupDatabase(): Promise<void> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    // Truncate all tables in a single statement; IF EXISTS handles backends
    // whose PostgreSQL schema may not include every table.
    await client.query(
      "TRUNCATE TABLE IF EXISTS attachments, expenses, revoked_tokens, refresh_tokens, users CASCADE",
    );
  } finally {
    await client.end();
  }
}

export async function setAdminRole(username: string): Promise<void> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query("UPDATE users SET role = 'ADMIN' WHERE username = $1", [username]);
  } finally {
    await client.end();
  }
}
