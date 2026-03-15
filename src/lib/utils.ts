import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn (...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/*
    className={cn(
        "max-w-xs p-5 rounded-lg text-white", 
        isMe ? "bg-rose-500" : "bg-indigo-500"
    )}
*/
