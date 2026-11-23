import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export const nativePrayerAudio = Capacitor.getPlatform() === "ios";
export const prayerAudioRoute = registerPlugin<{
  prepare(): Promise<void>;
  routes(): Promise<{ selected: string; options: { id: string; name: string; kind: "automatic" | "phone" | "speaker" | "bluetooth" }[] }>;
  select(options: { route: string }): Promise<void>;
  reset(): Promise<void>;
  presentContact(options: { name: string }): Promise<void>;
  startSystemCall(options: { name: string }): Promise<{ id: string }>;
  endSystemCall(options: { id: string }): Promise<void>;
  requestSystemMute(options: { id: string; muted: boolean }): Promise<void>;
  completeSystemMute(options: { actionID: string; applied: boolean }): Promise<void>;
  addListener(event: "systemCallEnded", callback: (event: { id: string }) => void): Promise<PluginListenerHandle>;
  addListener(event: "systemMute", callback: (event: { id: string; actionID: string; muted: boolean }) => void): Promise<PluginListenerHandle>;
  addListener(event: "routeChanged", callback: () => void): Promise<PluginListenerHandle>;
  addListener(event: "interrupted", callback: (event: { ended: boolean }) => void): Promise<PluginListenerHandle>;
}>("PrayerAudioRoute");
