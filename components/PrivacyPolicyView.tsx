
import React from 'react';
import Logo from './Logo';
import VerifiedBadgeIcon from './icons/VerifiedBadgeIcon';

const PrivacyPolicyView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <Logo className="w-48 h-48" showText={false} />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Official Compliance Doc v3.1</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Privacy & Data Policy</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Last Modified: February 21, 2025</p>
        </div>
      </div>

      <div className="space-y-8 px-2">
        <section className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-tight text-gray-800 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-lg flex items-center justify-center text-[10px]">01</span>
            Data Collection & Financial KYC
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            To provide our global conversion services, WoWCurrency collects personally identifiable information including your full legal name, date of birth, and government-issued identification documents. This data is strictly used for <span className="text-gray-900 font-bold">Know Your Customer (KYC)</span> and Anti-Money Laundering (AML) compliance as required by international financial regulations.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-tight text-gray-800 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-lg flex items-center justify-center text-[10px]">02</span>
            Account & Data Deletion
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            In compliance with Google Play Developer Policy, users may request the full deletion of their account and all associated personal data. To initiate this process, navigate to your <span className="text-gray-900 font-bold">Security Settings</span> or email <span className="text-blue-600 font-bold">elismandate1@gmail.com</span>. Please note that certain transaction logs must be retained for up to 5 years for regulatory audit purposes.
          </p>
        </section>

        <div className="bg-gray-900 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute bottom-0 right-0 p-4 opacity-10">
             <VerifiedBadgeIcon className="w-20 h-20" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-3">Financial Transparency</h3>
          <p className="text-[13px] font-medium leading-relaxed opacity-90">
            WoWCurrency is a currency conversion platform, not a high-yield investment scheme. We charge a flat <span className="text-blue-400 font-bold">1.5% commission</span> on all conversions. Our settlement and local payout protocol is officially powered by <span className="text-green-400 font-bold">OPay Digital Services Limited</span> to ensure legal fund movement and regulatory compliance.
          </p>
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-tight text-gray-800 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-lg flex items-center justify-center text-[10px]">03</span>
            Biometric Authorization
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            Your fingerprint and biometric data never leave your device. WoWCurrency utilizes standard system-level APIs (FaceID/TouchID) to verify your identity. We only store a secure cryptographic token representing your authorization locally on your device.
          </p>
        </section>

        <section className="space-y-4 border-t border-gray-100 pt-6">
          <h3 className="text-sm font-black uppercase tracking-tight text-gray-800">Developer Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Company</p>
                <p className="text-xs font-bold text-gray-800">WoWCurrency Global Hub Ltd.</p>
             </div>
             <div className="bg-gray-50 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Support Email</p>
                <p className="text-xs font-bold text-gray-800">elismandate1@gmail.com</p>
             </div>
          </div>
        </section>
      </div>

      <div className="pt-6 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Verified Safe for Google Play Distribution</p>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-xs font-black text-blue-500 uppercase tracking-widest hover:underline"
        >
          Return to Top
        </button>
      </div>
    </div>
  );
};

export default PrivacyPolicyView;
