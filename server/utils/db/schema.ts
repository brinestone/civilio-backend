import { bigint, boolean, mysqlEnum, timestamp, varchar, mysqlTable } from "drizzle-orm/mysql-core";

// Change 'civilio.table' to just 'mysqlTable'
export const notifications = mysqlTable('tracked_changes', {
  id: bigint({ mode: 'number', unsigned: true }).primaryKey().autoincrement(),
  operation: mysqlEnum('operation', ['insert', 'update', 'delete']).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  changedAt: timestamp('changed_at', { mode: 'date' }).notNull().defaultNow(),
  processed: boolean('processed').notNull().default(false),
  role: varchar({ length: 20 })
});