import { NotificationList } from "@/components/notifications/NotificationList";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAuth } from "@/lib/auth/guards";
import { AUTH_COPY } from "@/lib/config/auth-copy";

export const metadata = { title: "Notificações" };

/** Página de notificações do usuário. */
export default async function Page() {
  await requireAuth();

  return (
    <>
      <PageHeader title={AUTH_COPY.notificationsTitle} description={AUTH_COPY.notificationsLead} />
      <NotificationList />
    </>
  );
}
