import { getProjects } from "@/lib/actions/projects";
import { getProjectMembers } from "@/lib/actions/project-member";
import { ProjectsList } from "@/components/projects/projects-list";
import { getAuthedUserOrError } from "@/lib/services/auth";
import { queries } from "@/lib/db";
import { toMemberList } from "@/lib/utils";

export default async function ProjectsPage() {
  const [result, authResult] = await Promise.all([
    getProjects(),
    getAuthedUserOrError(),
  ]);

  if ("error" in authResult) {
    return (
      <p className="text-red-600 dark:text-red-400">
        Error loading user: {authResult.error}
      </p>
    );
  }

  if (!result.success) {
    return (
      <p className="text-red-600 dark:text-red-400">
        Error loading projects: {result.error}
      </p>
    );
  }

  const membersByProject = await Promise.all(
    result.data.map(async (project) => {
      const [membersResult, owner] = await Promise.all([
        getProjectMembers(project.id),
        queries.users.getById(project.ownerId),
      ]);
      const members = membersResult.success
        ? toMemberList(membersResult.data)
        : [];
      return [
        project.id,
        { members, ownerName: owner?.name, ownerEmail: owner?.email },
      ] as const;
    }),
  );
  const initialMembersMap = Object.fromEntries(
    membersByProject.map(([id, v]) => [id, v.members]),
  );
  const initialOwnerMap = Object.fromEntries(
    membersByProject.map(([id, v]) => [
      id,
      { name: v.ownerName, email: v.ownerEmail },
    ]),
  );
  return (
    <div className="space-y-6">
      <ProjectsList
        initialProjects={result.data}
        currentUserId={authResult.user.id}
        initialMembersMap={initialMembersMap}
        initialOwnerMap={initialOwnerMap}
      />
    </div>
  );
}
