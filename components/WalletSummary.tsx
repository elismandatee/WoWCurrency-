
import React, { useMemo, useEffect, useState } from 'react';
import type { User, KycStatus, Currency } from '../types';
import { ALL_CURRENCIES, TO_CURRENCIES } from '../constants';
import { BatchRate } from '../services/conversionService';
import VerifiedBadgeIcon from './icons/VerifiedBadgeIcon';
import GlobeIcon from './icons/GlobeIcon';
import MarketChart from './MarketChart';

interface WalletSummaryProps {
  user: User;
  marketRates: BatchRate[];
}

const WalletSummary: React.FC<WalletSummaryProps> = ({ user, marketRates }) => {
  const { wallet, kycStatus, profile, totalDepositedUsd, bonusPiAmount, lockedAssets } = user;
  const isVerified = kycStatus === 'verified';
  const isBonusUnlocked = isVerified && totalDepositedUsd >= 5;
  const [totalValue, setTotalValue] = useState<number>(0);

  // Mock data for charts
  const piChartData = [51.2, 52.4, 50.8, 53.5, 55.2, 54.1, 56.4];
  const btcChartData = [94000, 95500, 96200, 95800, 97000, 96500, 98200];

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
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Total Portfolio Balance</h2>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-extrabold tracking-tighter">
                  {localCurrency.symbol}{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">+2.4%</span>
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-2.5 rounded-2xl">
              <GlobeIcon className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Node Location</p>
              <p className="text-[11px] font-bold text-white uppercase">{profile?.region || 'Global Gateway'}</p>
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Trust Score</p>
              <p className="text-[11px] font-bold text-blue-400 uppercase">AA+ SECURED</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between group overflow-hidden relative">
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-2">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pi Price Trend</p>
                   <p className="text-xl font-black text-gray-900">$54.10 <span className="text-[10px] text-green-500">+12%</span></p>
                </div>
                <div className="bg-orange-50 p-2 rounded-xl text-orange-500">
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                </div>
             </div>
          </div>
          <div className="mt-4 -mx-6 -mb-6 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
             <MarketChart data={piChartData} color="#F58220" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between group overflow-hidden relative">
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-2">
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">BTC Market Signal</p>
                   <p className="text-xl font-black text-gray-900">$96.5k <span className="text-[10px] text-red-500">-0.4%</span></p>
                </div>
                <div className="bg-blue-50 p-2 rounded-xl text-blue-500">
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
             </div>
          </div>
          <div className="mt-4 -mx-6 -mb-6 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
             <MarketChart data={btcChartData} color="#2A74B1" />
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Asset Allocation</h3>
          {isVerified && (
            <div className="flex items-center gap-1 text-[8px] font-black text-green-500 uppercase tracking-widest bg-green-500/5 px-2 py-1 rounded-full border border-green-500/20 shadow-sm">
              <VerifiedBadgeIcon className="w-3 h-3" />
              Mainnet Ready
            </div>
          )}
        </div>
        
        <div className="flex space-x-4 overflow-x-auto pb-4 -mb-4 scrollbar-hide">
          {ALL_CURRENCIES.map(currency => {
            const balance = wallet[currency.code] || 0;
            const isRestricted = lockedAssets.includes(currency.code);
            const isLockedAsset = (currency.code === 'PI' && !isBonusUnlocked && balance >= bonusPiAmount) || isRestricted;
            
            return (
              <div 
                key={currency.code} 
                className="flex-shrink-0 w-44 bg-white border border-gray-100 rounded-[2.2rem] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-default relative overflow-hidden border-b-4 border-b-transparent hover:border-b-blue-500"
              >
                {isLockedAsset && (
                    <div className="absolute top-0 right-0 p-2">
                         <div className={`${isRestricted ? 'bg-orange-500' : 'bg-blue-500'} text-white p-1 rounded-md shadow-lg animate-pulse`} title={isRestricted ? "Security Freeze" : "KYC Requirement"}>
                             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                             </svg>
                         </div>
                    </div>
                )}
                <div className="flex items-center mb-4">
                  <div className="scale-90 group-hover:scale-110 transition-transform duration-500 bg-slate-50 p-2 rounded-xl group-hover:bg-blue-50">
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
                
                {currency.code === 'PI' && balance > 0 && !isLockedAsset && (
                    <button className="mt-4 w-full py-2 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                        Quick Bridge to NGN
                    </button>
                )}
                
                <div className="w-6 h-0.5 bg-gray-100 rounded-full mt-3 group-hover:w-full transition-all duration-700 bg-gradient-to-r from-blue-500 to-transparent" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
             <svg className="w-16 h-16 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
          </div>
          <div className="flex items-start gap-4">
              <div className="bg-blue-500/10 p-2 rounded-xl text-blue-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
              </div>
              <div className="space-y-1">
                 <p className="text-[11px] font-black text-white uppercase tracking-widest">Ecosystem Transparency</p>
                 <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                   WoWCurrency operates on real-time market liquidity bridges. Conversion rates for Pi Network are based on live IOU settlements. Commission is fixed at 1.5%. Performance monitored via BOM 34.8.0 protocols.
                 </p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default WalletSummary;
