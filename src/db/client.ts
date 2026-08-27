import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

let client: postgres.Sql | undefined;

export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to connect to PostgreSQL.");
  }

  client ??= postgres(databaseUrl, {
    prepare: false,
  });

  return drizzle(client, { schema });
}

export async function closeDatabaseConnection() {
  if (!client) {
    return;
  }

  await client.end();
  client = undefined;
}
