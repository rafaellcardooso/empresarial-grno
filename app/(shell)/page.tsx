import { HomeNavCard } from "@/components/home/HomeNavCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { HOME_COPY } from "@/lib/config/home-copy";
import { pingHfcDb } from "@/lib/queries/bsod";
import { pingSirDb } from "@/lib/queries/sir";

export const dynamic = "force-dynamic";
export const metadata = { title: "Início" };

/** Página inicial com boas-vindas e atalhos para monitoramento. */
export default async function Page() {
  const [sirPing, hfcPing] = await Promise.all([pingSirDb(), pingHfcDb()]);

  return (
    <>
      <PageHeader title={HOME_COPY.title} description={HOME_COPY.lead} />

      <section className="home-welcome mb-4">
        <h2 className="home-welcome__title">{HOME_COPY.welcome}</h2>
        <p className="home-welcome__text mb-0">{HOME_COPY.lead}</p>
      </section>

      <section aria-labelledby="home-sections-title">
        <h2 id="home-sections-title" className="home-sections-title">
          {HOME_COPY.sectionsTitle}
        </h2>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <HomeNavCard
              href="/sir"
              title={HOME_COPY.sir.title}
              description={HOME_COPY.sir.description}
            />
          </div>
          <div className="col-md-6">
            <HomeNavCard
              href="/bsod"
              title={HOME_COPY.bsod.title}
              description={HOME_COPY.bsod.description}
            />
          </div>
          <div className="col-md-6">
            <HomeNavCard
              href="/relatorios"
              title={HOME_COPY.relatorios.title}
              description={HOME_COPY.relatorios.description}
            />
          </div>
          <div className="col-md-6">
            <HomeNavCard
              href="/configuracoes"
              title={HOME_COPY.configuracoes.title}
              description={HOME_COPY.configuracoes.description}
            />
          </div>
        </div>
      </section>

      <section className="home-status" aria-label="Status das conexões">
        <div className="home-status__item">
          <span className="home-status__label">{HOME_COPY.statusSir}</span>
          <span
            className={`home-status__badge ${sirPing.ok ? "home-status__badge--ok" : "home-status__badge--error"}`}
          >
            {sirPing.ok ? HOME_COPY.statusConnected : HOME_COPY.statusUnavailable}
          </span>
        </div>
        <div className="home-status__item">
          <span className="home-status__label">{HOME_COPY.statusHfc}</span>
          <span
            className={`home-status__badge ${hfcPing.ok ? "home-status__badge--ok" : "home-status__badge--error"}`}
          >
            {hfcPing.ok ? HOME_COPY.statusConnected : HOME_COPY.statusUnavailable}
          </span>
        </div>
      </section>
    </>
  );
}
