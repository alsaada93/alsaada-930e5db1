import { useEffect, useState } from "react";
import { isNativePlatform, getPlatform } from "@/lib/capacitor";

interface CapacitorState {
  isNative: boolean;
  platform: "ios" | "android" | "web";
  ready: boolean;
}

export function useCapacitor(): CapacitorState {
  const [state, setState] = useState<CapacitorState>({
    isNative: false,
    platform: "web",
    ready: false,
  });

  useEffect(() => {
    setState({
      isNative: isNativePlatform(),
      platform: getPlatform(),
      ready: true,
    });
  }, []);

  return state;
}
