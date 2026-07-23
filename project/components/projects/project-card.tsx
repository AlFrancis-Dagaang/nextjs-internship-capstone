"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import type { Project } from "@/lib/db/schema";
import { deleteProject } from "@/lib/actions/projects";
import { CreateProjectModal } from "./modals/create-project-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProject(project.id);
      if (result.success) {
        toast({
          title: "Project deleted",
          description: `"${project.name}" was deleted.`,
        });
        router.refresh();
      } else {
        toast({
          title: "Failed to delete project",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="relative">
      <Link href={`/projects/${project.id}`}>
        <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-paynes_gray-400 p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-2 pr-8">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-sm text-paynes_gray-500 dark:text-french_gray-400 mb-4 line-clamp-2">
              {project.description}
            </p>
          )}
          {project.dueDate && (
            <p className="text-xs text-paynes_gray-500 dark:text-french_gray-400">
              Due {new Date(project.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </Link>

      <div
        className="absolute top-4 right-4"
        onClick={(e) => e.preventDefault()} // don't trigger the card's Link
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              Edit
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{project.name}" and cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isPending}
                  >
                    {isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CreateProjectModal
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
        trigger={<span className="hidden" />}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
