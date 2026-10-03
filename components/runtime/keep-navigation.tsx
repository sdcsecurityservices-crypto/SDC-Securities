"use client";
import * as navigation from "next/navigation";

// vinext's <Link> loads its navigation module lazily and reads `navigateClientSide`
// by name. Rolldown cannot see that use and drops the export from production
// bundles, so every client-side link click throws. Holding the whole module
// namespace keeps all of its exports in the build.
(globalThis as Record<string, unknown>).__sdcNavigation = navigation;

export function KeepNavigation() {
  return null;
}
