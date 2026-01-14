
import React from 'react';
import type { User } from '../types';
import VerifiedBadgeIcon from './icons/VerifiedBadgeIcon';

interface SwitchAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  activeUserId: string;
  onSwitchAccount: (userId: string) => void;
  onAddAccount: () => void;
}

const SwitchAccountModal: React.FC<SwitchAccountModalProps> = ({ 
  isOpen, 
  onClose, 
  users, 
  activeUserId, 
  onSwitchAccount, 
  onAddAccount 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-gray-900/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-gray-900 tracking-tighter">Switch Vault</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Global Account Manager</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full border border-gray-100 shadow-sm transition-all active:scale-95">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 scrollbar-hide">
          {users.map(user => {
            const isActive = user.id === activeUserId;
            return (
              <button
                key={user.id}
                disabled={isActive}
                onClick={() => onSwitchAccount(user.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-[1.8rem] transition-all relative overflow-hidden group ${
                  isActive 
                  ? 'bg-blue-50 ring-2 ring-blue-500/20 cursor-default' 
                  : 'bg-gray-50 hover:bg-white hover:shadow-xl hover:-translate-y-0.5 border border-transparent hover:border-gray-100'
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden border border-gray-100 ring-1 ring-black/5 group-hover:ring-blue-500/30 transition-all">
                    {user.profilePic ? (
                      <img src={user.profilePic} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-black text-gray-300 uppercase">{user.username.substring(0, 2)}</span>
                    )}
                  </div>
                  {user.kycStatus === 'verified' && (
                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                      <VerifiedBadgeIcon className="w-4 h-4 text-blue-500" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-left">
                  <p className={`font-black text-sm tracking-tight ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                    @{user.username}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    {user.role === 'admin' ? 'Ecosystem Owner' : 'Standard Vault'}
                  </p>
                </div>

                {isActive && (
                  <span className="text-[8px] font-black bg-blue-600 text-white px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/20">
                    Active
                  </span>
                )}
                
                {!isActive && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                         </svg>
                    </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-gray-50/50 border-t border-gray-50">
          <button
            onClick={onAddAccount}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-gray-200 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest text-gray-600 hover:text-[#2A74B1] hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all active:scale-95 group"
          >
            <div className="bg-gray-100 group-hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            Add New Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwitchAccountModal;
