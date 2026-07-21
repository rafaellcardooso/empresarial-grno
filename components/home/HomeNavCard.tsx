import Link from "next/link";

type HomeNavCardProps = {
  href: string;
  title: string;
  description: string;
};

/** Card de navegação para seções principais na home. */
export function HomeNavCard({ href, title, description }: HomeNavCardProps) {
  return (
    <Link href={href} className="home-nav-card">
      <span className="home-nav-card__title">{title}</span>
      <span className="home-nav-card__description">{description}</span>
      <span className="home-nav-card__action" aria-hidden="true">
        Acessar <i className="bi bi-arrow-right-short" />
      </span>
    </Link>
  );
}
