
import React, { useState } from 'react';
import type { User } from '../types';
import Logo from './Logo';

interface SecurityViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const SecurityView: React.FC<SecurityViewProps> = ({ user, onUpdateUser, notify }) => {
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.current !== user.password) {
      notify("Security Alert", "Current password mismatch.", "error");
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      notify("Validation Error", "New password and confirmation do not match.", "error");
      return;
    }
    if (passwordForm.new.length < 6) {
      notify("Security Alert", "Password must be at least 6 characters.", "warning");
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      onUpdateUser({ ...user, password: passwordForm.new });
      notify("Security Updated", "Your password has been changed.", "success");
      setPasswordForm({ current: '', new: '', confirm: '' });
      setIsUpdatingPassword(false);
    }, 1500);
  };

  const toggleBiometric = () => {
    const newVal = !user.biometricEnabled;
    onUpdateUser({ ...user, biometricEnabled: newVal });
    notify(
        newVal ? "Biometric Enabled" : "Biometric Disabled", 
        newVal ? "Vault will auto-lock when minimized." : "Auto-lock deactivated.", 
        "info"
    );
  };

  const clearSessions = () => {
    localStorage.removeItem('wow_session');
    notify("Sessions Cleared", "Logged out from all devices.", "info");
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.05]">
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 17.91c-3.41-1.15-6-4.86-6-8.91V6.3l6-2.25 6 2.25V11c0 4.05-2.59 7.76-6 8.91z" />
          </svg>
        </div>
        <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1 opacity-60">Security Core</h2>
        <h3 className="text-2xl font-bold">Privacy & Protection</h3>
      </div>

      {/* Biometric Security Toggle */}
      <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-2xl opacity-40">
              <svg className="w-6 h-6 text-[#2A74B1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a3 3 0 116 0v6m-6 0h6m-6 2.5H4a1 1 0 00-1 1v4a1 1 0 001 1h9a1 1 0 001-1v-4a1 1 0 00-1-1h-3" />
              </svg>
            </div>
            <div>
              <h4 className="font-black text-gray-800 uppercase tracking-tighter">Fingerprint Login</h4>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest opacity-30">Auto-lock</p>
            </div>
          </div>
          
          <button 
            onClick={toggleBiometric}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-500 focus:outline-none ${user.biometricEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-500 shadow-md ${user.biometricEnabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>

      {/* Password Management - Dimmed labels */}
      <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6 opacity-30">
          <h4 className="font-black text-gray-800 uppercase tracking-tighter">Vault Pass Update</h4>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-gray-400/50 uppercase tracking-widest ml-4">Current Key</label>
            <input 
              type="text" 
              required
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
              className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-black text-gray-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-400/50 uppercase tracking-widest ml-4">New Key</label>
              <input 
                type="text" 
                required
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-black text-gray-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                placeholder="New key"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-400/50 uppercase tracking-widest ml-4">Confirm New</label>
              <input 
                type="text" 
                required
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-black text-gray-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                placeholder="Confirm"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={isUpdatingPassword}
            className="w-full bg-[#2A74B1] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all flex items-center justify-center shadow-xl active:scale-95 disabled:opacity-50"
          >
            {isUpdatingPassword ? 'Syncing...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SecurityView;
