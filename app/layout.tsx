import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SDC | Security. With intelligence.",
  description: "Veteran-led security, facility services and connected operations across Karnataka. Discover SDC and explore the Command platform.",
  icons: {
    icon: "/brand/sdc-logo.png",
    shortcut: "/brand/sdc-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
