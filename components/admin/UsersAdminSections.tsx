"use client";

import { useCallback, useState } from "react";
import { UserApprovalPanel } from "@/components/admin/UserApprovalPanel";
import { UserManagementPanel } from "@/components/admin/UserManagementPanel";
import { ContentCard } from "@/components/ui/ContentCard";
import { AUTH_COPY } from "@/lib/config/auth-copy";

type UsersAdminSectionsProps = {
  currentUserId: number;
};

/** Aprovação e tabela geral compartilham o mesmo refresh após ações. */
export function UsersAdminSections({ currentUserId }: UsersAdminSectionsProps) {
  const [listVersion, setListVersion] = useState(0);
  const refreshUsers = useCallback(() => {
    setListVersion((version) => version + 1);
  }, []);

  return (
    <div className="content-card-grid content-card-grid--2">
      <ContentCard title={AUTH_COPY.adminPendingTitle} bodyClassName="p-3">
        <UserApprovalPanel onUsersChanged={refreshUsers} refreshToken={listVersion} />
      </ContentCard>

      <div className="content-card-grid__full">
        <ContentCard title={AUTH_COPY.adminAllUsersTitle} bodyClassName="p-3">
          <UserManagementPanel currentUserId={currentUserId} refreshToken={listVersion} />
        </ContentCard>
      </div>
    </div>
  );
}
