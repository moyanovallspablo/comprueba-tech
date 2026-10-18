import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MotionProvider } from "@/components/site/MotionProvider";
import { SITE_URL } from "@/lib/seo";
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
  metadataBase: new URL(SITE_URL),
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
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
