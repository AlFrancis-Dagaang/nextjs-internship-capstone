import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { lists, taskAssignees, tasks, users } from "../schema";

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
  getByProject: async (projectId: string) => {
    return db
      .select({
        taskId: taskAssignees.taskId,
        userId: taskAssignees.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(taskAssignees)
      .innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .innerJoin(users, eq(taskAssignees.userId, users.id))
      .where(eq(lists.projectId, projectId));
  },
  getByProjectAndUser: async (projectId: string, userId: string) => {
    return db
      .select({
        taskId: taskAssignees.taskId,
        userId: taskAssignees.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(taskAssignees)
      .innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .innerJoin(users, eq(taskAssignees.userId, users.id))
      .where(
        and(eq(lists.projectId, projectId), eq(taskAssignees.userId, userId)),
      );
  },
  getActiveCountByProjectAndUser: async (projectId: string, userId: string) => {
    const rows = await db
      .select({ taskId: taskAssignees.taskId })
      .from(taskAssignees)
      .innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .where(
        and(
          eq(lists.projectId, projectId),
          eq(taskAssignees.userId, userId),
          eq(tasks.isArchived, false),
        ),
      );
    return rows.length;
  },
};
