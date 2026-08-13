import { AccountProfileForm } from "@/components/account/AccountProfileForm";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { TourRestartButton } from "@/components/tour/AppTour";
import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAuth } from "@/lib/auth/guards";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { getUserById, toPublicUser } from "@/lib/queries/app-users";

export const metadata = { title: AUTH_COPY.accountTitle };

/** Página de conta: dados cadastrais, senha e tour. */
export default async function Page() {
  const session = await requireAuth();
  const user = await getUserById(session.userId);

  if (!user) {
    return null;
  }

  const publicUser = toPublicUser(user);

  return (
    <>
      <PageHeader title={AUTH_COPY.accountTitle} description={AUTH_COPY.accountLead} />

      <div className="content-card-grid content-card-grid--2">
        <ContentCard title={AUTH_COPY.accountDataTitle} bodyClassName="p-3">
          <dl className="row mb-3">
            <dt className="col-sm-4">Papel</dt>
            <dd className="col-sm-8">
              {publicUser.role === "STAFF" ? AUTH_COPY.staffBadge : "Usuário"}
            </dd>
            <dt className="col-sm-4">Status</dt>
            <dd className="col-sm-8">{publicUser.status}</dd>
          </dl>
          <AccountProfileForm
            initialCorporateId={publicUser.corporateId}
            initialName={publicUser.name}
            initialEmail={publicUser.email}
          />
        </ContentCard>

        <ContentCard title={AUTH_COPY.accountPasswordTitle} bodyClassName="p-3">
          <ChangePasswordForm />
        </ContentCard>

        <div className="content-card-grid__full">
          <ContentCard title={AUTH_COPY.accountTourTitle} bodyClassName="p-3">
            <p className="text-body-secondary mb-3">{AUTH_COPY.accountTourLead}</p>
            <TourRestartButton />
          </ContentCard>
        </div>
      </div>
    </>
  );
}
