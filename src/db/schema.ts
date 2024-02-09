import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const videos = sqliteTable("videos", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
});
