import {integer, sqliteTable, text} from 'drizzle-orm/sqlite-core';
export const gameRooms=sqliteTable('game_rooms',{code:text('code').primaryKey(),teacherHash:text('teacher_hash').notNull(),state:text('state').notNull(),revision:integer('revision').notNull().default(0),createdAt:integer('created_at').notNull()});
export const gameArchives=sqliteTable('game_archives',{id:text('id').primaryKey(),code:text('code').notNull().unique(),title:text('title').notNull(),result:text('result').notNull(),access:text('access').notNull(),endedAt:integer('ended_at').notNull()});
