"use server";

import { queries } from "@/lib/db";
import { listCreateSchema, listUpdateSchema } from "@/lib/validations";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { assertProjectOwnership } from "@/lib/services/ownership";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createList(
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.lists.create>>>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = listCreateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const ownership = await assertProjectOwnership(
    parsed.data.projectId,
    authResult.user.id,
  );
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  // Position is always computed server-side — client-supplied `position`
  // (allowed by the schema, since it's optional) is intentionally ignored
  // here. Explicit reordering is #21's job; #16 only ever appends.
  const existingLists = await queries.lists.getByProject(parsed.data.projectId);
  const position = existingLists.length;

  const list = await queries.lists.create({
    name: parsed.data.name,
    projectId: parsed.data.projectId,
    position,
  });

  return { success: true, data: list };
}

export async function getListsByProject(
  projectId: string,
): Promise<
  ActionResult<Awaited<ReturnType<typeof queries.lists.getByProject>>>
> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const ownership = await assertProjectOwnership(projectId, authResult.user.id);
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  const lists = await queries.lists.getByProject(projectId);
  return { success: true, data: lists };
}

export async function updateList(
  id: string,
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof queries.lists.update>>>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const parsed = listUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingList = await queries.lists.getById(id);
  if (!existingList) {
    return { success: false, error: "Not found" };
  }

  const ownership = await assertProjectOwnership(
    existingList.projectId,
    authResult.user.id,
  );
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  // `position` and `projectId` are stripped even though listUpdateSchema
  // (a .partial() of listCreateSchema) technically allows them — reordering
  // is #21's job, and moving a list to a different project isn't in scope
  // for #16 at all. Only `name` is actually mutable here.
  const {
    position: _ignoredPosition,
    projectId: _ignoredProjectId,
    ...safeUpdate
  } = parsed.data;

  const updated = await queries.lists.update(id, safeUpdate);
  return { success: true, data: updated };
}

export async function deleteList(id: string): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const existingList = await queries.lists.getById(id);
  if (!existingList) {
    return { success: false, error: "Not found" };
  }

  const ownership = await assertProjectOwnership(
    existingList.projectId,
    authResult.user.id,
  );
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  await queries.lists.delete(id);
  return { success: true, data: null };
}

export async function moveList(
  id: string,
  newPosition: number,
): Promise<ActionResult<null>> {
  const authResult = await getAuthedUserOrError();
  if ("error" in authResult) {
    return { success: false, error: authResult.error ?? "Unknown error" };
  }

  const existingList = await queries.lists.getById(id);
  if (!existingList) {
    return { success: false, error: "Not found" };
  }

  const ownership = await assertProjectOwnership(
    existingList.projectId,
    authResult.user.id,
  );
  if ("error" in ownership) {
    return { success: false, error: ownership.error ?? "Unknown error" };
  }

  const projectLists = await queries.lists.getByProject(existingList.projectId);
  const clampedPosition = Math.max(
    0,
    Math.min(newPosition, projectLists.length - 1),
  );

  const reordered = projectLists.filter((l) => l.id !== id);
  reordered.splice(clampedPosition, 0, existingList);

  // Reassign contiguous positions (0-indexed) and persist only the lists
  // whose position actually changed — avoids unnecessary writes/updatedAt
  // bumps on lists that didn't move.
  const updates = reordered
    .map((list, index) => ({ list, index }))
    .filter(({ list, index }) => list.position !== index)
    .map(({ list, index }) =>
      queries.lists.update(list.id, { position: index }),
    );

  await Promise.all(updates);

  return { success: true, data: null };
}
