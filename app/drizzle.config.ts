import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/storage/schema.ts', // Path to your schema file
  out: './db/migrations',             // Where migrations will be saved
  dialect: 'sqlite',            // We are using SQLite
  dbCredentials: {
    url: './db/database.db',         // Your local SQLite database file
  },
});