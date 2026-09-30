import { jsonb, pgTable, timestamp, uuid, varchar, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmsTable } from "./farms";

export const advisoriesTable = pgTable("advisories", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farmsTable.id, { onDelete: "cascade" }),
  targetSeason: varchar("target_season", { length: 100 }).notNull(),
  budgetLevel: varchar("budget_level", { length: 50 }).notNull(),
  specificConcerns: text("specific_concerns").notNull(),
  aiRawResponse: jsonb("ai_raw_response").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdvisorySchema = createInsertSchema(advisoriesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAdvisory = z.infer<typeof insertAdvisorySchema>;
export type Advisory = typeof advisoriesTable.$inferSelect;