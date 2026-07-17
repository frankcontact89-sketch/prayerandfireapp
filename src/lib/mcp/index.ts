import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import listEvents from "./tools/list-events";
import listMyNotifications from "./tools/list-my-notifications";
import listMyPurchases from "./tools/list-my-purchases";
import rsvpEvent from "./tools/rsvp-event";

// Build the direct supabase.co issuer from the project ref. Never derive from
// SUPABASE_URL (which may be the .lovable.cloud proxy).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "prayer-and-fire-mcp",
  title: "Prayer & Fire",
  version: "0.1.0",
  instructions:
    "Tools for the Prayer & Fire app. Read the signed-in user's profile, notifications, and purchases; list upcoming events; and RSVP to an event. All tools act as the authenticated user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfile, listEvents, listMyNotifications, listMyPurchases, rsvpEvent],
});