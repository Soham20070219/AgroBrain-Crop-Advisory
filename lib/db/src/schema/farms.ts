import { pgTable, timestamp, uuid, varchar, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const farmsTable = pgTable("farms", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  region: varchar("region", { length: 255 }).notNull(),
  areaAcres: numeric("area_acres", { precision: 10, scale: 2, mode: "number" }).notNull(),
  soilType: varchar("soil_type", { length: 100 }).notNull(),
  irrigationMethod: varchar("irrigation_method", { length: 100 }).notNull(),
  climateZone: varchar("climate_zone", { length: 100 }).notNull(),
  historicCrop: varchar("historic_crop", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFarmSchema = createInsertSchema(farmsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type Farm = typeof farmsTable.$inferSelect;