
import React, { useState, useEffect, useMemo } from 'react';
import type { User, Currency, Transaction } from '../types';
import { FROM_CURRENCIES, TO_CURRENCIES } from '../constants';
import { getExchangeRate } from '../services/conversionService';
import ArrowPathIcon from './icons/ArrowPathIcon';
import BoltIcon from './icons/BoltIcon';

const PLATFORM_FEE_RATE = 0.015;

interface SwapViewProps {
  user: User;
  onConvert: (fromCurr: string, fromAmt: number, toCurr: string, toAmt: number, fee: number) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => string;
  notify: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const SwapView: React.FC<SwapViewProps> = ({ user, onConvert, addTransaction, notify }) => {
  const [fromAsset, setFromAsset] = useState<Currency>(FROM_CURRENCIES[0]); 
  const [toAsset, setToAsset] = useState<Currency>(TO_CURRENCIES[0]); 
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getExchangeRate(fromAsset, toAsset)
      .then(r => setRate(r))
      .catch(() => setRate(0))
      .finally(() => setIsLoading(false));
  }, [fromAsset, toAsset]);

  const availableBalance = user.wallet[fromAsset.code] || 0;
  const isVerified = user.kycStatus === 'verified';
  const bonusLock = fromAsset.code === 'PI' && !isVerified ? user.bonusPiAmount : 0;
  const spendable = Math.max(0, availableBalance - bonusLock);

  const inputAmount = parseFloat(amount) || 0;
  const estimatedOutput = rate ? inputAmount * rate : 0;
  const fee = inputAmount * PLATFORM_FEE_RATE;
  const totalDeduction = inputAmount + fee;

  const handleMax = () => {
    const maxBase = spendable / (1 + PLATFORM_FEE_RATE);
    setAmount(maxBase.toFixed(6));
  };

  const handleSwapAssets = () => {
    const currentFrom = fromAsset;
    const currentTo = toAsset;
    const newFrom = [...FROM_CURRENCIES, ...TO_CURRENCIES].find(c => c.code === currentTo.code);
    const newTo = [...FROM_CURRENCIES, ...TO_CURRENCIES].find(c => c.code === currentFrom.code);
    if (newFrom) setFromAsset(newFrom);
    if (newTo) setToAsset(newTo);
  };

  const handleExecuteSwap = async () => {
    if (totalDeduction > spendable) {
      notify("Limit Exceeded", `Insufficient spendable ${fromAsset.code}.`, "error");
      return;
    }

    setIsSwapping(true);
    await new Promise(r => setTimeout(r, 2500));

    const finalOutput = estimatedOutput;
    const feeInFrom = fee;

    onConvert(fromAsset.code, inputAmount, toAsset.code, finalOutput, feeInFrom);
    
    addTransaction({
      type: 'conversion',
      status: 'completed',
      amount: inputAmount,
      currency: fromAsset.code,
      fromAmount: inputAmount,
      fromCurrency: fromAsset.code,
      toAmount: finalOutput,
      toCurrency: toAsset.code,
      fee: feeInFrom,
      feeCurrency: fromAsset.code
    });

    notify("Settlement Reached", `Bridge confirmed. ${finalOutput.toLocaleString()} ${toAsset.code} credited.`, "success");
    setIsSwapping(false);
    setAmount('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white border border-gray-100 rounded-[3rem] p-8 md:p-10 shadow-2xl space-y-8 relative overflow-hidden ring-1 ring-gray-900/5">
        <div className="flex justify-between items-center px-2">
            <div className="space-y-1">
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] leading-none">Bridge Terminal</h3>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Propagating through global nodes</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-ping" />
                <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Liquidity: 100%</span>
            </div>
        </div>

        {/* FROM SECTION */}
        <div className="bg-gray-50/80 p-8 rounded-[2.5rem] border border-gray-100 space-y-4 group transition-all hover:bg-white hover:shadow-xl hover:shadow-blue-500/5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Asset Exit</span>
            <div className="flex gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase">Bal:</span>
                <span className="text-[10px] font-bold text-gray-600 tracking-tight">{availableBalance.toLocaleString()} {fromAsset.code}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-5xl font-black text-gray-900 outline-none placeholder-gray-100 tracking-tighter"
            />
            <div className="flex flex-col items-end gap-3">
               <div className="flex items-center gap-3 bg-white p-3 px-5 rounded-[1.5rem] shadow-xl border border-gray-50 transition-all group-hover:ring-4 group-hover:ring-blue-500/10">
                  <div className="scale-110">{fromAsset.icon}</div>
                  <span className="text-base font-black text-gray-800 tracking-tight">{fromAsset.code}</span>
               </div>
               <button onClick={handleMax} className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] hover:text-blue-600 underline-offset-4 decoration-blue-500/30">Set Max Depth</button>
            </div>
          </div>
          {bonusLock > 0 && (
             <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 p-2 px-3 rounded-xl animate-in slide-in-from-left duration-500">
                <BoltIcon className="w-3 h-3 text-orange-500" />
                <p className="text-[8px] font-bold text-orange-600 uppercase tracking-widest">
                  {bonusLock} {fromAsset.code} locked for security check
                </p>
             </div>
          )}
        </div>

        {/* SWAP ICON - Institutional aesthetics */}
        <div className="absolute left-1/2 top-[46.5%] -translate-x-1/2 -translate-y-1/2 z-10">
          <button 
            onClick={handleSwapAssets}
            className="p-4 bg-white rounded-[1.8rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 text-[#2A74B1] hover:text-white hover:bg-[#2A74B1] transition-all hover:rotate-180 duration-700 active:scale-90 ring-8 ring-white"
          >
            <ArrowPathIcon className="w-7 h-7" />
          </button>
        </div>

        {/* TO SECTION */}
        <div className="bg-gray-50/80 p-8 rounded-[2.5rem] border border-gray-100 space-y-4 group transition-all hover:bg-white hover:shadow-xl hover:shadow-orange-500/5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Asset Entry (Quote)</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex-1 text-5xl font-black text-gray-300 tracking-tighter truncate group-hover:text-gray-400 transition-colors">
              {isLoading ? '...' : estimatedOutput.toLocaleString(undefined, { maximumFractionDigits: toAsset.isCrypto ? 6 : 2 })}
            </div>
            <div className="flex items-center gap-3 bg-white p-3 px-5 rounded-[1.5rem] shadow-xl border border-gray-50 transition-all group-hover:ring-4 group-hover:ring-orange-500/10">
              <div className="scale-110">{toAsset.icon}</div>
              <span className="text-base font-black text-gray-800 tracking-tight">{toAsset.code}</span>
            </div>
          </div>
        </div>

        {/* INSTITUTIONAL SETTLEMENT QUOTE */}
        <div className="bg-[#020617] rounded-[2.8rem] p-8 text-white shadow-2xl relative overflow-hidden border-t-4 border-blue-500 group">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-125 transition-transform duration-[2s]">
             <BoltIcon className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-5">
             <div className="flex justify-between items-end border-b border-white/5 pb-5">
                <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mb-1 block">Indicative Rate</span>
                    <span className="text-lg font-black tracking-tight">1 {fromAsset.code} = {isLoading ? 'SYNCING...' : `${rate?.toLocaleString()} ${toAsset.code}`}</span>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mb-1 block">Network Fee</span>
                    <span className="text-xs font-bold text-blue-400">-{fee.toFixed(6)} {fromAsset.code}</span>
                </div>
             </div>
             
             <div className="flex justify-between items-center pt-2">
                <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Net Settlement</span>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Guaranteed for 60s</p>
                </div>
                <div className="text-right">
                    <span className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                        {estimatedOutput.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        <span className="text-sm font-black text-blue-500 ml-2">{toAsset.code}</span>
                    </span>
                </div>
             </div>
          </div>
        </div>

        <button 
          onClick={handleExecuteSwap}
          disabled={isSwapping || isLoading || !amount || totalDeduction > spendable}
          className="w-full bg-[#2A74B1] text-white py-7 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-xs shadow-[0_25px_60px_rgba(42,116,177,0.4)] hover:bg-[#1e5a8d] transition-all active:scale-[0.98] disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none relative overflow-hidden flex items-center justify-center gap-4 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-shimmer" />
          {isSwapping ? (
            <>
               <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
               <span className="animate-pulse">Broadcasting to Nodes...</span>
            </>
          ) : (
            <span>Execute Conversion Protocol</span>
          )}
        </button>
      </div>

      {/* PAIR SELECTOR HUB */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-7 rounded-[2.8rem] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-500/5">
           <div className="flex justify-between items-center mb-6 px-1">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Source Inventory</h4>
                <span className="text-[8px] font-bold text-blue-400 bg-blue-50 px-2 py-0.5 rounded-md uppercase">Vetted</span>
           </div>
           <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {[...FROM_CURRENCIES, ...TO_CURRENCIES].filter(c => c.code !== toAsset.code).map(c => (
                 <button 
                  key={c.code}
                  onClick={() => setFromAsset(c)}
                  className={`flex flex-col items-center gap-3 p-5 rounded-[1.8rem] border transition-all min-w-[95px] relative overflow-hidden group ${fromAsset.code === c.code ? 'bg-[#020617] border-blue-500 shadow-xl' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'}`}
                 >
                    <div className={`transition-transform duration-500 group-hover:scale-110 ${fromAsset.code === c.code ? 'brightness-125' : ''}`}>{c.icon}</div>
                    <span className={`text-[11px] font-black uppercase tracking-tighter ${fromAsset.code === c.code ? 'text-white' : 'text-gray-800'}`}>{c.code}</span>
                    {fromAsset.code === c.code && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500" />}
                 </button>
              ))}
           </div>
        </div>
        <div className="bg-white p-7 rounded-[2.8rem] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:shadow-orange-500/5">
           <div className="flex justify-between items-center mb-6 px-1">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Destination Sink</h4>
                <span className="text-[8px] font-bold text-orange-400 bg-orange-50 px-2 py-0.5 rounded-md uppercase">Verified</span>
           </div>
           <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {[...TO_CURRENCIES, ...FROM_CURRENCIES].filter(c => c.code !== fromAsset.code).map(c => (
                 <button 
                  key={c.code}
                  onClick={() => setToAsset(c)}
                  className={`flex flex-col items-center gap-3 p-5 rounded-[1.8rem] border transition-all min-w-[95px] relative overflow-hidden group ${toAsset.code === c.code ? 'bg-[#020617] border-orange-500 shadow-xl' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'}`}
                 >
                    <div className={`transition-transform duration-500 group-hover:scale-110 ${toAsset.code === c.code ? 'brightness-125' : ''}`}>{c.icon}</div>
                    <span className={`text-[11px] font-black uppercase tracking-tighter ${toAsset.code === c.code ? 'text-white' : 'text-gray-800'}`}>{c.code}</span>
                    {toAsset.code === c.code && <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500" />}
                 </button>
              ))}
           </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .group-hover\\:animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}} />
    </div>
  );
};

export default SwapView;
