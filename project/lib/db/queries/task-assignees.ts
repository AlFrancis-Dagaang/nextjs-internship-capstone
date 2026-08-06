import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { taskAssignees, users } from "../schema";

export const taskAssigneesQueries = {
  getByTask: async (taskId: string) => {
    return db
      .select({
        id: taskAssignees.id,
        taskId: taskAssignees.taskId,
        userId: taskAssignees.userId,
        createdAt: taskAssignees.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(taskAssignees)
      .innerJoin(users, eq(taskAssignees.userId, users.id))
      .where(eq(taskAssignees.taskId, taskId));
  },
  getByTaskAndUser: async (taskId: string, userId: string) => {
    return db.query.taskAssignees.findFirst({
      where: and(
        eq(taskAssignees.taskId, taskId),
        eq(taskAssignees.userId, userId),
      ),
    });
  },
  add: async (taskId: string, userId: string) => {
    const [assignment] = await db
      .insert(taskAssignees)
      .values({ taskId, userId })
      .returning();
    return assignment;
  },
  remove: async (taskId: string, userId: string) => {
    await db
      .delete(taskAssignees)
      .where(
        and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.userId, userId)),
      );
  },
};
