"use server";

import { queries } from "@/lib/db";
import { commentCreateSchema } from "@/lib/validations";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { assertTaskAccess } from "@/lib/services/ownership";
import { logTaskActivity } from "@/lib/services/activity";
import type { Comment } from "@/lib/db/schema";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createComment(
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.comments.create>>>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = commentCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const access = await assertTaskAccess(parsed.data.taskId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const comment = await queries.comments.create({
    content: parsed.data.content,
    taskId: parsed.data.taskId,
    authorId: authResult.user.id,
  });

  await logTaskActivity(
    parsed.data.taskId,
    authResult.user.id,
    "comment_added",
  );

  return { success: true, data: comment };
}

export async function getCommentsByTask(
  taskId: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.comments.getByTask>>>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const access = await assertTaskAccess(taskId, authResult.user.id);
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  const comments = await queries.comments.getByTask(taskId);
  return { success: true, data: comments };
}

export async function deleteComment(id: string): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const existingComment = await queries.comments.getById(id);
  if (!existingComment) {
    return { success: false, error: "Not found" };
  }

  // Delete-own-only: this is deliberately NOT a project-ownership check like
  // every other delete action in this codebase. A project owner cannot
  // delete another user's comment — only the comment's own author can,
  // per #59's acceptance criteria. Access to the task itself is still
  // verified first, since an author's own comment could theoretically be
  // queried outside their current project access in edge cases.
  const access = await assertTaskAccess(
    existingComment.taskId,
    authResult.user.id,
  );
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  if (existingComment.authorId !== authResult.user.id) {
    return { success: false, error: "Forbidden" };
  }

  await queries.comments.delete(id);
  await logTaskActivity(
    existingComment.taskId,
    authResult.user.id,
    "comment_deleted",
  );

  return { success: true, data: null };
}

export async function updateComment(
  id: string,
  content: string,
): Promise<ActionResult<Comment>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const existingComment = await queries.comments.getById(id);
  if (!existingComment) {
    return { success: false, error: "Not found" };
  }

  const access = await assertTaskAccess(
    existingComment.taskId,
    authResult.user.id,
  );
  if ("error" in access) {
    return { success: false, error: access.error ?? "Unknown error" };
  }

  if (existingComment.authorId !== authResult.user.id) {
    return { success: false, error: "Forbidden" };
  }

  if (!content.trim()) {
    return { success: false, error: "Comment cannot be empty" };
  }

  const updated = await queries.comments.update(id, { content });
  return { success: true, data: updated };
}
