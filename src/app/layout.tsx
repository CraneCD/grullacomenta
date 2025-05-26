import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import Providers from "@/components/Providers";
import { defaultLocale } from "@/i18n/request";

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Reviews Blog",
  description: "Your personal space for anime, manga, and video game reviews",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang={defaultLocale} className={inter.variable}>
      <body className={`${inter.className} min-h-screen bg-dark text-gray-100`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
