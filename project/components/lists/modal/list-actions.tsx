// components/projects/modal/list-actions.tsx
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
import { List } from "@/lib/db/schema";

export function ListActions({
  listId,
  listName,
  currentPosition, // 0-indexed position of this list, e.g. list.position
  totalLists, // total number of lists in the project
  onRename,
  onDelete,
  onMoved,
}: {
  listId: string;
  listName: string;
  currentPosition: number;
  totalLists: number;
  onRename: () => void;
  onDelete: () => void;
  onMoved?: (updatedLists: List[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"menu" | "move">("menu");
  const [position, setPosition] = useState("1");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPosition(String(currentPosition + 1));
  }, [currentPosition]);

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

  const positionOptions = Array.from({ length: totalLists }, (_, i) =>
    String(i + 1),
  );

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setView("menu");
        }}
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"
      >
        <MoreHorizontal size={16} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-9 z-50 w-56 bg-card border border-border rounded-2xl shadow-xl p-1.5 space-y-1">
          {view === "menu" ? (
            <>
              <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
                <span>List Options</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-md"
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
                className="w-full text-left px-2.5 py-2 text-xs text-foreground hover:bg-secondary rounded-xl transition-colors flex items-center space-x-2.5 font-medium"
              >
                <Edit2 size={14} className="text-muted-foreground" />
                <span>Rename list</span>
              </button>

              <button
                onClick={() => setView("move")}
                className="w-full text-left px-2.5 py-2 text-xs text-foreground hover:bg-secondary rounded-xl transition-colors flex items-center space-x-2.5 font-medium"
              >
                <Move size={14} className="text-muted-foreground" />
                <span>Move list position</span>
              </button>

              <div className="border-t border-border pt-1 mt-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setView("menu");
                    onDelete();
                  }}
                  className="w-full text-left px-2.5 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-xl transition-colors flex items-center space-x-2.5 font-medium"
                >
                  <Trash2 size={14} className="text-destructive" />
                  <span>Remove list</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
                <button
                  onClick={() => setView("menu")}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-md"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-foreground">
                  Move list
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-md"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="px-2.5 space-y-1.5 pt-2">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Target Position
                </label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className="w-full h-8 text-xs border-input bg-secondary text-foreground rounded-xl shadow-none focus:ring-0">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent className="border border-border rounded-2xl shadow-xl bg-card z-50">
                    {positionOptions.map((p) => (
                      <SelectItem
                        key={p}
                        value={p}
                        className="text-xs rounded-xl"
                      >
                        Position {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="px-2 pt-3 pb-1">
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium h-8 text-xs rounded-xl shadow-xs"
                  onClick={async () => {
                    const result = await moveList(
                      listId,
                      parseInt(position, 10) - 1,
                    );
                    setIsOpen(false);
                    setView("menu");
                    if (result.success) onMoved?.(result.data);
                  }}
                >
                  Confirm Move
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
