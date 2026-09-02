import { sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";

// Database table entity
// export const settings = sqliteTable('settings', {
//   key: text('key').primaryKey(),
//   value: text('value').notNull(),
// });

export const settings = sqliteTable(
  "settings",
  {
    domain: text("domain").notNull(),
    type: text("type").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
  },
  (table) => [primaryKey({ columns: [table.domain, table.type, table.key] })],
);

// Automatically generate a Zod schema for inserting data, with custom runtime validation.
export const insertSettingSchema = createInsertSchema(settings, {
  domain: (schema) => schema.min(2).max(50),
  type: (schema) => schema.min(2).max(50),
  key: (schema) => schema.min(1).max(50),
  value: (schema) => schema.min(1, "Value cannot be empty"),
});
