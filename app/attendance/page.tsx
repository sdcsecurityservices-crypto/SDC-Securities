import type { Metadata, Viewport } from "next";
import GuardApp from "./attendance";
export const metadata: Metadata = {
  title: "SDC Guard",
  manifest: "/attendance.webmanifest",
  appleWebApp: { capable: true, title: "SDC Guard", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  themeColor: "#06214a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
export default function Page() {
  return <GuardApp />;
}
