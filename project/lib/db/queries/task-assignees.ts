import { and, eq, inArray } from "drizzle-orm";
import { db } from "../client";
import { lists, projects, taskAssignees, tasks, users } from "../schema";
import { getTableColumns } from "drizzle-orm";

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
        userImageUrl: users.imageUrl,
        userHasImage: users.hasImage,
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
  // in your db queries file (e.g. queries.taskAssignees)
  getByProject: async (projectId: string) => {
    return db
      .select({
        taskId: taskAssignees.taskId,
        userId: taskAssignees.userId,
        userName: users.name,
        userEmail: users.email,
        userImageUrl: users.imageUrl, // <-- Add this
        userHasImage: users.hasImage, // <-- Add this
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
  // ...existing taskAssigneesQueries object, add this method:

  // Added #77 — tasks assigned to a user across every project (not
  // project-scoped like getByProject/getByProjectAndUser above), for
  // the Dashboard's "Assigned to me" widget. Same join chain
  // (taskAssignees -> tasks -> lists) extended one hop to projects for
  // the project name. No accessibility exists()-check needed here,
  // unlike getWithDueDatesForUser/getByOwnerOrMember — a task_assignees
  // row is itself proof of access (you can't be assigned without
  // project access in the first place).
  getAssignedToUserAcrossProjects: async (userId: string) => {
    return db
      .select({
        ...getTableColumns(tasks),
        projectId: lists.projectId,
        projectName: projects.name,
      })
      .from(taskAssignees)
      .innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
      .innerJoin(lists, eq(tasks.listId, lists.id))
      .innerJoin(projects, eq(lists.projectId, projects.id))
      .where(
        and(eq(taskAssignees.userId, userId), eq(tasks.isArchived, false)),
      );
  },
  getByTaskIds: async (taskIds: string[]) => {
    if (taskIds.length === 0) return [];
    return db
      .select({
        taskId: taskAssignees.taskId,
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userImageUrl: users.imageUrl,
        userHasImage: users.hasImage,
      })
      .from(taskAssignees)
      .innerJoin(users, eq(taskAssignees.userId, users.id))
      .where(inArray(taskAssignees.taskId, taskIds));
  },
};
