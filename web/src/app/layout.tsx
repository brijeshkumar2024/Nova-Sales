import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NovaSales | Sales Intelligence",
    template: "%s | NovaSales",
  },
  description:
    "A sales intelligence platform for operational monitoring, forecasting, regional analytics, and explainable insights.",
  applicationName: "NovaSales",
  authors: [{ name: "NovaSales Development Team" }],
  creator: "NovaSales Development Team",
  keywords: [
    "NovaSales",
    "sales intelligence",
    "sales forecasting",
    "sales analytics",
    "business intelligence",
  ],
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "NovaSales | Sales Intelligence",
    description:
      "Operational sales monitoring, forecasting, analytics, and explainable insights.",
    type: "website",
    siteName: "NovaSales",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}