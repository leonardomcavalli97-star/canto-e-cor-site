import Image from "next/image";
import Link from "next/link";
import { Home, GalleryVerticalEnd, Info, Mail, Palette } from "lucide-react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";

const NAV_LINKS = [
  { label: "Início", href: "/", icon: <Home className="h-4 w-4 shrink-0 text-foreground/80" /> },
  {
    label: "Galeria",
    href: "/galeria",
    icon: <GalleryVerticalEnd className="h-4 w-4 shrink-0 text-foreground/80" />,
  },
  { label: "Sobre", href: "/sobre", icon: <Info className="h-4 w-4 shrink-0 text-foreground/80" /> },
  { label: "Contato", href: "/contato", icon: <Mail className="h-4 w-4 shrink-0 text-foreground/80" /> },
];

const Logo = () => (
  <Link href="/" className="shrink-0">
    <Image
      src="/brand/logo-principal-bordo.svg"
      alt="Canto & Cor Ateliê"
      width={787}
      height={194}
      className="h-9 w-auto"
      priority
      unoptimized
    />
  </Link>
);

export default function Header() {
  return (
    <header className="sticky top-0 z-50">
      <Sidebar>
        <SidebarBody className="justify-between" mobileHeader={<Logo />}>
          <Logo />

          <nav className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
            {NAV_LINKS.map((link) => (
              <SidebarLink key={link.href} link={link} />
            ))}
          </nav>

          <Link
            href="/pedido"
            className="inline-flex shrink-0 items-center gap-2 self-start border border-accent px-5 py-2 text-sm tracking-wide text-accent transition-colors hover:bg-accent hover:text-white md:self-auto"
          >
            <Palette className="h-4 w-4" />
            Encomendar
          </Link>
        </SidebarBody>
      </Sidebar>
    </header>
  );
}
