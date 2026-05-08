import Image from "next/image";
import Link from "next/link";

export function BrandMark() {
  return (
    <Link
      href="/"
      aria-label="Friluftskameratene – til forsiden"
      className="fixed bottom-4 right-4 z-50 group flex items-center gap-2 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 pl-2 pr-4 py-2 shadow-lg hover:bg-emerald-900/90 transition-colors"
    >
      <Image
        src="/logo-white.svg"
        alt=""
        width={32}
        height={32}
        className="drop-shadow"
        priority
      />
      <span className="text-xs font-semibold tracking-wide text-emerald-100 hidden sm:inline">
        Friluftskameratene
      </span>
    </Link>
  );
}
