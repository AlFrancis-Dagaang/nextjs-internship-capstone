export function resolveAssigneeId(
  requestedAssigneeId: string | null | undefined,
  assignToMe: boolean | undefined,
  projectOwnerId: string,
): { ok: true; assigneeId: string | null } | { ok: false; error: string } {
  if (assignToMe) {
    return { ok: true, assigneeId: projectOwnerId };
  }
  if (requestedAssigneeId == null) {
    return { ok: true, assigneeId: null };
  }
  if (requestedAssigneeId !== projectOwnerId) {
    return { ok: false, error: "Invalid assignee" };
  }
  return { ok: true, assigneeId: requestedAssigneeId };
}
