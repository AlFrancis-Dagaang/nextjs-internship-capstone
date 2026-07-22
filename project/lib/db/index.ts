import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, asc } from "drizzle-orm";
import * as schema from "./schema";
import { projects, lists, tasks } from "./schema";
import type { InferInsertModel } from "drizzle-orm";
import { users } from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

export const queries = {
  // add alongside the existing queries.projects / queries.lists / queries.tasks
  users: {
    getByClerkId: async (clerkId: string) => {
      return db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
    },
    upsert: async (data: { clerkId: string; email: string; name: string }) => {
      const existing = await db.query.users.findFirst({
        where: eq(users.clerkId, data.clerkId),
      });
      if (existing) {
        const [updated] = await db
          .update(users)
          .set({ email: data.email, name: data.name, updatedAt: new Date() })
          .where(eq(users.clerkId, data.clerkId))
          .returning();
        return updated;
      }
      const [created] = await db.insert(users).values(data).returning();
      return created;
    },
  },

  projects: {
    getAll: async () => {
      return db.select().from(projects);
    },
    getById: async (id: string) => {
      return db.query.projects.findFirst({
        where: eq(projects.id, id),
        with: { lists: { with: { tasks: true } } },
      });
    },
    getByOwner: async (ownerId: string) => {
      return db.select().from(projects).where(eq(projects.ownerId, ownerId));
    },
    create: async (data: InferInsertModel<typeof projects>) => {
      const [project] = await db.insert(projects).values(data).returning();
      return project;
    },
    update: async (
      id: string,
      data: Partial<InferInsertModel<typeof projects>>,
    ) => {
      const [project] = await db
        .update(projects)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();
      return project;
    },
    delete: async (id: string) => {
      await db.delete(projects).where(eq(projects.id, id));
    },
  },
  lists: {
    getByProject: async (projectId: string) => {
      return db
        .select()
        .from(lists)
        .where(eq(lists.projectId, projectId))
        .orderBy(asc(lists.position));
    },
    getById: async (id: string) => {
      return db.query.lists.findFirst({ where: eq(lists.id, id) });
    },
    create: async (data: InferInsertModel<typeof lists>) => {
      const [list] = await db.insert(lists).values(data).returning();
      return list;
    },
    update: async (
      id: string,
      data: Partial<InferInsertModel<typeof lists>>,
    ) => {
      const [list] = await db
        .update(lists)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(lists.id, id))
        .returning();
      return list;
    },
    delete: async (id: string) => {
      await db.delete(lists).where(eq(lists.id, id));
    },
  },
  tasks: {
    getByProject: async (projectId: string) => {
      const listsWithTasks = await db.query.lists.findMany({
        where: eq(lists.projectId, projectId),
        with: { tasks: true },
      });
      return listsWithTasks.flatMap((list) => list.tasks);
    },
    getByList: async (listId: string) => {
      return db
        .select()
        .from(tasks)
        .where(eq(tasks.listId, listId))
        .orderBy(asc(tasks.position));
    },
    getById: async (id: string) => {
      return db.query.tasks.findFirst({ where: eq(tasks.id, id) });
    },
    create: async (data: InferInsertModel<typeof tasks>) => {
      const [task] = await db.insert(tasks).values(data).returning();
      return task;
    },
    update: async (
      id: string,
      data: Partial<InferInsertModel<typeof tasks>>,
    ) => {
      const [task] = await db
        .update(tasks)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(tasks.id, id))
        .returning();
      return task;
    },
    delete: async (id: string) => {
      await db.delete(tasks).where(eq(tasks.id, id));
    },
  },
};
