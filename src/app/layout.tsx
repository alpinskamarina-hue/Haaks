import type { Metadata, Viewport } from "next";
import "./globals.css";
import { requestLang } from "@/lib/lang";

export const metadata: Metadata = {
  title: "Haaks",
  description: "All documents of a self-employed construction worker in one link.",
  appleWebApp: { capable: true, title: "Haaks", statusBarStyle: "default" },
  icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ea580c",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={await requestLang()}>
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
