import { Capacitor } from "@capacitor/core";

/** Returns true when running inside a Capacitor native app (iOS/Android). */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/** Returns the current native platform name, or "web". */
export function getPlatform(): "ios" | "android" | "web" {
  return Capacitor.getPlatform() as "ios" | "android" | "web";
}

/** Safe no-op fallback for browser environments. */
export function safeNativeCall<T>(fn: () => Promise<T>, fallback?: T): Promise<T> {
  if (!isNativePlatform()) {
    return Promise.resolve(fallback as T);
  }
  return fn().catch(() => fallback as T);
}
