import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, getAvatarColor } from "@/lib/utils/avatar";
import { cn } from "@/lib/utils/utils";

interface UserAvatarProps {
  userId: string;
  name: string;
  imageUrl?: string | null;
  hasImage?: boolean;
  className?: string;
  title?: string;
}

export function UserAvatar({
  userId,
  name,
  imageUrl,
  hasImage,
  className,
  title,
}: UserAvatarProps) {
  return (
    <Avatar className={cn("border-2 border-card", className)} title={title}>
      {hasImage && imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
      <AvatarFallback
        className={cn(
          "text-[10px] font-bold uppercase",
          getAvatarColor(userId),
        )}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
