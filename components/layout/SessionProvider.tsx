"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { RegionSetupModal } from "@/components/account/RegionSetupModal";
import type { ShellSessionData } from "@/lib/auth/shell-session";
import { applyClientTheme } from "@/lib/auth/theme-client";
import type { AppTheme } from "@/lib/auth/theme";
import { apiFetch } from "@/lib/config/base-path";
import type { UserRegionUf } from "@/lib/config/user-regions";

type SessionContextValue = ShellSessionData & {
  setTheme: (theme: AppTheme) => void;
  setUnreadNotifications: (count: number) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/** Acessa dados de sessão compartilhados pelo shell. */
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}

type SessionProviderProps = {
  initial: ShellSessionData;
  children: ReactNode;
};

/** Provê sessão do usuário ao navbar, sidebar e widgets do shell. */
export function SessionProvider({ initial, children }: SessionProviderProps) {
  const [theme, setThemeState] = useState<AppTheme>(initial.theme);
  const [unreadNotifications, setUnreadNotifications] = useState(initial.unreadNotifications);
  const [homeUf, setHomeUf] = useState<UserRegionUf | null>(initial.homeUf);
  const [alertUfs, setAlertUfs] = useState<UserRegionUf[]>(initial.alertUfs);
  const [needsRegionSetup, setNeedsRegionSetup] = useState(initial.needsRegionSetup);

  useEffect(() => {
    setHomeUf(initial.homeUf);
    setAlertUfs(initial.alertUfs);
    setNeedsRegionSetup(initial.needsRegionSetup);
  }, [initial.homeUf, initial.alertUfs, initial.needsRegionSetup]);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    applyClientTheme(nextTheme);
    apiFetch("/api/account/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: nextTheme }),
    }).catch(() => undefined);
  }, []);

  /** Atualiza preferências regionais após o modal de onboarding. */
  const handleRegionSetupCompleted = useCallback(
    (nextHomeUf: UserRegionUf, nextAlertUfs: UserRegionUf[]) => {
      setHomeUf(nextHomeUf);
      setAlertUfs(nextAlertUfs);
      setNeedsRegionSetup(false);
    },
    [],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      user: initial.user,
      pendingUsersCount: initial.pendingUsersCount,
      tourShouldRun: initial.tourShouldRun && !needsRegionSetup,
      theme,
      unreadNotifications,
      homeUf,
      alertUfs,
      needsRegionSetup,
      setTheme,
      setUnreadNotifications,
    }),
    [initial, theme, unreadNotifications, homeUf, alertUfs, needsRegionSetup, setTheme],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
      {needsRegionSetup ? (
        <RegionSetupModal
          initialHomeUf={homeUf}
          initialAlertUfs={alertUfs}
          onCompleted={handleRegionSetupCompleted}
        />
      ) : null}
    </SessionContext.Provider>
  );
}
