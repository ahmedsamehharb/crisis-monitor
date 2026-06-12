import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Codewehr | Crisis Monitor",
  description:
    "Real-time crisis monitoring and verification for Baden-Württemberg.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" data-theme="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-bg text-ink antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
