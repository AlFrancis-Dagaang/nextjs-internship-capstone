import { NextResponse } from "next/server";
import { queries } from "@/lib/db";
import { createNotification } from "@/lib/services/notifications";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [dueWithin24h, dueToday] = await Promise.all([
    queries.notifications.getDueBetween(now, in24h),
    queries.notifications.getDueBetween(startOfToday, endOfToday),
  ]);

  async function fireForTasks(
    taskList: Awaited<ReturnType<typeof queries.notifications.getDueBetween>>,
    type: "task_due_soon_24h" | "task_due_soon_today",
  ) {
    for (const task of taskList) {
      const assignees = await queries.taskAssignees.getByTask(task.id);
      for (const assignee of assignees) {
        const alreadyNotified =
          await queries.notifications.existsForUserTaskType(
            assignee.userId,
            task.id,
            type,
          );
        if (alreadyNotified) continue;

        const list = await queries.lists.getById(task.listId);
        if (!list) continue;

        await createNotification({
          userId: assignee.userId,
          type,
          message: `"${task.title}" is due ${type === "task_due_soon_today" ? "today" : "within 24 hours"}`,
          projectId: list.projectId,
          taskId: task.id,
        });
      }
    }
  }

  await fireForTasks(dueWithin24h, "task_due_soon_24h");
  await fireForTasks(dueToday, "task_due_soon_today");

  return NextResponse.json({ ok: true });
}
