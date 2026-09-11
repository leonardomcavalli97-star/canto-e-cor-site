import Image from "next/image";

export default function ArtworkCard({
  src,
  alt,
  label,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  label?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative aspect-[3/4] w-full overflow-hidden bg-surface ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        className="object-contain p-3"
        priority={priority}
      />
      {label && (
        <span className="absolute inset-x-0 bottom-3 text-center font-serif-display text-sm text-foreground/70">
          {label}
        </span>
      )}
    </div>
  );
}
