import React from "react";
import Index from "./Index";

export default function IndexWithCommunity() {
  // Community is reachable from the single app menu (drawer). No duplicate
  // floating navigation control on top of the fixed bottom nav.
  return <Index />;
}
