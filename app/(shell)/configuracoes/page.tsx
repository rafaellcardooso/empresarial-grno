import { AlertPrefsForm } from "@/components/account/AlertPrefsForm";
import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { TourRestartButton } from "@/components/tour/AppTour";
import { requireAuth } from "@/lib/auth/guards";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { TUTORIAL_COPY } from "@/lib/config/tutorial-copy";
import { getUserRegionPrefs } from "@/lib/queries/app-users";
import Link from "next/link";

export const metadata = { title: AUTH_COPY.settingsTitle };

/** Página de configurações do aplicativo. */
export default async function Page() {
  const session = await requireAuth();
  const regionPrefs = await getUserRegionPrefs(session.userId);

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
          <li className="list-group-item d-flex justify-content-between align-items-center gap-3">
            <div>
              <div>{TUTORIAL_COPY.settingsLinkLabel}</div>
              <div className="text-body-secondary small">{TUTORIAL_COPY.settingsLinkHint}</div>
            </div>
            <Link href="/ajuda" className="btn btn-sm btn-shell-outline">
              Abrir
            </Link>
          </li>
        </ul>
      </ContentCard>

      <ContentCard title={AUTH_COPY.settingsAlertsTitle} bodyClassName="p-3" className="mt-3">
        <p className="text-body-secondary mb-3">{AUTH_COPY.settingsAlertsLead}</p>
        <AlertPrefsForm initialAlertUfs={regionPrefs.alertUfs} idPrefix="settings-alert" />
      </ContentCard>
    </>
  );
}
