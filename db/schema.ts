import {integer, sqliteTable, text} from 'drizzle-orm/sqlite-core';
export const gameRooms=sqliteTable('game_rooms',{code:text('code').primaryKey(),teacherHash:text('teacher_hash').notNull(),state:text('state').notNull(),revision:integer('revision').notNull().default(0),createdAt:integer('created_at').notNull()});
