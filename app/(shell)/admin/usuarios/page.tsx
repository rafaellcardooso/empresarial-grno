import { UsersAdminSections } from "@/components/admin/UsersAdminSections";
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
      <UsersAdminSections currentUserId={session.userId} />
    </>
  );
}
