import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CleanLabel — Know What's In Your Products",
  description: "AI-powered skincare ingredient transparency. See what the beauty industry hides.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
