// components/ui/skeleton.tsx
import { cn } from "@/lib/utils/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

{
  /* If you don't have `@/lib/utils`, use this simpler version instead:
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className || ""}`}
      {...props}
    />
  );
} */
}

export { Skeleton };
