import React from "react";
import Community from "@/pages/CommunityV2";

interface GivingScreenProps {
  t: (key: string) => string;
  language?: string;
}

/**
 * Legacy route kept temporarily so older app navigation state does not break.
 * The former Give/Support destination now opens Prayer & Fire Community.
 */
export function GivingScreen(_props: GivingScreenProps) {
  return <Community />;
}
