// Deterministic color pairs matching your design tokens
const avatarColors = [
  "bg-blue-500 text-white",
  "bg-emerald-500 text-white",
  "bg-amber-500 text-white",
  "bg-purple-500 text-white",
  "bg-rose-500 text-white",
  "bg-indigo-500 text-white",
];

/**
 * Returns a stable, deterministic color class based strictly on the user's initials.
 */
export function getAvatarColor(nameOrInitials: string): string {
  const initials = getInitials(nameOrInitials);
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

/**
 * Extracts up to 2 uppercase initials from a full name.
 */
export function getInitials(name: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
