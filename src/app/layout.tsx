import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "./globals.css";
import { assessmentConfig } from "../lib/config";

export const metadata: Metadata = {
  title: assessmentConfig.companyName,
  description: "A two-question Python coding assessment.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
