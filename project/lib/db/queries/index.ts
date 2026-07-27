import { usersQueries } from "./users";
import { projectsQueries } from "./projects";
import { listsQueries } from "./lists";
import { tasksQueries } from "./tasks";
import { taskActivityQueries } from "./taskActivity";

export const queries = {
  users: usersQueries,
  projects: projectsQueries,
  lists: listsQueries,
  tasks: tasksQueries,
  taskActivity: taskActivityQueries,
};
