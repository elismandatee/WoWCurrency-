
import React, { useEffect, useState } from 'react';
import type { AppNotification } from '../types';

interface NotificationToastProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(notification.id), 400);
    }, 6000); // 6 seconds visibility
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const typeStyles = {
    success: 'bg-white border-green-500 shadow-green-500/10 text-gray-900',
    info: 'bg-white border-blue-500 shadow-blue-500/10 text-gray-900',
    warning: 'bg-white border-yellow-500 shadow-yellow-500/10 text-gray-900',
    error: 'bg-white border-red-500 shadow-red-500/10 text-gray-900',
  };

  const Icon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <div className="bg-green-500 rounded-full p-1.5 text-white shadow-sm shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="bg-blue-500 rounded-full p-1.5 text-white shadow-sm shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="bg-yellow-500 rounded-full p-1.5 text-white shadow-sm shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625l6.28-10.875zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-500 rounded-full p-1.5 text-white shadow-sm shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative w-full backdrop-blur-md border-r-4 shadow-2xl rounded-2xl p-4 flex items-start gap-4 transition-all duration-500 transform ${
        isExiting ? 'opacity-0 translate-x-20 scale-95' : 'opacity-100 translate-x-0 scale-100'
      } ${typeStyles[notification.type]} animate-slide-in`}
    >
      <Icon />
      <div className="flex-1">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-0.5 opacity-60 leading-none">{notification.title}</h4>
        <p className="text-[13px] font-bold leading-snug">{notification.message}</p>
      </div>
      <button 
        onClick={() => { setIsExiting(true); setTimeout(() => onDismiss(notification.id), 400); }} 
        className="text-gray-300 hover:text-gray-900 transition-colors p-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
      
      {/* Progress Bar for Expiry */}
      <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-b-2xl animate-shrink-width" />
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-shrink-width {
          animation: shrinkWidth 6s linear forwards;
        }
        .animate-slide-in {
          animation: slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}} />
    </div>
  );
};

export default NotificationToast;
