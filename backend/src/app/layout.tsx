import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MASP - Multi-Account Sharing Platform",
  description: "Manage and share service accounts securely with cookie-based authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
