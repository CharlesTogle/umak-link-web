import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UMak Link Web",
  description: "Admin and staff web portal for UMak Link",
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
