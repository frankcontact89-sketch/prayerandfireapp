import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export const nativePrayerAudio = Capacitor.getPlatform() === "ios";
export const prayerAudioRoute = registerPlugin<{
  prepare(): Promise<void>;
  routes(): Promise<{ selected: string; options: { id: string; name: string; kind: "automatic" | "phone" | "speaker" | "bluetooth" }[] }>;
  select(options: { route: string }): Promise<void>;
  reset(): Promise<void>;
  addListener(event: "routeChanged" | "interrupted", callback: () => void): Promise<PluginListenerHandle>;
}>("PrayerAudioRoute");
