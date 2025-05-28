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
  title: "Grulla Comenta - Anime, Manga y Videojuegos",
  description: "Grulla Comenta es un blog de comentarios sobre anime, manga y videojuegos.",
  icons: {
    icon: '/minilogo.png',
    shortcut: '/minilogo.png',
    apple: '/minilogo.png',
  },
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
