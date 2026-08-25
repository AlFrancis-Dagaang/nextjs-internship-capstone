import { eq, ilike, or } from "drizzle-orm";
import { db } from "../client";
import { type NotificationType, users } from "../schema";

export const usersQueries = {
  getByClerkId: async (clerkId: string) => {
    return db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
  },
  getByEmail: async (email: string) => {
    return db.query.users.findFirst({ where: eq(users.email, email) });
  },
  upsert: async (data: {
    clerkId: string;
    email: string;
    name: string;
    imageUrl?: string | null;
    hasImage?: boolean;
  }) => {
    const [result] = await db
      .insert(users)
      .values({
        clerkId: data.clerkId,
        email: data.email,
        name: data.name,
        imageUrl: data.imageUrl,
        hasImage: data.hasImage ?? false,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          email: data.email,
          name: data.name,
          imageUrl: data.imageUrl,
          hasImage: data.hasImage ?? false,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  },
  searchByNameOrEmailPrefix: async (query: string, limit = 8) => {
    return db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        imageUrl: users.imageUrl,
      })
      .from(users)
      .where(
        or(ilike(users.name, `%${query}%`), ilike(users.email, `%${query}%`)),
      )
      .limit(limit);
  },
  getById: async (id: string) => {
    return db.query.users.findFirst({ where: eq(users.id, id) });
  },
  updateNotificationPreferences: async (
    userId: string,
    patch: Partial<Record<NotificationType, boolean>>,
  ) => {
    const existing = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    const merged = { ...(existing?.notificationPreferences ?? {}), ...patch };
    const [updated] = await db
      .update(users)
      .set({ notificationPreferences: merged, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  },
};
