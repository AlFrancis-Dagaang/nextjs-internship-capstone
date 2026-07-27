"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  ChevronLeft,
  X,
  Edit2,
  Move,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { moveList } from "@/lib/actions/lists";

export function ListActions({
  listId,
  listName,
  onRename,
  onDelete,
  onMoved,
}: {
  listId: string;
  listName: string;
  onRename: () => void;
  onDelete: () => void;
  onMoved?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "move">("menu");
  const [position, setPosition] = useState("1");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        const isRadixPortal = (target as Element).closest?.(
          "[data-radix-popper-content-wrapper]",
        );
        if (isRadixPortal) return;

        setIsOpen(false);
        setTimeout(() => setView("menu"), 150);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setView("menu");
        }}
        className="h-7 w-7 shrink-0 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
      >
        <MoreHorizontal size={16} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-9 z-50 w-56 bg-white dark:bg-neutral-900 border-0 outline-none ring-0 shadow-xl p-2 space-y-1">
          {view === "menu" ? (
            <>
              <div className="flex items-center justify-between px-2.5 py-1 text-xs font-semibold text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                <span>List</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X size={14} />
                </button>
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setView("menu");
                  onRename();
                }}
                className="w-full text-left px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center space-x-2.5"
              >
                <Edit2 size={15} className="text-neutral-400" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => setView("move")}
                className="w-full text-left px-2.5 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center space-x-2.5"
              >
                <Move size={15} className="text-neutral-400" />
                <span>Move list</span>
              </button>

              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-1 mt-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setView("menu");
                    onDelete();
                  }}
                  className="w-full text-left px-2.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors flex items-center space-x-2.5"
                >
                  <Trash2 size={15} className="text-red-500" />
                  <span>Remove list</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <button
                  onClick={() => setView("menu")}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Move list
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="px-2 space-y-1.5 pt-2">
                <label className="text-[10px] font-medium text-neutral-500 uppercase">
                  Position
                </label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className="w-full h-8 text-xs border-0 bg-neutral-100 dark:bg-neutral-800 shadow-none focus:ring-0 focus:outline-none">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-lg">
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="px-2 pt-3 pb-1">
                <Button
                  className="w-full bg-cyan-400 hover:bg-cyan-500 text-neutral-900 font-medium h-8 text-xs shadow-none border-0"
                  onClick={async () => {
                    await moveList(listId, parseInt(position, 10) - 1);
                    setIsOpen(false);
                    setView("menu");
                    onMoved?.();
                  }}
                >
                  Move
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
