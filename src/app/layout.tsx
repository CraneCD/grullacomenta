import type { Metadata } from "next";
import { Zen_Old_Mincho, Shippori_Mincho, Zen_Maru_Gothic } from 'next/font/google';
import "./globals.css";
import Providers from "@/components/Providers";
import { defaultLocale } from "@/i18n/request";

// ── Grulla Comenta type pairing ──────────────────────────────────────────────
// Zen Old Mincho   — editorial serif for titles, heroes, section heads
// Shippori Mincho  — book serif for long-form essay reading
// Zen Maru Gothic  — rounded gothic for buttons, labels, nav (the roundness is the cozy)
const zenOldMincho = Zen_Old_Mincho({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
  variable: '--font-zen-old-mincho',
});

const shipporiMincho = Shippori_Mincho({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-shippori-mincho',
});

const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
  variable: '--font-zen-maru-gothic',
});

export const metadata: Metadata = {
  title: "Grulla Comenta - Anime, Manga y Videojuegos",
  description: "Grulla Comenta es un lugar para guardar y exponer ensayos sobre anime, manga y videojuegos. Lecturas lentas, opiniones cuidadas.",
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
  const fontVars = `${zenOldMincho.variable} ${shipporiMincho.variable} ${zenMaruGothic.variable}`;
  return (
    <html lang={defaultLocale} className={fontVars}>
      <body className="min-h-screen bg-paper-100 text-ink-900 font-ui">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
