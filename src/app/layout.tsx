import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "XIV Congreso Pineda 2026 · HCUAMP",
  description:
    "XIV Congreso Pineda, LIX Jornada de Egresados y LXXII Aniversario del HCUAMP. Del 2 al 6 de noviembre de 2026 en Biotel Suites, Barquisimeto. Inscríbete en línea.",
  openGraph: {
    title: "XIV Congreso Pineda 2026 · HCUAMP",
    description:
      "Del 2 al 6 de noviembre de 2026 · Biotel Suites, Barquisimeto. Más de 100 ponencias, pósters y premiaciones.",
    type: "website",
    locale: "es_VE",
    images: [{ url: "/images/logo-congreso-pineda.png", width: 1024, height: 426 }],
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
