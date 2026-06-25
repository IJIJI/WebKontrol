import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';

// Database table entity
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// Automatically generate a Zod schema for inserting data, with custom runtime validation.
export const insertSettingSchema = createInsertSchema(settings, {
  key: (schema) => schema.min(3).max(50),
  value: (schema) => schema.min(1, "Value cannot be empty"),
});