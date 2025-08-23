import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stock Pro - Inventory Management System",
  description: "Modern inventory management system with multi-language support and dark mode",
  keywords: ["Stock Pro", "Inventory", "Management", "Next.js", "TypeScript", "Multi-language", "Dark Mode"],
  authors: [{ name: "Stock Pro Team" }],
  openGraph: {
    title: "Stock Pro - Inventory Management",
    description: "Modern inventory management system with multi-language support",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
