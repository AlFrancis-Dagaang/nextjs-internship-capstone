import { requireAuthedDbUser } from "@/lib/services/auth";
import { queries } from "@/lib/db";
import { CalendarView } from "@/components/calendar/calendar-view";
import { toLocalDateKey } from "@/lib/utils/utils";
import type { CalendarTaskDTO, CalendarEventDTO } from "@/types";

export default async function CalendarPage() {
  const user = await requireAuthedDbUser();

  const [tasks, events] = await Promise.all([
    queries.tasks.getWithDueDatesForUser(user.id),
    queries.events.getForUser(user.id),
  ]);

  const tasksByDate: Record<string, CalendarTaskDTO[]> = {};
  for (const task of tasks) {
    if (!task.dueDate) continue;
    // Fixed: was .toISOString().slice(0, 10) — UTC date, which can
    // disagree with CalendarView's local-date grid cells near
    // timezone/midnight boundaries.
    const key = toLocalDateKey(task.dueDate);
    (tasksByDate[key] ??= []).push({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate.toISOString(),
      priority: task.priority,
      projectId: task.projectId,
      projectName: task.projectName,
      isCompleted: task.isCompleted,
    });
  }
  const eventsByDate: Record<string, CalendarEventDTO[]> = {};
  for (const event of events) {
    // Same fix — group by the event's local start date, matching
    // CalendarView's grid.
    const key = toLocalDateKey(event.startAt);
    (eventsByDate[key] ??= []).push({
      id: event.id,
      title: event.title,
      description: event.description,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      projectId: event.projectId,
      creatorId: event.creatorId,
    });
  }

  return (
    <CalendarView
      tasksByDate={tasksByDate}
      eventsByDate={eventsByDate}
      currentUserId={user.id}
    />
  );
}
