
import React, { useState, useRef, useEffect } from 'react';
import type { KycStatus, User, AppNotification } from '../types';
import { subscribeToCloudHealth } from '../services/firebase';
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
        unverified: { classes: 'bg-gray-400', tooltip: 'KYC Unverified' },
        pending: { classes: 'bg-yellow-500 animate-pulse', tooltip: 'KYC Pending' },
        verified: { classes: 'bg-green-500', tooltip: 'KYC Verified' },
        rejected: { classes: 'bg-red-500 animate-bounce', tooltip: 'KYC Rejected' },
    };
    const config = statusConfig[status];
    return (
        <span title={config.tooltip} className={`absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white shadow-sm ${config.classes}`} />
    );
};

const Header: React.FC<HeaderProps> = ({ 
    onOpenKyc, onLogout, onSwitchAccount, kycStatus, user, notifications, onMarkAsRead, onClearAll
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState({ connected: false, latency: 0, protocol: 'LOCAL' });
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    return subscribeToCloudHealth((m) => {
        setCloudStatus({ connected: m.connected, latency: m.latency, protocol: m.protocol });
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-6xl mx-auto p-4 flex justify-between items-center relative">
        <Logo className="h-10" />
        
        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Enhanced Ecosystem Status Monitor */}
          <div className="hidden lg:flex items-center gap-3 mr-4 px-4 py-2 bg-slate-50 rounded-[1.2rem] border border-slate-100 shadow-inner group cursor-default">
            <div className="relative">
                <div className={`w-2 h-2 rounded-full transition-all duration-1000 ${cloudStatus.connected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-400 animate-pulse'}`} />
                {cloudStatus.connected && <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />}
            </div>
            <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                    {cloudStatus.protocol} BRIDGE
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">
                        {cloudStatus.connected ? 'Cloud Active' : 'Connecting...'}
                    </span>
                    {cloudStatus.latency > 0 && (
                        <span className="text-[8px] font-mono font-bold text-blue-500">{cloudStatus.latency}ms</span>
                    )}
                </div>
            </div>
          </div>

          <div className="relative" ref={notifRef}>
            <button 
                onClick={() => { setIsNotifOpen(!isNotifOpen); if (!isNotifOpen) onMarkAsRead(); }}
                className={`p-2.5 rounded-full transition-all relative group ${isNotifOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}
            >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full ring-2 ring-white animate-bounce">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isNotifOpen && (
                <div className="absolute top-14 right-0 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-[2.2rem] shadow-[0_30px_70px_rgba(0,0,0,0.2)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live Activity</h4>
                        <button onClick={onClearAll} className="text-[9px] font-black uppercase text-red-500 hover:underline">Flush History</button>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto divide-y divide-gray-50 scrollbar-hide">
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center opacity-30">
                                <BellIcon className="w-10 h-10 mx-auto mb-3" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Vault quiet</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className={`p-6 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/30' : ''}`}>
                                    <div className="flex justify-between items-start mb-1.5">
                                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">{n.title}</p>
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

          <button onClick={onSwitchAccount} title="Switch Vault" className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all active:scale-95">
            <ArrowsRightLeftIcon className="w-6 h-6" />
          </button>

          <div className="h-6 w-px bg-gray-100 mx-1" />

          <button onClick={onLogout} title="Lock Vault" className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-95">
            <LogoutIcon className="w-6 h-6" />
          </button>
          
          <button onClick={onOpenKyc} className="relative w-11 h-11 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center transition-all active:scale-90 overflow-visible ring-offset-2 hover:ring-2 hover:ring-blue-500/20">
            {user?.profilePic ? (
               <img src={user.profilePic} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-xs font-black text-gray-300 uppercase">{user?.username.substring(0, 2)}</span>
            )}
            <KycStatusIndicator status={kycStatus} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
