import type { Metadata } from "next";
import { Cormorant_Garamond, Poppins } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

// "The Seasons" (the brand kit's title font) is a paid font not available via
// Google Fonts and not licensed for this project, so this stands in for it.
const heading = Cormorant_Garamond({
  variable: "--font-heading",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const body = Poppins({
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
});

const SITE_URL = "https://www.cantoecor.com";
const SITE_TITLE = "Canto e Cor | Ateliê de Aquarela Personalizada";
const SITE_DESCRIPTION =
  "Aquarelas pintadas à mão a partir da sua foto: casais, pets, retratos e homenagens. Encomende sua peça exclusiva no Ateliê Canto e Cor.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "Canto e Cor",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Aquarela pintada à mão pelo Canto e Cor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Canto e Cor Ateliê",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  image: `${SITE_URL}/og-image.jpg`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Campo Grande",
    addressRegion: "MS",
    addressCountry: "BR",
  },
  email: "cantoecoratelie@gmail.com",
  sameAs: ["https://www.instagram.com/cantoecoratelie/"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
