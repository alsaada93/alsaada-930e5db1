import { useCallback } from "react";
import { isNativePlatform } from "@/lib/capacitor";

interface CameraResult {
  file: File;
  previewUrl: string;
}

/**
 * Opens the native camera or photo picker when running inside the Capacitor app.
 * Falls back to a hidden file input on the mobile web.
 */
export function useNativeCamera() {
  const capture = useCallback(async (): Promise<CameraResult | null> => {
    if (!isNativePlatform()) return null;

    try {
      const { Camera, CameraSource, CameraResultType } = await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt, // Lets user choose Camera or Photos.
      });

      if (!photo.webPath) return null;

      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const name = photo.path?.split("/").pop() || `capture-${Date.now()}.jpg`;
      const file = new File([blob], name, { type: blob.type || "image/jpeg" });

      return { file, previewUrl: photo.webPath };
    } catch {
      return null;
    }
  }, []);

  return { capture };
}
