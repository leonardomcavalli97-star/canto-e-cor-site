import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-accent-navy text-[#ebe9ca]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-5">
          <Image
            src="/brand/logo-cursiva-offwhite.svg"
            alt="Selo Canto & Cor Ateliê"
            width={838}
            height={541}
            className="h-24 w-auto shrink-0"
            unoptimized
          />
          <p className="mt-2 max-w-xs text-sm text-[#ebe9ca]/70">
            Aquarelas pintadas à mão, sob encomenda, a partir da sua foto de
            referência.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="mb-1 text-xs tracking-widest text-[#ebe9ca]/60 uppercase">
            Navegue
          </span>
          <Link href="/galeria" className="hover:text-white">Galeria</Link>
          <Link href="/sobre" className="hover:text-white">Sobre o ateliê</Link>
          <Link href="/pedido" className="hover:text-white">Fazer encomenda</Link>
          <Link href="/contato" className="hover:text-white">Contato</Link>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="mb-1 text-xs tracking-widest text-[#ebe9ca]/60 uppercase">
            Redes
          </span>
          <a
            href="https://www.instagram.com/cantoecoratelie/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            @cantoecoratelie
          </a>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 border-t border-white/10 px-6 py-6 text-center text-xs text-[#ebe9ca]/60">
        <Image
          src="/brand/made-with-love-cream.svg"
          alt="Made with love"
          width={961}
          height={251}
          className="h-6 w-auto opacity-90"
          unoptimized
        />
        <Image
          src="/brand/by-livia-cream.svg"
          alt="by Lívia D."
          width={927}
          height={234}
          className="h-4 w-auto opacity-70"
          unoptimized
        />
        <p className="mt-1">
          © {new Date().getFullYear()} Canto e Cor Ateliê. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
