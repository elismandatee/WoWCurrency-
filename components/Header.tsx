
import React, { useState, useRef, useEffect } from 'react';
import type { KycStatus, User, AppNotification } from '../types';
import Logo from './Logo';
import LogoutIcon from './icons/LogoutIcon';
import BellIcon from './icons/BellIcon';
import ArrowsRightLeftIcon from './icons/ArrowsRightLeftIcon';

interface HeaderProps {
    onOpenKyc: () => void;
    onLogout: () => void;
    onSwitchAccount: () => void;
    kycStatus: KycStatus;
    user?: User;
    notifications: AppNotification[];
    onMarkAsRead: () => void;
    onClearAll: () => void;
}

const KycStatusIndicator: React.FC<{ status: KycStatus }> = ({ status }) => {
    const statusConfig = {
        unverified: {
            classes: 'bg-gray-400',
            tooltip: 'KYC Unverified - Click to complete'
        },
        pending: {
            classes: 'bg-yellow-500 animate-pulse',
            tooltip: 'KYC Pending Review'
        },
        verified: {
            classes: 'bg-green-500',
            tooltip: 'KYC Verified'
        },
        rejected: {
            classes: 'bg-red-500 animate-bounce',
            tooltip: 'KYC Rejected - Please Resubmit'
        },
    };
    
    const config = statusConfig[status];

    return (
        <span 
            title={config.tooltip} 
            className={`absolute top-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-white shadow-sm ${config.classes}`} 
        />
    );
};

const Header: React.FC<HeaderProps> = ({ onOpenKyc, onLogout, onSwitchAccount, kycStatus, user, notifications, onMarkAsRead, onClearAll }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
            setIsNotifOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotifs = () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen) {
        onMarkAsRead();
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto p-4 flex justify-between items-center relative">
        <Logo className="h-10" />
        
        <div className="flex items-center gap-1.5 md:gap-3">
          <div className="relative" ref={notifRef}>
            <button 
                onClick={handleOpenNotifs}
                className={`p-2.5 rounded-full transition-all relative group ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}
            >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isNotifOpen && (
                <div className="absolute top-14 right-0 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Notifications</h4>
                        <button 
                            onClick={onClearAll}
                            className="text-[9px] font-black uppercase text-red-500 hover:underline"
                        >
                            Clear History
                        </button>
                    </div>
                    
                    <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center space-y-3">
                                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                    <BellIcon className="w-6 h-6" />
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No activity yet</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className={`p-5 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{n.title}</p>
                                        <span className="text-[8px] font-bold text-gray-300 uppercase">{n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-700 leading-snug">{n.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
          </div>

          <button 
            onClick={onSwitchAccount}
            title="Switch Account"
            className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all active:scale-95"
          >
            <ArrowsRightLeftIcon className="w-6 h-6" />
          </button>

          <div className="h-6 w-px bg-gray-100" />

          <button 
            onClick={onLogout}
            title="Logout"
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-95"
          >
            <LogoutIcon className="w-6 h-6" />
          </button>
          
          <button 
            onClick={onOpenKyc} 
            className="relative w-10 h-10 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all active:scale-95 overflow-visible"
          >
            {user?.profilePic ? (
               <img src={user.profilePic} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xs font-black text-gray-300 uppercase">{user?.username.substring(0, 2) || '??'}</span>
            )}
            <KycStatusIndicator status={kycStatus} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
