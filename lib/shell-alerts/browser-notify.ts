/** Indica se o navegador suporta a API de notificações do sistema. */
function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Pede permissão de notificação do sistema no primeiro clique do usuário (exigência dos navegadores). */
export function requestNotificationPermissionOnInteraction(): () => void {
  if (!isNotificationSupported() || Notification.permission !== "default") {
    return () => undefined;
  }
  const handlePointerDown = () => {
    void Notification.requestPermission();
  };
  window.addEventListener("pointerdown", handlePointerDown, { once: true });
  return () => window.removeEventListener("pointerdown", handlePointerDown);
}

/** Exibe notificação do sistema quando a aba está em segundo plano; clique foca a aba e executa `onClick`. */
export function showBackgroundNotification(
  title: string,
  body: string,
  tag: string,
  onClick: () => void,
): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;
  if (document.visibilityState !== "hidden") return;
  const notification = new Notification(title, { body, tag });
  notification.onclick = () => {
    window.focus();
    onClick();
    notification.close();
  };
}
