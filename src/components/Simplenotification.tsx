import { X } from "lucide-react";
type NotificationType = "success" | "error" | "warning";

interface Notification {
  message: string;
  type: NotificationType;
}

const SimpleNotification = ({
  notification,
  onClose,
}: {
  notification: Notification | null;
  onClose?: () => void;
}) => {
  if (!notification) {
    return null;
  }

  return (
    <div
      className={`mt-4 mb-4 p-4 rounded-lg relative ${
        notification.type === "error"
          ? "bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-200"
          : notification.type === "warning"
          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-200"
          : "bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-200"
      }`}
    >
      {notification.message}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 p-1 right-2 text-current opacity-70 hover:opacity-100 transition-opacity duration-200 rounded-full hover:bg-black/10"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default SimpleNotification;
