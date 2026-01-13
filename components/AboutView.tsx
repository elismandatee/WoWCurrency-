
import React from 'react';
import Logo from './Logo';
import BoltIcon from './icons/BoltIcon';
import GlobeIcon from './icons/GlobeIcon';
import VerifiedBadgeIcon from './icons/VerifiedBadgeIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';

const AboutView: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8">
      <div className="flex flex-col items-center text-center space-y-4 py-4">
        <Logo className="h-16" showText={false} />
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">The WoW Ecosystem</h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Global Crypto-Fiat Bridge</p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="bg-gradient-to-br from-[#2A74B1] to-[#1e5a8d] p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <GlobeIcon className="w-20 h-20" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight mb-2">Our Mission</h3>
          <p className="text-sm font-medium leading-relaxed opacity-90">
            WoWCurrency was founded to bridge the gap between emerging decentralized assets like Pi Network and real-world liquidity. We provide a secure, instant pathway to convert your digital holdings into Naira (NGN), US Dollars (USD), and more.
          </p>
        </div>

        {/* Installation Section */}
        <div className="bg-blue-600 p-7 rounded-[2.5rem] text-white shadow-2xl ring-1 ring-white/20">
           <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Download Mobile App
           </h3>
           <div className="space-y-4">
              <div className="flex items-start gap-3">
                 <div className="bg-white/20 p-2 rounded-lg text-xs font-black">01</div>
                 <p className="text-xs font-bold leading-tight pt-1">Open this site in Safari (iOS) or Chrome (Android).</p>
              </div>
              <div className="flex items-start gap-3">
                 <div className="bg-white/20 p-2 rounded-lg text-xs font-black">02</div>
                 <p className="text-xs font-bold leading-tight pt-1">Tap the "Share" or "Menu" icon and select "Add to Home Screen".</p>
              </div>
              <div className="flex items-start gap-3">
                 <div className="bg-white/20 p-2 rounded-lg text-xs font-black">03</div>
                 <p className="text-xs font-bold leading-tight pt-1">Launch WoWCurrency from your home screen just like a native app.</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 p-5 rounded-[2rem] shadow-sm">
            <div className="bg-orange-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <BoltIcon className="w-6 h-6 text-[#F58220]" />
            </div>
            <h4 className="font-black text-gray-800 text-xs uppercase tracking-widest mb-2">Instant Settlement</h4>
            <p className="text-[11px] text-gray-500 leading-normal font-medium">
              Proprietary liquidity bridges ensure your conversions are settled in minutes, not days.
            </p>
          </div>

          <div className="bg-white border border-gray-100 p-5 rounded-[2rem] shadow-sm">
            <div className="bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <VerifiedBadgeIcon className="w-6 h-6 text-[#2A74B1]" />
            </div>
            <h4 className="font-black text-gray-800 text-xs uppercase tracking-widest mb-2">The Vault</h4>
            <p className="text-[11px] text-gray-500 leading-normal font-medium">
              Every external transaction is manual-verified via our Security Vault to prevent fraud.
            </p>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-[2.5rem] text-white shadow-xl">
          <h3 className="text-xs font-black text-green-400 uppercase tracking-widest mb-4">Core Ecosystem Components</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5" />
              <div>
                <p className="text-xs font-black uppercase">WoW Bridge</p>
                <p className="text-[10px] text-gray-400">Deep liquidity pools for PI, BTC, and ETH.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5" />
              <div>
                <p className="text-xs font-black uppercase">Global Virtual Accounts</p>
                <p className="text-[10px] text-gray-400">Localized bank provisioning across 4 continents.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5" />
              <div>
                <p className="text-xs font-black uppercase">Owner-Governed</p>
                <p className="text-[10px] text-gray-400">Directly overseen by Ogbonna Elijah Elem (WoW Treasury).</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <p className="text-center text-[9px] text-gray-400 font-black uppercase tracking-widest pb-4">
        v2.4.0 Secure Release • WoWCurrency Global Ltd.
      </p>
    </div>
  );
};

export default AboutView;
