import React, { useState, useEffect } from "react";

import { Check, X, Info } from "lucide-react";

type NotificationType = "success" | "warning" | "error";

interface Notification {
  show: boolean;
  message: string;
  type: NotificationType;
}

interface NotificationProps {
  notification: Notification | null;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  notification,
  onClose,
}) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (notification && notification.show) {
      setFadeOut(false);
      setProgress(100);

      // Animation de la barre de progression
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(progressInterval);
            return 0;
          }
          return prev - 100 / 30;
        });
      }, 100);

      const fadeTimer = setTimeout(() => {
        setFadeOut(true);

        const hideTimer = setTimeout(() => {
          onClose();
        }, 500);

        return () => clearTimeout(hideTimer);
      }, 2500);

      return () => {
        clearTimeout(fadeTimer);
        clearInterval(progressInterval);
      };
    }
  }, [notification, onClose]);

  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  if (!notification || !notification.show) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-2 sm:right-4 rounded-lg shadow-lg ${
        notification.type === "success"
          ? "bg-green-600/70"
          : notification.type === "warning"
          ? "bg-yellow-600/70"
          : "bg-red-600/70"
      } text-white transition-all duration-500 transform z-50 text-sm sm:text-base overflow-hidden
      ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between space-x-3">
          <div className="flex items-center space-x-2">
            {notification.type === "success" ? (
              <>
                <Check />
                <span>{notification.message}</span>
              </>
            ) : null}
            {notification.type === "warning" ? (
              <>
                <Info />
                <span>{notification.message}</span>
              </>
            ) : null}
            {notification.type === "error" ? (
              <>
                <X />
                <span>{notification.message}</span>
              </>
            ) : null}
          </div>

          {/* Bouton de fermeture */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
            aria-label="Fermer la notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="h-1 bg-white/20 w-full">
        <div
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Notification;
