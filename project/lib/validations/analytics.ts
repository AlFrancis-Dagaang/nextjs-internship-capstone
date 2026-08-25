import { z } from "zod"

export const analyticsFiltersSchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    projectId: z.string().uuid().optional(),
  })
  .refine(
    (data) =>
      !data.startDate || !data.endDate || data.endDate >= data.startDate,
    { message: "End date must be on or after start date", path: ["endDate"] },
  )

export const drillDownRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  projectId: z.string().uuid().optional(),
})

export const drillDownDaySchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  projectId: z.string().uuid().optional(),
})

export const searchUsersSchema = z.object({
  query: z.string().trim().min(2, "Type at least 2 characters"),
})

export type AnalyticsFiltersInput = z.infer<typeof analyticsFiltersSchema>
export type DrillDownRangeInput = z.infer<typeof drillDownRangeSchema>
export type DrillDownDayInput = z.infer<typeof drillDownDaySchema>
