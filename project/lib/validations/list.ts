import { z } from "zod";

export const listCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  projectId: z.string().uuid(),
  position: z.number().int().min(0).optional(),
});

export const listUpdateSchema = listCreateSchema.partial();

export type ListCreateInput = z.infer<typeof listCreateSchema>;
export type ListUpdateInput = z.infer<typeof listUpdateSchema>;
