import { usersQueries } from "./users";
import { projectsQueries } from "./projects";
import { listsQueries } from "./lists";
import { tasksQueries } from "./tasks";
import { taskActivityQueries } from "./task-activity";
import { commentsQueries } from "./comments";
import { projectMembersQueries } from "./project-members";
import { taskAssigneesQueries } from "./task-assignees";
import { notificationsQueries } from "./notifications";
import { eventsQueries } from "./events";
import { analyticsQueries } from "./analytics";
import { teamsQueries } from "./teams";
import { projectTeamsQueries } from "./project-teams";

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
};
