import { z } from "zod";

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

export const commentCreateSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000),
  taskId: z.string().uuid(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
