import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Create a lazy-initialized singleton from a factory function. */
export function lazyInit<T>(factory: () => T): () => T {
  let instance: T | undefined;
  return () => {
    if (instance === undefined) instance = factory();
    return instance;
  };
}
