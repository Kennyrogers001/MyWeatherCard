import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap"
});

export const metadata: Metadata = {
  title: "MyWeatherCard",
  description: "Share-ready Malaysian weather cards built with official and real-time public data."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${manrope.variable} font-body antialiased`}>{children}</body>
    </html>
  );
}
