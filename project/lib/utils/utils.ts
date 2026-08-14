import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toMemberList(
  rows: {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    role: "editor" | "viewer";
  }[],
) {
  return rows.map((m) => ({
    id: m.id,
    userId: m.userId,
    email: m.userEmail,
    name: m.userName,
    role: m.role,
  }));
}
