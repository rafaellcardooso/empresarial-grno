import { UserApprovalPanel } from "@/components/admin/UserApprovalPanel";
import { UserManagementPanel } from "@/components/admin/UserManagementPanel";
import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireStaff } from "@/lib/auth/guards";
import { AUTH_COPY } from "@/lib/config/auth-copy";

export const metadata = { title: "Usuários" };

/** Página staff: aprovação de cadastros e listagem. */
export default async function Page() {
  await requireStaff();

  return (
    <>
      <PageHeader title={AUTH_COPY.adminUsersTitle} description={AUTH_COPY.adminUsersLead} />

      <div className="row g-3">
        <div className="col-lg-6">
          <ContentCard title="Cadastros pendentes" bodyClassName="p-3">
            <UserApprovalPanel />
          </ContentCard>
        </div>
        <div className="col-12">
          <ContentCard title="Todos os usuários" bodyClassName="p-3">
            <UserManagementPanel />
          </ContentCard>
        </div>
      </div>
    </>
  );
}
