import Image from "next/image";
import Link from "next/link";

type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact = false }: BrandProps) {
  return (
    <Link className="brand" href="/inicio" aria-label="Ir al inicio de MusicalPay">
      <span className="brand__mark" aria-hidden="true">
        <Image
          src="/brand/cristian-santiago-music.png"
          alt=""
          width={72}
          height={72}
          priority
        />
      </span>
      {compact ? null : (
        <span className="brand__copy">
          <strong>MusicalPay</strong>
          <small>Cristian Santiago Music</small>
        </span>
      )}
    </Link>
  );
}

