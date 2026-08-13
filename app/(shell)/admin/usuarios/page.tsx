import { UserApprovalPanel } from "@/components/admin/UserApprovalPanel";
import { UserManagementPanel } from "@/components/admin/UserManagementPanel";
import { ContentCard } from "@/components/ui/ContentCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireStaff } from "@/lib/auth/guards";
import { AUTH_COPY } from "@/lib/config/auth-copy";

export const metadata = { title: AUTH_COPY.adminUsersTitle };

/** Página staff: aprovação de cadastros e listagem. */
export default async function Page() {
  const session = await requireStaff();

  return (
    <>
      <PageHeader title={AUTH_COPY.adminUsersTitle} description={AUTH_COPY.adminUsersLead} />

      <div className="content-card-grid content-card-grid--2">
        <ContentCard title={AUTH_COPY.adminPendingTitle} bodyClassName="p-3">
          <UserApprovalPanel />
        </ContentCard>

        <div className="content-card-grid__full">
          <ContentCard title={AUTH_COPY.adminAllUsersTitle} bodyClassName="p-3">
            <UserManagementPanel currentUserId={session.userId} />
          </ContentCard>
        </div>
      </div>
    </>
  );
}
