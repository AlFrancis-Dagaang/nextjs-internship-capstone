import { z } from "zod";

export const teamCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

export const teamUpdateSchema = teamCreateSchema.partial();

export const addTeamMemberSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
});

export const projectTeamRoleSchema = z.enum([
  "editor",
  "contributor",
  "viewer",
]);

export const attachTeamToProjectSchema = z.object({
  teamId: z.string().uuid(),
  role: projectTeamRoleSchema,
});

export const updateProjectTeamRoleSchema = z.object({
  role: projectTeamRoleSchema,
});

export type TeamCreateInput = z.infer<typeof teamCreateSchema>;
export type TeamUpdateInput = z.infer<typeof teamUpdateSchema>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
export type AttachTeamToProjectInput = z.infer<
  typeof attachTeamToProjectSchema
>;
export type UpdateProjectTeamRoleInput = z.infer<
  typeof updateProjectTeamRoleSchema
>;
