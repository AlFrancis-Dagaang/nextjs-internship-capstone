import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const projectMemberRoleSchema = z.enum([
  "admin",
  "editor",
  "contributor",
  "viewer",
]);

export const addProjectMemberSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
  role: projectMemberRoleSchema.optional(),
});

export const updateMemberRoleSchema = z.object({
  role: projectMemberRoleSchema,
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
