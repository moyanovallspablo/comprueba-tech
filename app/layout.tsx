import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BrandMark, Wordmark } from "@/components/site/BrandMark";
import { TransparencyNote } from "@/components/site/RadicalTransparency";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { NAV_ITEMS } from "@/components/layout/nav";
import { MotionProvider } from "@/components/site/MotionProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "comprueba.tech · Qué monitor comprar", template: "%s · comprueba.tech" },
  description: "Motor de decisión automatizado de monitores: veredictos honestos, con sus sacrificios.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas text-ink [color-scheme:light]">
        <MotionProvider>
          <Header />
          {/* overflow-x: clip recorta halos decorativos (GlowFrame) sin crear contenedor de scroll: sticky sigue funcionando */}
          <div className="flex flex-1 flex-col overflow-x-clip">{children}</div>
          <footer className="border-t border-hairline bg-white/60">
            <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[auto_1fr] md:items-start md:gap-10">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BrandMark size={22} />
                  <Wordmark className="text-sm font-semibold tracking-tight" />
                </div>
                <nav aria-label="Secundaria">
                  <ul className="flex gap-4 text-xs text-zinc-500">
                    {NAV_ITEMS.map((n) => (
                      <li key={n.href}>
                        <Link href={n.href} className="transition hover:text-brand-strong">
                          {n.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
              <div className="space-y-3">
                <TransparencyNote className="max-w-2xl" />
                <p className="text-xs text-zinc-500">Precios orientativos en España · Datos de octubre de 2026</p>
              </div>
            </div>
          </footer>
        </MotionProvider>
      </body>
    </html>
  );
}
