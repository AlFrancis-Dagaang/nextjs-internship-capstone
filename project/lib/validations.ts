// TODO: Task 3.6 - Set up data validation with Zod schemas

/*
TODO: Implementation Notes for Interns:

1. Install Zod: pnpm add zod
2. Create validation schemas for all forms and API endpoints
3. Add proper error messages
4. Set up client and server-side validation

Example schemas needed:
- Project creation/update
- Task creation/update
- User profile update
- List/column management
- Comment creation

Example structure:
import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  dueDate: z.date().min(new Date(), 'Due date must be in future').optional(),
})

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.date().optional(),
  assigneeId: z.string().uuid().optional(),
})
*/

// // Placeholder exports to prevent import errors
// export const projectSchema = "TODO: Implement project validation schema"
// export const taskSchema = "TODO: Implement task validation schema"
// export const userSchema = "TODO: Implement user validation schema"
// export const listSchema = "TODO: Implement list validation schema"
// export const commentSchema = "TODO: Implement comment validation schema"

import { z } from "zod";

// ---------- Projects ----------

export const projectCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

// ---------- Lists ----------

export const listCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  projectId: z.string().uuid(),
  position: z.number().int().min(0).optional(),
});

export const listUpdateSchema = listCreateSchema.partial();

export type ListCreateInput = z.infer<typeof listCreateSchema>;
export type ListUpdateInput = z.infer<typeof listUpdateSchema>;

// ---------- Tasks ----------

export const taskPrioritySchema = z.enum(["low", "medium", "high"]);

export const taskCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(2000).optional().nullable(),
  listId: z.string().uuid(),
  assigneeId: z.string().uuid().optional().nullable(),
  priority: taskPrioritySchema.optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  position: z.number().int().min(0).optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
