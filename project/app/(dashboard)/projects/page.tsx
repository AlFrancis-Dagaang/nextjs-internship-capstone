import { getProjects } from "@/lib/actions/projects";
import { getProjectMembers } from "@/lib/actions/project-member";
import { ProjectsList } from "@/components/projects/projects-list";
import { getAuthedUserOrError } from "@/lib/services/auth";

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

  // Fetch members for every project the user owns — getProjectMembers is
  // owner-only, so this will correctly return an error for projects the
  // user is only an editor/viewer on; we just fall back to an empty list
  // for those (the invite form is hidden for non-owners anyway).
  const membersByProject = await Promise.all(
    result.data.map(async (project) => {
      const membersResult = await getProjectMembers(project.id);
      const members = membersResult.success
        ? membersResult.data.map((m) => ({
            id: m.id,
            userId: m.userId,
            email: m.userEmail,
            role: m.role,
          }))
        : [];
      return [project.id, members] as const;
    }),
  );
  const initialMembersMap = Object.fromEntries(membersByProject);
  return (
    <div className="space-y-6">
      <ProjectsList
        projects={result.data}
        currentUserId={authResult.user.id}
        initialMembersMap={initialMembersMap}
      />
    </div>
  );
}
