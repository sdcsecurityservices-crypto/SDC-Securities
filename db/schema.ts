import { sqliteTable,text,integer } from 'drizzle-orm/sqlite-core';
export const workspaces=sqliteTable('demo_workspaces',{owner:text('owner').primaryKey(),state:text('state').notNull(),version:integer('version').notNull().default(0)});
