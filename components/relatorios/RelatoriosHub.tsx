import { RelatorioHubCard } from "@/components/relatorios/RelatorioHubCard";
import { RELATORIO_HUB_ITEMS } from "@/lib/config/relatorios-hub";

/** Grade de cards do hub de relatórios. */
export function RelatoriosHub() {
  return (
    <div className="row g-3">
      {RELATORIO_HUB_ITEMS.map((item) => (
        <div key={item.id} className="col-md-6 col-xl-4">
          <RelatorioHubCard
            href={item.href}
            title={item.title}
            description={item.description}
            icon={item.icon}
            available={item.available}
          />
        </div>
      ))}
    </div>
  );
}
