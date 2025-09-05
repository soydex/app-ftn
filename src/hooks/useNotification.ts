import { useState } from "react";

type NotificationType = "success" | "warning" | "error";

interface Notification {
  show: boolean;
  message: string;
  type: NotificationType;
}

const useNotification = () => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (message: string, type: NotificationType = "success") => {
    setNotification({ show: true, message, type });
  };

  const hideNotification = () => {
    setNotification((prev) => (prev ? { ...prev, show: false } : null));
    setTimeout(() => setNotification(null), 300);
  };

  return {
    notification,
    showNotification,
    hideNotification,
  };
};

export default useNotification;
