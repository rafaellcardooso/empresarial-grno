import { NotificationComposer } from "@/components/admin/NotificationComposer";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireStaff } from "@/lib/auth/guards";
import { AUTH_COPY } from "@/lib/config/auth-copy";

export const metadata = { title: "Notificações — admin" };

/** Página staff para criar e disparar notificações. */
export default async function Page() {
  await requireStaff();

  return (
    <>
      <PageHeader
        title={AUTH_COPY.adminNotificationsTitle}
        description={AUTH_COPY.adminNotificationsLead}
      />
      <NotificationComposer />
    </>
  );
}
