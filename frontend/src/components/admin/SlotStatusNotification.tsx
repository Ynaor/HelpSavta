import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface SlotStatusNotificationProps {
  type: 'slot_released' | 'slot_deleted' | 'slot_booked' | 'slot_created' | 'info' | 'success' | 'warning' | 'error';
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  hideDelay?: number;
}

const SlotStatusNotification: React.FC<SlotStatusNotificationProps> = ({
  type,
  message,
  onDismiss,
  autoHide = true,
  hideDelay = 3000
}) => {
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, hideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'slot_released':
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'slot_deleted':
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'slot_booked':
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'slot_created':
      case 'info':
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'slot_released':
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'slot_deleted':
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'slot_booked':
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'slot_created':
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  const getHebrewMessage = () => {
    switch (type) {
      case 'slot_released':
        return message || 'הזמן שוחרר בהצלחה';
      case 'slot_deleted':
        return message || 'הזמן נמחק מהמערכת';
      case 'slot_booked':
        return message || 'הזמן נתפס';
      case 'slot_created':
        return message || 'זמן חדש נוצר';
      default:
        return message;
    }
  };

  return (
    <div
      className={`mb-4 p-4 border rounded-lg flex items-center space-x-reverse space-x-2 ${getStyles()}`}
      role="alert"
    >
      {getIcon()}
      <span className="flex-1">{getHebrewMessage()}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label="סגור הודעה"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SlotStatusNotification;