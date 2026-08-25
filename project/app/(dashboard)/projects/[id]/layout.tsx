import type React from "react";

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full w-full min-h-0 overflow-hidden">
      {children}
    </div>
  );
}
