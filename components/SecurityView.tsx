
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
      notify("Security Alert", "Current password does not match our records.", "error");
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
      notify("Security Updated", "Your password has been changed successfully.", "success");
      setPasswordForm({ current: '', new: '', confirm: '' });
      setIsUpdatingPassword(false);
    }, 1500);
  };

  const toggleBiometric = () => {
    const newVal = !user.biometricEnabled;
    onUpdateUser({ ...user, biometricEnabled: newVal });
    notify(
        newVal ? "Biometric Enabled" : "Biometric Disabled", 
        newVal ? "Your vault will now auto-lock when you leave the app." : "Auto-lock has been deactivated.", 
        "info"
    );
  };

  const clearSessions = () => {
    localStorage.removeItem('wow_session');
    notify("Sessions Cleared", "You have been logged out of all other sessions.", "info");
    // In a real app, this would also redirect or lock the app
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 17.91c-3.41-1.15-6-4.86-6-8.91V6.3l6-2.25 6 2.25V11c0 4.05-2.59 7.76-6 8.91z" />
          </svg>
        </div>
        <h2 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-1">Security Core</h2>
        <h3 className="text-2xl font-bold">Privacy & Protection</h3>
        <p className="text-xs text-blue-100 mt-2 opacity-70">Manage your credentials and active sessions across the WoW ecosystem.</p>
      </div>

      {/* Biometric Security Toggle */}
      <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-3 rounded-2xl">
              <svg className="w-6 h-6 text-[#2A74B1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-1.17-1.99c1.262-3.11 1.923-6.521 1.923-10.081 0-3.56-.661-6.971-1.923-10.081m-1.17 1.99C8.91 6.201 10 9.483 10 13c0 3.517-1.009 6.799-2.753 9.571m-1.17-1.99c1.262-3.11 1.923-6.521 1.923-10.081V0" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a3 3 0 116 0v6m-6 0h6m-6 2.5H4a1 1 0 00-1 1v4a1 1 0 001 1h9a1 1 0 001-1v-4a1 1 0 00-1-1h-3" />
              </svg>
            </div>
            <div>
              <h4 className="font-black text-gray-800 uppercase tracking-tighter">Fingerprint Login</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Enable biometric auto-lock</p>
            </div>
          </div>
          
          <button 
            onClick={toggleBiometric}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-500 focus:outline-none ${user.biometricEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-500 shadow-md ${user.biometricEnabled ? 'translate-x-7' : 'translate-x-1'}`}
            />
          </button>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
             <p className="text-[9px] text-gray-500 font-bold leading-relaxed uppercase tracking-wider">
                When enabled, the app will instantly lock whenever you exit or minimize it. You will need to scan your fingerprint or enter your PIN to re-enter the WoW ecosystem.
             </p>
        </div>
      </div>

      {/* Password Management */}
      <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-50 p-3 rounded-2xl">
            <svg className="w-5 h-5 text-[#2A74B1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <h4 className="font-black text-gray-800 uppercase tracking-tighter">Change Password</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Update your login credentials</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Current Password</label>
            <input 
              type="password" 
              required
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
              className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">New Password</label>
              <input 
                type="password" 
                required
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Confirm New</label>
              <input 
                type="password" 
                required
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={isUpdatingPassword}
            className="w-full bg-[#2A74B1] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all flex items-center justify-center shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
          >
            {isUpdatingPassword ? 'Processing Request...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Active Sessions */}
      <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-50 p-3 rounded-2xl">
            <svg className="w-5 h-5 text-[#F58220]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h4 className="font-black text-gray-800 uppercase tracking-tighter">Active Sessions</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Devices currently logged in</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                 <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                   <path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm1 2v10h14V5H3zm8 11v-1H9v1h2zm3-11H6v2h8V5z" />
                 </svg>
              </div>
              <div>
                <p className="text-xs font-black text-gray-800">Current Device</p>
                <p className="text-[9px] text-gray-400 uppercase font-bold">Browser Session • Lagos, Nigeria</p>
              </div>
            </div>
            <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-widest">Online</span>
          </div>

          <button 
            onClick={clearSessions}
            className="w-full py-4 text-[10px] font-black text-red-500 hover:bg-red-50 transition-colors uppercase tracking-widest border border-dashed border-red-200 rounded-2xl"
          >
            Logout & Terminate All Sessions
          </button>
        </div>
      </div>

      <div className="text-center">
        <Logo className="h-6 mx-auto opacity-20" showText={true} />
        <p className="text-[8px] text-gray-300 font-black uppercase tracking-[0.2em] mt-2">End-to-End Encryption Enabled</p>
      </div>
    </div>
  );
};

export default SecurityView;
