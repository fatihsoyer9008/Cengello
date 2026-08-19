import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cengello",
  description: "Self-hosted Trello clone",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
