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
  // El favicon (ícono de la pestaña del navegador) y el apple-touch-icon son
  // recortes cuadrados del logo nuevo (letras "RIFAS Santiago GÓMEZ"),
  // centrados y con buen margen para que se vean bien incluso pequeños.
  // El archivo original del logo (public/logo-wordmark-santiago-gomez.png)
  // no se tocó; estos son copias recortadas solo para este uso.
  icons: {
    icon: "/favicon-santiago-gomez.png",
    shortcut: "/favicon-santiago-gomez.png",
    apple: "/apple-touch-icon-santiago-gomez.png",
  },
  // Sin esto, cuando alguien comparte el link por WhatsApp/Facebook/etc., o
  // cuando aparece en resultados de Google, la vista previa (tarjeta con
  // imagen) no tiene de dónde sacar el logo del negocio y termina mostrando
  // el ícono por defecto del proyecto (el de Next.js/Vercel que venía de
  // fábrica) o un logo viejo. Con openGraph definido, la tarjeta usa el
  // logo nuevo real.
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    images: [{ url: "/og-santiago-gomez.png", width: 1200, height: 630, alt: SITE_TITLE }],
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-santiago-gomez.png"],
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
