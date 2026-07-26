import { usersQueries } from "./users";
import { projectsQueries } from "./projects";
import { listsQueries } from "./lists";
import { tasksQueries } from "./tasks";

export const queries = {
  users: usersQueries,
  projects: projectsQueries,
  lists: listsQueries,
  tasks: tasksQueries,
};
