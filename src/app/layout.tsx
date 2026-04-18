import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UMak LINK WEB",
  description: "Admin and staff web portal for UMak LINK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
