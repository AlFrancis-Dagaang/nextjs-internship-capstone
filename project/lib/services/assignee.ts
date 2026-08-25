/**
 * assigneeId rule (per #12/#14 design, made concrete in #17): identity-derived
 * ownerId is never client input, but assigneeId is — however there is no
 * project-membership concept yet (#29, unstarted), so until then the only
 * valid assignee for a project is that project's own owner. `assignToMe`
 * lets the client toggle this without ever needing to know its own DB user
 * id (only Clerk's id is available client-side). A directly-supplied
 * assigneeId is still checked against the same rule, in case anything ever
 * calls this action without going through the toggle UI.
 */
export function resolveAssigneeId(
  requestedAssigneeId: string | null | undefined,
  assignToMe: boolean | undefined,
  projectOwnerId: string,
): { ok: true; assigneeId: string | null } | { ok: false; error: string } {
  if (assignToMe) {
    return { ok: true, assigneeId: projectOwnerId }
  }
  if (requestedAssigneeId == null) {
    return { ok: true, assigneeId: null }
  }
  if (requestedAssigneeId !== projectOwnerId) {
    return { ok: false, error: "Invalid assignee" }
  }
  return { ok: true, assigneeId: requestedAssigneeId }
}
