
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getEventColor(eventName: string) {
  let hash = 0;
  for (let i = 0; i < eventName.length; i++) {
    hash = eventName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % 5) + 1; // 5 colors available

  const colors = {
    bg: `bg-[hsl(var(--event-color-${index}-bg))]`,
    border: `border-l-4 border-[hsl(var(--event-color-${index}-border))]`,
  };

  return colors;
}

