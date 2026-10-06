import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://congresopineda.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "XIV Congreso Pineda 2026 · HCUAMP",
  description:
    "XIV Congreso Pineda, LIX Jornada de Egresados y LXXII Aniversario del HCUAMP. Del 2 al 6 de noviembre de 2026 en Biotel Suites, Barquisimeto. Inscríbete en línea.",
  keywords: ["Congreso Pineda", "HCUAMP", "Medicina", "Barquisimeto", "Venezuela", "Salud", "Jornada de Egresados"],
  authors: [{ name: "DTIC HCUAMP" }],
  openGraph: {
    title: "XIV Congreso Pineda 2026 · HCUAMP",
    description:
      "Evento médico del 2 al 6 de noviembre de 2026 en Barquisimeto. Más de 100 ponencias, presentación de pósters y premiaciones. Asegura tu cupo en línea.",
    url: siteUrl,
    siteName: "XIV Congreso Pineda",
    type: "website",
    locale: "es_VE",
  },
  twitter: {
    card: "summary_large_image",
    title: "XIV Congreso Pineda 2026 · HCUAMP",
    description: "Inscríbete en el XIV Congreso Pineda del 2 al 6 de noviembre en Biotel Suites, Barquisimeto.",
  },
};

export const viewport: Viewport = {
  themeColor: "#2f80ed",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <div className="bg-aurora" aria-hidden />
        {children}
      </body>
    </html>
  );
}
