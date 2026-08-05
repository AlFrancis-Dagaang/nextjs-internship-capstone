import { eq, ilike } from "drizzle-orm";
import { db } from "../client";
import { users } from "../schema";

export const usersQueries = {
  getByClerkId: async (clerkId: string) => {
    return db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  },
  getByEmail: async (email: string) => {
    return db.query.users.findFirst({ where: eq(users.email, email) });
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
  searchByEmailPrefix: async (query: string, limit = 8) => {
    return db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(ilike(users.email, `${query}%`))
      .limit(limit);
  },
  getById: async (id: string) => {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  },
};
