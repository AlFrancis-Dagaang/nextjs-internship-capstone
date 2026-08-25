import { analyticsQueries } from "./analytics"
import { commentsQueries } from "./comments"
import { eventsQueries } from "./events"
import { listsQueries } from "./lists"
import { notificationsQueries } from "./notifications"
import { projectMembersQueries } from "./project-members"
import { projectTeamsQueries } from "./project-teams"
import { projectsQueries } from "./projects"
import { taskActivityQueries } from "./task-activity"
import { taskAssigneesQueries } from "./task-assignees"
import { tasksQueries } from "./tasks"
import { teamsQueries } from "./teams"
import { usersQueries } from "./users"

export const queries = {
  users: usersQueries,
  projects: projectsQueries,
  lists: listsQueries,
  tasks: tasksQueries,
  taskActivity: taskActivityQueries,
  comments: commentsQueries,
  projectMembers: projectMembersQueries,
  taskAssignees: taskAssigneesQueries,
  notifications: notificationsQueries,
  events: eventsQueries,
  analytics: analyticsQueries,
  teams: teamsQueries,
  projectTeams: projectTeamsQueries,
}
