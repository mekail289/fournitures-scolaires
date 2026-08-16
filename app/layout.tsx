import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Mon magasinage scolaire", description: "Planificateur d’achats scolaires", manifest: "/manifest.webmanifest" };
export const viewport: Viewport = { themeColor: "#0f766e", width: "device-width", initialScale: 1 };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="fr"><body>{children}</body></html>; }
