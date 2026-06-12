import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Codewehr | Verifikations-Cockpit",
  description:
    "Lagebild und Verifikation in einem: Die KI sammelt, synthetisiert und belegt, der Mensch entscheidet.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className={`${inter.className} bg-bg text-ink antialiased`}>{children}</body>
    </html>
  );
}
