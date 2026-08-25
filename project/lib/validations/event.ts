import { z } from "zod"

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
  })

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
  )

export type EventCreateInput = z.infer<typeof eventCreateSchema>
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>
