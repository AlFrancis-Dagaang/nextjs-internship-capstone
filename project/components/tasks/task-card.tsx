import type { Task } from "@/lib/db/schema";

const priorityStyles: Record<string, string> = {
  low: "bg-blue_munsell-100 text-blue_munsell-700 dark:bg-blue_munsell-900 dark:text-blue_munsell-300",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export function TaskCard({ task }: { task: Task }) {
  return (
    <div className="p-4 bg-white dark:bg-outer_space-300 rounded-lg border border-french_gray-300 dark:border-paynes_gray-400 cursor-pointer hover:shadow-md transition-shadow">
      <h4 className="font-medium text-outer_space-500 dark:text-platinum-500 text-sm mb-2">
        {task.title}
      </h4>
      {task.description && (
        <p className="text-xs text-paynes_gray-500 dark:text-french_gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        {task.priority ? (
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${priorityStyles[task.priority]}`}
          >
            {task.priority[0].toUpperCase() + task.priority.slice(1)}
          </span>
        ) : (
          <span />
        )}
        {task.assigneeId && (
          <div className="w-6 h-6 bg-blue_munsell-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            •
          </div>
        )}
      </div>
      {task.dueDate && (
        <p className="text-xs text-paynes_gray-500 dark:text-french_gray-400 mt-2">
          Due {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
