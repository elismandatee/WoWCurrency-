
import React, { useState, useRef } from 'react';
import type { User } from '../types';
import VerifiedBadgeIcon from './icons/VerifiedBadgeIcon';

interface ProfileViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, notify }) => {
  const isVerified = user.kycStatus === 'verified';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    username: user.username,
    fullName: user.profile?.fullName || '',
    dateOfBirth: user.profile?.dateOfBirth || '',
    idNumber: user.profile?.idNumber || '',
    phoneNumber: user.phoneNumber || user.profile?.phoneNumber || '',
    profilePic: user.profilePic || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
          notify("Library Error", "Image too large. Max 5MB.", "error");
          return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, profilePic: event.target?.result as string }));
        notify("Library Sync", "Profile picture updated.", "info");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      const updatedUser: User = {
        ...user,
        username: formData.username,
        phoneNumber: formData.phoneNumber,
        profilePic: formData.profilePic,
        profile: user.profile ? {
          ...user.profile,
          fullName: isVerified ? user.profile.fullName : formData.fullName,
          dateOfBirth: isVerified ? user.profile.dateOfBirth : formData.dateOfBirth,
          idNumber: isVerified ? user.profile.idNumber : formData.idNumber,
        } : null,
      };

      onUpdateUser(updatedUser);
      setIsSaving(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100 flex items-center justify-center group relative">
            {formData.profilePic ? (
              <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-gray-300 uppercase">{formData.username.substring(0, 2)}</span>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest"
            >
              Open Gallery
            </button>
          </div>
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-lg">
              <VerifiedBadgeIcon className="w-6 h-6 text-[#2A74B1]" />
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-black text-gray-900 leading-tight">@{formData.username}</h3>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1 opacity-40">
            {isVerified ? 'Verified WoW Citizen' : 'Unverified Identity'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2 px-2">
            <h4 className="text-[10px] font-black text-[#2A74B1]/40 uppercase tracking-widest">Configuration</h4>
            {isVerified && (
               <span className="flex items-center gap-1 text-[8px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
                 Admin Lock
               </span>
            )}
          </div>
          
          <div className="relative">
            <label className="text-[8px] font-black text-gray-400/50 uppercase tracking-widest ml-4 block mb-1">Username</label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-black text-gray-900 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <label className="text-[8px] font-black text-gray-400/50 uppercase tracking-widest ml-4 block mb-1">Full Legal Name</label>
            <input 
              type="text" 
              value={formData.fullName}
              readOnly={isVerified}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              className={`w-full p-4 rounded-2xl text-sm font-black transition-all ${isVerified ? 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed' : 'bg-gray-50 border border-gray-100 focus:ring-4 focus:ring-blue-500/10 outline-none text-gray-900'}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="text-[8px] font-black text-gray-400/50 uppercase tracking-widest ml-4 block mb-1">Birth Date</label>
              <input 
                type="date" 
                value={formData.dateOfBirth}
                readOnly={isVerified}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                className={`w-full p-4 rounded-2xl text-sm font-black transition-all ${isVerified ? 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed' : 'bg-gray-50 border border-gray-100 focus:ring-4 focus:ring-blue-500/10 outline-none text-gray-900'}`}
              />
            </div>
            <div className="relative">
              <label className="text-[8px] font-black text-gray-400/50 uppercase tracking-widest ml-4 block mb-1">ID Number</label>
              <input 
                type="text" 
                value={formData.idNumber}
                readOnly={isVerified}
                onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                className={`w-full p-4 rounded-2xl text-sm font-black transition-all ${isVerified ? 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed' : 'bg-gray-50 border border-gray-100 focus:ring-4 focus:ring-blue-500/10 outline-none text-gray-900'}`}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSaving}
          className="w-full bg-[#2A74B1] text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'Synchronizing...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
};

export default ProfileView;
