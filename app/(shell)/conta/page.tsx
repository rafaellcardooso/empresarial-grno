import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { TourRestartButton } from "@/components/tour/AppTour";
import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAuth } from "@/lib/auth/guards";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { getUserById, toPublicUser } from "@/lib/queries/app-users";

export const metadata = { title: "Minha conta" };

/** Página de conta: dados do usuário e troca de senha. */
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

      <div className="row g-3">
        <div className="col-lg-6">
          <ContentCard title="Dados da conta" bodyClassName="p-3">
            <dl className="row mb-0">
              <dt className="col-sm-4">Matrícula</dt>
              <dd className="col-sm-8">{publicUser.corporateId}</dd>
              <dt className="col-sm-4">Nome</dt>
              <dd className="col-sm-8">{publicUser.name}</dd>
              <dt className="col-sm-4">E-mail</dt>
              <dd className="col-sm-8">{publicUser.email ?? "—"}</dd>
              <dt className="col-sm-4">Papel</dt>
              <dd className="col-sm-8">
                {publicUser.role === "STAFF" ? "Administrador" : "Usuário"}
              </dd>
              <dt className="col-sm-4">Status</dt>
              <dd className="col-sm-8">{publicUser.status}</dd>
            </dl>
          </ContentCard>
        </div>

        <div className="col-lg-6">
          <ContentCard title="Alterar senha" bodyClassName="p-3">
            <ChangePasswordForm />
          </ContentCard>
        </div>

        <div className="col-12">
          <ContentCard title="Tour da aplicação" bodyClassName="p-3">
            <p className="text-body-secondary mb-3">
              Revise os principais recursos do Empresarial GRNO.
            </p>
            <TourRestartButton />
          </ContentCard>
        </div>
      </div>
    </>
  );
}
