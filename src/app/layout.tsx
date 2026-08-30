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

export const metadata: Metadata = {
  title: "Canto e Cor | Ateliê de Aquarela Personalizada",
  description:
    "Aquarelas pintadas à mão a partir da sua foto: casais, pets, retratos e homenagens. Encomende sua peça exclusiva no Ateliê Canto e Cor.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
