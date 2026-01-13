
import React, { useState, useEffect, useMemo } from 'react';
import type { User, Transaction, Currency } from '../types';
import { ALL_CURRENCIES, TO_CURRENCIES } from '../constants';
import { getExchangeRate } from '../services/conversionService';
import BanknotesIcon from './icons/BanknotesIcon';
import BoltIcon from './icons/BoltIcon';
import VerifiedBadgeIcon from './icons/VerifiedBadgeIcon';
import GlobeIcon from './icons/GlobeIcon';
import ArrowUpRightIcon from './icons/ArrowUpRightIcon';

const PLATFORM_FEE_RATE = 0.015;

interface WithdrawViewProps {
  user: User;
  handlePayment: (currencyCode: string, netAmount: number, feeAmount: number) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  notify: (title: string, message: string, type?: any) => void;
  dispatchSms: (message: string) => void;
}

const WithdrawView: React.FC<WithdrawViewProps> = ({ user, handlePayment, addTransaction, notify, dispatchSms }) => {
  const isVerified = user.kycStatus === 'verified';
  const kycProfile = user.profile;
  
  const [amount, setAmount] = useState('10');
  const [selectedAsset, setSelectedAsset] = useState<Currency>(ALL_CURRENCIES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [settlementStep, setSettlementStep] = useState<number>(0);
  const [rate, setRate] = useState<number | null>(null);

  const targetFiat = useMemo(() => {
    const region = kycProfile?.region || 'Africa';
    switch (region) {
      case 'Europe': return TO_CURRENCIES.find(c => c.code === 'EUR') || TO_CURRENCIES[2];
      case 'Americas': return TO_CURRENCIES.find(c => c.code === 'USD') || TO_CURRENCIES[1];
      case 'Asia': return TO_CURRENCIES.find(c => c.code === 'USD') || TO_CURRENCIES[1];
      default: return TO_CURRENCIES.find(c => c.code === 'NGN') || TO_CURRENCIES[0];
    }
  }, [kycProfile]);

  useEffect(() => {
    if (selectedAsset.code === targetFiat.code) {
        setRate(1);
    } else {
        setIsLoading(true);
        getExchangeRate(selectedAsset, targetFiat)
            .then(setRate)
            .catch(() => setRate(0))
            .finally(() => setIsLoading(false));
    }
  }, [selectedAsset, targetFiat]);

  const availableBalance = useMemo(() => {
    return user.wallet[selectedAsset.code] || 0;
  }, [user.wallet, selectedAsset]);

  const inputAmount = parseFloat(amount) || 0;
  const fiatEquivalent = rate ? inputAmount * rate : 0;
  const feeFiat = fiatEquivalent * PLATFORM_FEE_RATE;
  const netFiat = fiatEquivalent - feeFiat;

  const handleMax = () => {
    setAmount(availableBalance.toString());
  };

  const handleWithdraw = async () => {
    if (!isVerified || !kycProfile || inputAmount <= 0) return;
    
    if (availableBalance < inputAmount) {
        notify("Insufficient Funds", `You do not have enough ${selectedAsset.code} in your vault.`, "error");
        return;
    }

    setIsLoading(true);
    
    const steps = [
      "Broadcasting Liquidation Request...",
      `Exchanging ${selectedAsset.code} for ${targetFiat.code}...`,
      "Verifying KYC Bank Signature...",
      "Queuing for Admin Authorization...", // Updated step label
      "Waiting for WoW Treasury release..."  // Updated final step
    ];

    for (let i = 0; i < steps.length; i++) {
      setSettlementStep(i);
      await new Promise(r => setTimeout(r, 1000));
    }

    // Still deduct payment immediately to "lock" the funds
    handlePayment(selectedAsset.code, inputAmount * (1 - PLATFORM_FEE_RATE), inputAmount * PLATFORM_FEE_RATE);
    
    const txId = addTransaction({
      type: 'withdrawal',
      status: 'pending', // FORCE PENDING STATUS
      amount: netFiat,
      currency: targetFiat.code,
      recipient: `${kycProfile.bankName} (${kycProfile.accountNumber})`,
      costInCrypto: inputAmount,
      cryptoUsed: selectedAsset.code,
      service: 'Verified Local Bank Payout'
    });

    notify("Request Received", `Your withdrawal of ${targetFiat.symbol}${netFiat.toLocaleString()} is pending admin approval.`, "info");
    dispatchSms(`WoW PENDING [${txId.substring(0,8).toUpperCase()}]: Withdrawal request of ₦${netFiat.toLocaleString()} received. Funds are locked in the vault awaiting admin verification.`);
    setIsLoading(false);
    setAmount('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-7 shadow-sm ring-1 ring-gray-900/5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
               <BanknotesIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Verified Payout Bank</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">KYC Provisioned Destination</p>
            </div>
          </div>
          {isVerified ? (
             <VerifiedBadgeIcon className="w-6 h-6 text-green-500" />
          ) : (
             <div className="h-2 w-2 bg-gray-300 rounded-full animate-pulse" />
          )}
        </div>

        {isVerified && kycProfile ? (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-100 p-5 rounded-3xl relative">
              <div className="absolute top-4 right-4">
                <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-widest">Primary</span>
              </div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Settlement Bank</p>
              <p className="text-lg font-black text-gray-900">{kycProfile.bankName}</p>
              <div className="mt-3 pt-3 border-t border-gray-200/60 flex justify-between items-end">
                <div>
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Account Number</p>
                   <p className="text-sm font-mono font-bold text-gray-700 tracking-wider">•••• {kycProfile.accountNumber.slice(-4)}</p>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Holder</p>
                   <p className="text-sm font-bold text-gray-900 uppercase">{kycProfile.fullName}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center border border-dashed border-gray-300 rounded-[2rem] bg-gray-50 space-y-3">
             <VerifiedBadgeIcon className="w-10 h-10 text-gray-200 mx-auto" />
             <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Verification Required</p>
                <p className="text-[10px] text-gray-400 font-medium">Complete KYC to link your local bank account for withdrawals.</p>
             </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-7 shadow-sm space-y-6">
        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liquidate Asset</label>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Vault Bal:</span>
                    <span className="text-[10px] font-bold text-gray-600">
                        {availableBalance.toLocaleString(undefined, { maximumFractionDigits: selectedAsset.isCrypto ? 6 : 2 })} {selectedAsset.code}
                    </span>
                </div>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                     <div className="flex-1">
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full text-3xl font-black text-gray-900 bg-transparent outline-none placeholder-gray-200"
                            placeholder="0.00"
                        />
                     </div>
                     <button 
                        onClick={handleMax}
                        className="px-3 py-1.5 bg-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                    >
                        Max
                    </button>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {ALL_CURRENCIES.filter(c => user.wallet[c.code] > 0 || c.isCrypto).map(c => (
                        <button 
                            key={c.code}
                            onClick={() => setSelectedAsset(c)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${selectedAsset.code === c.code ? 'bg-white border-blue-500 shadow-sm' : 'bg-transparent border-transparent opacity-50 hover:opacity-100'}`}
                        >
                            <div className="scale-75">{c.icon}</div>
                            <span className="text-xs font-black text-gray-800">{c.code}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
        
        <div className="bg-gray-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
             <ArrowUpRightIcon className="w-20 h-20" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Gross Value ({targetFiat.code})</span>
              <span className="text-sm font-bold">{targetFiat.symbol}{fiatEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">WOW Fee (1.5%)</span>
              <span className="text-sm font-bold text-red-400">-{targetFiat.symbol}{feeFiat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-black uppercase tracking-widest text-blue-400">Local Bank Payout</span>
              <span className="text-2xl font-black text-green-400">{targetFiat.symbol}{netFiat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-6 space-y-5">
            <div className="flex items-center justify-center gap-3">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] animate-pulse">
                {rate === null ? "Analyzing Market Tunnels..." : [
                  "Broadcasting Liquidation Request...",
                  `Exchanging ${selectedAsset.code} for ${targetFiat.code}...`,
                  "Verifying KYC Bank Signature...",
                  "Queuing for Admin Authorization...",
                  "Waiting for WoW Treasury release..."
                ][settlementStep]}
              </p>
              <div className="w-32 h-1 bg-gray-100 rounded-full mx-auto overflow-hidden mt-3">
                 <div 
                    className="h-full bg-blue-600 transition-all duration-500 ease-out" 
                    style={{ width: `${(settlementStep + 1) * 20}%` }}
                 />
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={handleWithdraw}
            disabled={!isVerified || inputAmount <= 0}
            className="w-full bg-[#2A74B1] text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-blue-500/30 hover:bg-[#1e5a8d] transition-all active:scale-[0.98] disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
          >
            {isVerified ? `Queue Withdrawal to Bank` : 'Complete KYC to Withdraw'}
          </button>
        )}
      </div>
    </div>
  );
};

export default WithdrawView;
