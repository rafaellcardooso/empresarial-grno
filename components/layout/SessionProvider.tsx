"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ShellSessionData } from "@/lib/auth/shell-session";
import { applyClientTheme } from "@/lib/auth/theme-client";
import type { AppTheme } from "@/lib/auth/theme";

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

  const setTheme = useCallback((nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    applyClientTheme(nextTheme);
    fetch("/api/account/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: nextTheme }),
    }).catch(() => undefined);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user: initial.user,
      pendingUsersCount: initial.pendingUsersCount,
      tourShouldRun: initial.tourShouldRun,
      theme,
      unreadNotifications,
      setTheme,
      setUnreadNotifications,
    }),
    [initial, theme, unreadNotifications, setTheme],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
