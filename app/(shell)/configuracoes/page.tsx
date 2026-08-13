import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { TourRestartButton } from "@/components/tour/AppTour";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import Link from "next/link";

export const metadata = { title: AUTH_COPY.settingsTitle };

/** Página de configurações do aplicativo. */
export default function Page() {
  return (
    <>
      <PageHeader title={AUTH_COPY.settingsTitle} description={AUTH_COPY.settingsLead} />
      <ContentCard title={AUTH_COPY.settingsPreferencesTitle} bodyClassName="p-0">
        <ul className="list-group list-group-flush">
          <li className="list-group-item d-flex justify-content-between align-items-center gap-3">
            <span>{AUTH_COPY.settingsThemeLabel}</span>
            <span className="text-body-secondary small">{AUTH_COPY.settingsThemeHint}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center gap-3">
            <span>{AUTH_COPY.settingsSidebarLabel}</span>
            <span className="text-body-secondary small">{AUTH_COPY.settingsSidebarHint}</span>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center gap-3">
            <span>{AUTH_COPY.settingsAccountLabel}</span>
            <Link href="/conta" className="btn btn-sm btn-shell-outline">
              {AUTH_COPY.settingsAccountCta}
            </Link>
          </li>
          <li className="list-group-item d-flex justify-content-between align-items-center gap-3">
            <span>{AUTH_COPY.settingsTourLabel}</span>
            <TourRestartButton />
          </li>
        </ul>
      </ContentCard>
    </>
  );
}
