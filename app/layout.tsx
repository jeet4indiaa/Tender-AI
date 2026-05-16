import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TenderAI – Instant Tender Analysis",
  description: "Upload a tender PDF and get instant AI-powered analysis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
