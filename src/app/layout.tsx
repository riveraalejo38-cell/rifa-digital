import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.rifassantiagogomez.com";
const SITE_TITLE = "Rifas Santiago Gómez";
const SITE_DESCRIPTION = "Separa tu boleta y participa por increíbles premios con Proyectos Santiago Gómez.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/logo-santiago-gomez.jpg",
    shortcut: "/logo-santiago-gomez.jpg",
    apple: "/logo-santiago-gomez.jpg",
  },
  // Sin esto, cuando alguien comparte el link por WhatsApp/Facebook/etc., la
  // vista previa (tarjeta con imagen) no tiene de dónde sacar el logo del
  // negocio y termina mostrando el ícono por defecto del proyecto (el de
  // Next.js/Vercel que venía de fábrica). Con openGraph definido, la tarjeta
  // usa el logo real.
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    images: [{ url: "/logo-santiago-gomez.jpg", width: 800, height: 800, alt: SITE_TITLE }],
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/logo-santiago-gomez.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
