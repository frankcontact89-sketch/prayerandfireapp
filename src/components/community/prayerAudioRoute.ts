import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export const nativePrayerAudio = Capacitor.getPlatform() === "ios";
export const prayerAudioRoute = registerPlugin<{
  routes(): Promise<{ speaker: boolean; outputs: string[]; inputs: { id: string; name: string }[] }>;
  select(options: { route: string }): Promise<void>;
  reset(): Promise<void>;
  addListener(event: "routeChanged" | "interrupted", callback: () => void): Promise<PluginListenerHandle>;
}>("PrayerAudioRoute");
