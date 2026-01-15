
import React, { useMemo, useEffect, useState } from 'react';
import type { User, KycStatus, Currency } from '../types';
import { ALL_CURRENCIES, TO_CURRENCIES } from '../constants';
import { BatchRate } from '../services/conversionService';
import VerifiedBadgeIcon from './icons/VerifiedBadgeIcon';
import GlobeIcon from './icons/GlobeIcon';

interface WalletSummaryProps {
  user: User;
  marketRates: BatchRate[];
}

const WalletSummary: React.FC<WalletSummaryProps> = ({ user, marketRates }) => {
  const { wallet, kycStatus, profile, totalDepositedUsd, bonusPiAmount, lockedAssets } = user;
  const isVerified = kycStatus === 'verified';
  const isBonusUnlocked = isVerified && totalDepositedUsd >= 5;
  const [totalValue, setTotalValue] = useState<number>(0);
  const [showUnlockGuide, setShowUnlockGuide] = useState(false);

  const localCurrency = useMemo(() => {
    const region = profile?.region || 'Africa';
    switch (region) {
      case 'Europe': return TO_CURRENCIES.find(c => c.code === 'EUR') || TO_CURRENCIES[0];
      case 'Americas': return TO_CURRENCIES.find(c => c.code === 'USD') || TO_CURRENCIES[0];
      case 'Asia': return TO_CURRENCIES.find(c => c.code === 'USD') || TO_CURRENCIES[0];
      default: return TO_CURRENCIES.find(c => c.code === 'NGN') || TO_CURRENCIES[0];
    }
  }, [profile]);

  useEffect(() => {
    let aggregate = 0;
    ALL_CURRENCIES.forEach(curr => {
      const balance = wallet[curr.code] || 0;
      if (balance === 0) return;

      if (curr.code === localCurrency.code) {
        aggregate += balance;
      } else {
        const match = marketRates.find(r => r.from === curr.code && r.to === localCurrency.code);
        if (match) {
          aggregate += balance * match.rate;
        } else if (curr.code === 'USDT' && localCurrency.code === 'USD') {
          aggregate += balance;
        } else if (curr.code === 'NGN' && localCurrency.code === 'USD') {
          aggregate += balance / 1600;
        } else if (curr.code === 'USD' && localCurrency.code === 'NGN') {
          aggregate += balance * 1600;
        }
      }
    });
    setTotalValue(aggregate);
  }, [wallet, localCurrency, marketRates]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#020617] via-[#1e293b] to-[#020617] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Net Portfolio Value</h2>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter">
                  {localCurrency.symbol}{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-2.5 rounded-2xl">
              <GlobeIcon className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Region</p>
              <p className="text-[11px] font-bold text-white uppercase">{profile?.region || 'Global Hub'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Safety Index</p>
              <p className="text-[11px] font-bold text-white uppercase">99.2% SECURE</p>
            </div>
          </div>
        </div>
      </div>

      {lockedAssets.length > 0 && (
          <div className="bg-red-50 border border-red-100 p-5 rounded-[2rem] flex items-center gap-3 animate-pulse">
              <div className="bg-red-500 text-white p-2 rounded-xl">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
              </div>
              <div>
                  <p className="text-[10px] font-black text-red-900 uppercase tracking-widest leading-none mb-1">Account Restricted</p>
                  <p className="text-[9px] text-red-600 font-bold uppercase tracking-widest opacity-70">Some assets are frozen for security review.</p>
              </div>
          </div>
      )}

      {/* Asset Breakdown */}
      <div>
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Asset Breakdown</h3>
          {isVerified && (
            <div className="flex items-center gap-1 text-[8px] font-black text-green-500 uppercase tracking-widest bg-green-500/5 px-2 py-1 rounded-full border border-green-500/20">
              <VerifiedBadgeIcon className="w-3 h-3" />
              KYC Compliant
            </div>
          )}
        </div>
        
        <div className="flex space-x-3 overflow-x-auto pb-4 -mb-4 scrollbar-hide">
          {ALL_CURRENCIES.map(currency => {
            const balance = wallet[currency.code] || 0;
            const isRestricted = lockedAssets.includes(currency.code);
            const isLockedAsset = (currency.code === 'PI' && !isBonusUnlocked && balance >= bonusPiAmount) || isRestricted;
            
            return (
              <div 
                key={currency.code} 
                className="flex-shrink-0 w-36 bg-white border border-gray-100 rounded-[1.8rem] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-default relative overflow-hidden"
              >
                {isLockedAsset && (
                    <div className="absolute top-0 right-0 p-2">
                         <div className={`${isRestricted ? 'bg-orange-500' : 'bg-blue-500'} text-white p-1 rounded-md shadow-lg animate-pulse`} title={isRestricted ? "Frozen by Admin" : "Requirement Check"}>
                             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                             </svg>
                         </div>
                    </div>
                )}
                <div className="flex items-center mb-3">
                  <div className="scale-90 group-hover:scale-100 transition-transform duration-500">
                    {currency.icon}
                  </div>
                  <span className="ml-2.5 font-black text-gray-900 text-xs tracking-tight">{currency.code}</span>
                </div>
                <p className={`text-xl font-black text-gray-900 truncate tracking-tighter ${isLockedAsset ? 'opacity-40' : ''}`} title={balance.toString()}>
                  {balance.toLocaleString(undefined, { 
                    maximumFractionDigits: currency.isCrypto ? 6 : 2,
                    minimumFractionDigits: currency.isCrypto ? 0 : 2
                  })}
                </p>
                <div className="w-8 h-1 bg-gray-50 rounded-full mt-3 group-hover:w-full transition-all duration-700 bg-gradient-to-r from-blue-500 to-transparent opacity-20" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Risk Warning for Google Play Store Financial Policy */}
      <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100 border-dashed">
          <div className="flex items-start gap-3">
              <div className="bg-gray-200 p-1.5 rounded-lg text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
              </div>
              <p className="text-[9px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight">
                <span className="text-gray-900 font-black">Financial Disclosure:</span> Conversion of digital assets involves significant market risk. WoWCurrency is not a bank. Rates are dynamic based on live market liquidity. Always verify recipient details before authorizing high-speed settlement.
              </p>
          </div>
      </div>
    </div>
  );
};

export default WalletSummary;
