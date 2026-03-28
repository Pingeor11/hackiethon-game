import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oshi no Ko — Investigation",
  description: "AI murder mystery",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
