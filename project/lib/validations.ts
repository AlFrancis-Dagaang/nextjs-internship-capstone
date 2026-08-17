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

// ---------- Comments ----------

export const commentCreateSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000),
  taskId: z.string().uuid(),
});

// ---------- Project Members ----------

export const projectMemberRoleSchema = z.enum(["editor", "viewer"]);

export const addProjectMemberSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
  role: projectMemberRoleSchema.optional(),
});

export const updateMemberRoleSchema = z.object({
  role: projectMemberRoleSchema,
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;

export const taskUpdateSchema = taskCreateSchema.partial();

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

export const searchUsersSchema = z.object({
  query: z.string().trim().min(2, "Type at least 2 characters"),
});

// ---------- Events ----------

export const eventCreateSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(255),
    description: z.string().max(2000).optional().nullable(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    projectId: z.string().uuid().optional().nullable(),
  })
  .refine((data) => data.endAt >= data.startAt, {
    message: "End time must be on or after start time",
    path: ["endAt"],
  });

export const eventUpdateSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(255).optional(),
    description: z.string().max(2000).optional().nullable(),
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional(),
    projectId: z.string().uuid().optional().nullable(),
  })
  .refine(
    (data) => !data.startAt || !data.endAt || data.endAt >= data.startAt,
    { message: "End time must be on or after start time", path: ["endAt"] },
  );

export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
