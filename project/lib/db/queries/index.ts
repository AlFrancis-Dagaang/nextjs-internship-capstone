import { usersQueries } from "./users";
import { projectsQueries } from "./projects";
import { listsQueries } from "./lists";
import { tasksQueries } from "./tasks";
import { taskActivityQueries } from "./taskActivity";
import { commentsQueries } from "./comments";
import { projectMembersQueries } from "./projectMembers";
import { taskAssigneesQueries } from "./task-assignees";

export const queries = {
  users: usersQueries,
  projects: projectsQueries,
  lists: listsQueries,
  tasks: tasksQueries,
  taskActivity: taskActivityQueries,
  comments: commentsQueries,
  projectMembers: projectMembersQueries,
  taskAssignees: taskAssigneesQueries,
};
