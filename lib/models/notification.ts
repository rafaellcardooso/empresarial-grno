/** Notificação criada pelo staff. */
export type AppNotificationRecord = {
  id: number;
  title: string;
  body: string;
  created_by: number;
  created_at: Date;
  sent_at: Date | null;
};

/** Notificação entregue a um usuário. */
export type UserNotificationRecord = {
  notification_id: number;
  title: string;
  body: string;
  created_at: Date;
  sent_at: Date | null;
  delivered_at: Date;
  read_at: Date | null;
};
