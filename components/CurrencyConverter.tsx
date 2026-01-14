
import React, { useState, useEffect, useMemo } from 'react';
import { FROM_CURRENCIES, TO_CURRENCIES, FUNDING_SOURCES, DEPOSITABLE_CURRENCIES } from '../constants';
import { convertCurrency, BatchRate } from '../services/conversionService';
import type { Currency, FundingSource, User, Transaction, TreasuryBalances, Region } from '../types';
import BillsView from './BillsView';
import WalletSummary from './WalletSummary';
import RewardsView from './RewardsView';
import AdminDashboard from './AdminDashboard';
import AboutView from './AboutView';
import SupportView from './SupportView';
import SecurityView from './SecurityView';
import ProfileView from './ProfileView';
import WithdrawView from './WithdrawView';
import BanknotesIcon from './icons/BanknotesIcon';
import GlobeIcon from './icons/GlobeIcon';

// --- ICONS ---
const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
  </svg>
);

const QrCodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 014.5 3.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zM3.75 15A.75.75 0 014.5 14.25h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zM15 3.75A.75.75 0 0014.25 3h-4.5a.75.75 0 00-.75.75v4.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-4.5zM19.5 19.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75v4.5a.75.75 0 00.75.75h4.5z" />
  </svg>
);

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.74-5.24z" clipRule="evenodd" />
  </svg>
);

const PLATFORM_FEE_RATE = 0.015;

// --- COMPONENTS ---

interface SelectorModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  items: T[];
  onSelectItem: (item: T) => void;
  title: string;
  renderItem: (item: T) => React.ReactNode;
}

function SelectorModal<T>({ isOpen, onClose, items, onSelectItem, title, renderItem }: SelectorModalProps<T>) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[210] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 bg-white rounded-full border border-gray-100">&times;</button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto divide-y divide-gray-50">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center p-4 hover:bg-blue-50 cursor-pointer transition-colors group" onClick={() => { onSelectItem(item); onClose(); }}>
              {renderItem(item)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const CardPaymentForm: React.FC<{ 
  onSuccess: (amount: number) => void, 
  currency: string 
}> = ({ onSuccess, currency }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [amount, setAmount] = useState('50.00');

  const formattedCardNumber = cardNumber.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
  
  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess(parseFloat(amount));
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="relative h-44 w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 text-white shadow-2xl overflow-hidden border border-white/10 group">
        <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-opacity">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
        </div>
        <div className="flex justify-between items-start mb-8">
            <div className="h-8 w-12 bg-yellow-400/80 rounded-lg shadow-inner flex items-center justify-center overflow-hidden">
                <div className="w-full h-px bg-yellow-600/30 -rotate-45"></div>
                <div className="w-full h-px bg-yellow-600/30 rotate-45"></div>
            </div>
            <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block">Stripe Gateway</span>
                <span className="font-bold text-xs italic">Secure Protocol</span>
            </div>
        </div>
        <div className="space-y-4">
            <p className="font-mono text-xl tracking-[0.2em] font-bold">
                {formattedCardNumber || '•••• •••• •••• ••••'}
            </p>
            <div className="flex justify-between items-end">
                <div>
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block mb-1">Card Holder</span>
                    <span className="font-bold text-xs uppercase tracking-tight">{name || 'Your Full Name'}</span>
                </div>
                <div className="text-right">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block mb-1">Expires</span>
                    <span className="font-bold text-xs">{expiry || 'MM/YY'}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
        <div className="flex-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Deposit Amount ({currency})</label>
          <div className="relative">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white border border-gray-200 p-4 rounded-2xl text-2xl font-black text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Card Number</label>
            <input 
              type="text" 
              maxLength={19}
              placeholder="0000 0000 0000 0000"
              value={formattedCardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
              className="w-full bg-white border border-gray-200 p-4 rounded-2xl font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Expiry Date</label>
              <input 
                type="text" 
                placeholder="MM/YY"
                maxLength={5}
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full bg-white border border-gray-200 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">CVV</label>
              <input 
                type="password" 
                placeholder="•••"
                maxLength={3}
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                className="w-full bg-white border border-gray-200 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Cardholder Name</label>
            <input 
              type="text" 
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-gray-300 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            />
          </div>
        </div>

        <button 
          onClick={handlePay}
          disabled={isProcessing}
          className="w-full bg-[#6772E5] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-[#5469d4] transition-all relative overflow-hidden group disabled:bg-gray-400"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-3">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Processing Payment...</span>
            </div>
          ) : (
            <span>Securely Authorize {currency}{amount}</span>
          )}
        </button>

        <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-widest">
            PCI DSS Compliant • Instant Authorization
        </p>
      </div>
    </div>
  );
};

const DepositView: React.FC<{ user: User, handleDeposit: (c: string, a: number) => void }> = ({ user, handleDeposit }) => {
  const [selectedSource, setSelectedSource] = useState<FundingSource>(FUNDING_SOURCES[0]);
  const [targetCurrency, setTargetCurrency] = useState<Currency>(DEPOSITABLE_CURRENCIES.find(c => c.code === selectedSource.creditsCurrency) || DEPOSITABLE_CURRENCIES[0]);
  
  const [activeRegion, setActiveRegion] = useState<Region>('Africa');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const isCardPayment = selectedSource.id === 'visa_mastercard';

  useEffect(() => {
    if (selectedSource.networks && selectedSource.networks.length > 0) {
      setSelectedNetwork(selectedSource.networks[0]);
    } else {
      setSelectedNetwork(selectedSource.network || '');
    }
    const match = DEPOSITABLE_CURRENCIES.find(c => c.code === selectedSource.creditsCurrency);
    if (match) setTargetCurrency(match);
  }, [selectedSource]);

  const activeVirtualAccount = useMemo(() => {
      return user.profile?.virtualAccounts?.find(acc => acc.region === activeRegion);
  }, [user.profile, activeRegion]);

  const walletAddress = useMemo(() => {
    const netPart = selectedNetwork ? selectedNetwork.toLowerCase().replace(/[^a-z0-9]/g, '') : 'main';
    const sourcePart = selectedSource.creditsCurrency.toLowerCase();
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    if (sourcePart === 'btc') return `bc1q${randomPart.toLowerCase()}rsqtzq2n0yrf2493p83kkfjhx0wlh`;
    if (sourcePart === 'eth' || sourcePart === 'usdt' || sourcePart === 'bnb') return `0x${randomPart.toLowerCase()}5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b`;
    if (sourcePart === 'pi') return `pi_3QJ${randomPart}R7n9mK2v6zC8jF4p`;
    
    return `WOW-${sourcePart}-${netPart}-${randomPart}`;
  }, [selectedSource, selectedNetwork]);

  useEffect(() => {
    if (!isCardPayment) {
        setIsGenerating(true);
        const timer = setTimeout(() => setIsGenerating(false), 800); 
        return () => clearTimeout(timer);
    }
  }, [selectedSource, activeRegion, targetCurrency, isCardPayment, selectedNetwork]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderDetailItem = (label: string, value: string) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 group transition-all">
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1.5">{label}</span>
        <span className="font-mono text-sm font-black text-gray-900 tracking-tight">{value}</span>
      </div>
      <button 
        onClick={() => handleCopy(value, label)} 
        className={`p-2 rounded-xl transition-all ${copiedField === label ? 'text-blue-600 bg-blue-50' : 'text-gray-300 hover:text-blue-500 hover:bg-blue-50'}`}
      >
        {copiedField === label ? <CheckCircleIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-gray-50 p-4 rounded-[2rem] border border-gray-100 shadow-sm">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-1">Source Asset</label>
          <button onClick={() => setIsSourceModalOpen(true)} className="w-full flex items-center justify-between bg-white border border-gray-200 p-4 rounded-2xl hover:border-blue-500 transition-all group">
            <div className="flex items-center">
              <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-blue-50 transition-colors">
                {selectedSource.icon}
              </div>
              <div className="ml-3 text-left">
                <span className="block font-black text-gray-800 text-sm leading-none">{selectedSource.name}</span>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>

        <div className="flex-1 bg-gray-50 p-4 rounded-[2rem] border border-gray-100 shadow-sm">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-1">Destination Wallet</label>
          <button onClick={() => setIsCurrencyModalOpen(true)} className="w-full flex items-center justify-between bg-white border border-gray-200 p-4 rounded-2xl hover:border-[#F58220] transition-all group">
            <div className="flex items-center">
              <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-orange-50 transition-colors">
                {targetCurrency.icon}
              </div>
              <div className="ml-3 text-left">
                <span className="block font-black text-gray-800 text-sm leading-none">{targetCurrency.code} Wallet</span>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      </div>

      {isCardPayment ? (
        <CardPaymentForm 
            currency={selectedSource.creditsCurrency === 'USD' ? '$' : '₦'} 
            onSuccess={(amount) => handleDeposit(targetCurrency.code, amount)} 
        />
      ) : selectedSource.isCrypto ? (
        <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm text-center space-y-6 relative overflow-hidden ring-1 ring-gray-900/5">
           <div className="absolute top-0 right-0 p-4">
              <span className="bg-blue-50 text-blue-600 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-blue-100">{selectedNetwork || selectedSource.network || 'Mainnet'}</span>
           </div>
          {isGenerating ? (
            <div className="flex flex-col items-center py-12">
              <div className="h-20 w-20 rounded-full border-[6px] border-blue-50 border-t-blue-500 animate-spin shadow-lg" />
              <p className="mt-8 text-gray-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Syncing with WoW Bridge...</p>
            </div>
          ) : (
            <>
              <div className="inline-block p-8 bg-gray-50 rounded-[3rem] border border-gray-100 shadow-inner group">
                <QrCodeIcon className="w-48 h-48 text-gray-900 mx-auto transition-transform group-hover:scale-105 duration-500" />
              </div>
              <div className="space-y-4">
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em]">Send {selectedSource.creditsCurrency} to Secure Bridge:</p>
                <div className="flex items-center gap-2 bg-gray-900 p-5 rounded-[1.5rem] border border-white/10 shadow-2xl">
                  <span className="text-xs font-mono font-bold text-white break-all text-left flex-1 opacity-90">{walletAddress}</span>
                  <button onClick={() => handleCopy(walletAddress, 'wallet')} className="text-blue-400 p-2.5 hover:bg-white/10 rounded-xl transition-all">
                    {copiedField === 'wallet' ? <CheckCircleIcon className="w-6 h-6" /> : <CopyIcon className="w-6 h-6" />}
                  </button>
                </div>
              </div>
              <button onClick={() => handleDeposit(targetCurrency.code, 100)} className="w-full py-5 text-[11px] font-black text-blue-600 hover:bg-blue-50 transition-all uppercase tracking-widest border-t border-gray-50 mt-4 rounded-b-[2.5rem]">
                Broadcast Transaction to Ledger
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm space-y-6 ring-1 ring-gray-900/5">
          <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                  <h3 className="font-black text-gray-900 uppercase tracking-tighter text-xl">Global Bank Tunnel</h3>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Cross-Border High-Speed Settlement</span>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-green-700 font-black uppercase tracking-widest">Active Bridge</span>
              </div>
          </div>

          <div className="flex gap-2 p-1.5 bg-gray-50 rounded-[1.5rem] border border-gray-100 overflow-x-auto scrollbar-hide">
            {(['Africa', 'Europe', 'Americas', 'Asia'] as const).map(region => (
              <button 
                key={region} 
                onClick={() => setActiveRegion(region)} 
                className={`flex-1 min-w-[90px] px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeRegion === region ? 'bg-white text-[#2A74B1] shadow-xl shadow-blue-500/10 ring-1 ring-gray-900/5 scale-100' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
              >
                {region}
              </button>
            ))}
          </div>

          {isGenerating ? (
              <div className="bg-gray-50 rounded-[2rem] p-16 text-center border border-gray-100">
                  <div className="h-12 w-12 border-4 border-blue-50 border-t-blue-500 rounded-full animate-spin mx-auto shadow-sm" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-8 animate-pulse">Establishing Regional Tunnel...</p>
              </div>
          ) : activeVirtualAccount ? (
            <div className="bg-white border-2 border-gray-900 p-7 rounded-[2rem] space-y-1 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                   <GlobeIcon className="w-32 h-32" />
                </div>
                {renderDetailItem('Bank Provider', activeVirtualAccount.bankName)}
                {renderDetailItem('Account Beneficiary', activeVirtualAccount.accountName)}
                {renderDetailItem('Account ID', activeVirtualAccount.accountNumber)}
                {renderDetailItem('Global Protocol', activeVirtualAccount.routingInfo || 'RTGS Priority')}
                
                <button onClick={() => handleDeposit(targetCurrency.code, 1000)} className="w-full py-5 text-[11px] font-black text-blue-600 hover:bg-blue-50 transition-all uppercase tracking-widest mt-6 border-t border-gray-100">
                  Verify Global Inbound Payment
                </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-[2.5rem] p-16 text-center border-2 border-dashed border-gray-200">
                <div className="bg-white w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                   <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest leading-relaxed">Identity Check Required <br/> <span className="text-[10px] font-bold opacity-60">Verify KYC to access global bridges</span></p>
            </div>
          )}
          
          <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl flex items-start gap-4">
              <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="text-[10px] text-blue-900 font-bold leading-relaxed uppercase tracking-tight">
                 Real payments sent to these credentials are automatically routed through our high-liquidity tunnels and settled to your WoW Wallet within 2-15 minutes.
              </p>
          </div>
        </div>
      )}

      <SelectorModal<FundingSource>
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        items={FUNDING_SOURCES}
        onSelectItem={setSelectedSource}
        title="Payment Asset"
        renderItem={(source) => (
            <>
                <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 group-hover:border-blue-200 transition-all">{source.icon}</div>
                <div className="ml-4">
                    <p className="font-black text-gray-900 text-base">{source.name}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{source.description}</p>
                </div>
            </>
        )}
      />

      <SelectorModal<Currency>
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        items={DEPOSITABLE_CURRENCIES}
        onSelectItem={setTargetCurrency}
        title="Credit Wallet"
        renderItem={(currency) => (
            <>
                <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 group-hover:border-orange-200 transition-all">{currency.icon}</div>
                <div className="ml-4">
                    <p className="font-black text-gray-900 text-base">{currency.code}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{currency.name}</p>
                </div>
            </>
        )}
      />
    </div>
  );
};

const ConvertView: React.FC<{ user: User, marketRates: BatchRate[], onOpenKyc: () => void, addTransaction: any, handleCompleteConversion: any, notify: any, dispatchSms: any }> = ({ user, marketRates, onOpenKyc, addTransaction, handleCompleteConversion, notify, dispatchSms }) => {
  const [amount, setAmount] = useState('10');
  const [fromCurrency, setFromCurrency] = useState(FROM_CURRENCIES[0]);
  const [toCurrency, setToCurrency] = useState(TO_CURRENCIES[0]);
  const [isFromModalOpen, setFromModalOpen] = useState(false);
  const [isToModalOpen, setToModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isBonusUnlocked = user.kycStatus === 'verified' && user.totalDepositedUsd >= 5;
  const isFromAssetLocked = user.lockedAssets.includes(fromCurrency.code);
  
  const spendableBalance = useMemo(() => {
      if (isFromAssetLocked) return 0;
      const bal = user.wallet[fromCurrency.code] || 0;
      if (fromCurrency.code === 'PI' && !isBonusUnlocked) {
          return Math.max(0, bal - user.bonusPiAmount);
      }
      return bal;
  }, [user.wallet, fromCurrency, isBonusUnlocked, user.bonusPiAmount, isFromAssetLocked]);

  const feeAmount = useMemo(() => {
      const val = parseFloat(amount);
      return isNaN(val) ? 0 : val * PLATFORM_FEE_RATE;
  }, [amount]);
  
  const netAmount = useMemo(() => {
      const val = parseFloat(amount);
      return isNaN(val) ? 0 : val - feeAmount;
  }, [amount, feeAmount]);

  const currentRate = useMemo(() => {
    if (fromCurrency.code === toCurrency.code) return 1;
    return marketRates.find(r => r.from === fromCurrency.code && r.to === toCurrency.code)?.rate || null;
  }, [fromCurrency, toCurrency, marketRates]);

  const estimatedOutput = useMemo(() => {
    if (!currentRate) return null;
    return netAmount * currentRate;
  }, [netAmount, currentRate]);

  const handleMax = () => {
      setAmount(spendableBalance.toString());
  };

  const handleConvert = async () => {
    if (isFromAssetLocked) {
        notify("Asset Restricted", `Your ${fromCurrency.code} wallet is frozen. Contact support.`, "error");
        return;
    }
    const inputAmount = parseFloat(amount);
    if (isNaN(inputAmount) || inputAmount <= 0 || !currentRate) return;
    
    if (inputAmount > spendableBalance) {
        if (fromCurrency.code === 'PI' && !isBonusUnlocked && (user.wallet['PI'] || 0) >= inputAmount) {
            notify("Bonus Locked", "Verify KYC and deposit at least $5 to unlock your welcome PI bonus.", "warning");
        } else {
            notify("Insufficient Funds", `You need more ${fromCurrency.code} to complete this swap.`, "error");
        }
        return;
    }

    setIsLoading(true);
    try {
        const result = await convertCurrency(netAmount, fromCurrency, toCurrency);
        
        // Atomically update state wallets immediately without admin
        handleCompleteConversion(
            fromCurrency.code, 
            netAmount, 
            toCurrency.code, 
            result.convertedAmount, 
            feeAmount
        );

        const txId = addTransaction({
            type: 'conversion',
            status: 'completed',
            amount: result.convertedAmount,
            currency: toCurrency.code,
            fromAmount: inputAmount,
            fromCurrency: fromCurrency.code,
            toAmount: result.convertedAmount,
            toCurrency: toCurrency.code,
            fee: feeAmount,
            feeCurrency: fromCurrency.code,
            userId: user.id
        });
        
        notify("Swap Completed", `Instantly converted ${inputAmount} ${fromCurrency.code} to ${result.convertedAmount.toFixed(2)} ${toCurrency.code}. Wallet synced.`);
        dispatchSms(`WoW CONVERSION [${txId.substring(0,8).toUpperCase()}]: Successfully swapped ${inputAmount} ${fromCurrency.code} for ${result.convertedAmount.toFixed(2)} ${toCurrency.code}. Fee: ${feeAmount.toFixed(4)} ${fromCurrency.code}. Assets settled instantly.`);
    } catch (e) {
        notify("Conversion Failed", "Network busy. Please try again later.", "error");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 ${isFromAssetLocked ? 'opacity-70 grayscale' : ''}`}>
        <div className="flex justify-between items-center mb-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
            Swap Amount
            {isFromAssetLocked && <span className="text-orange-600 bg-orange-50 px-1 rounded">FROZEN</span>}
          </label>
          <div className="flex items-center gap-2">
             <span className="text-[10px] text-gray-400 font-bold">Spendable: {spendableBalance.toFixed(4)}</span>
             {!isFromAssetLocked && <button onClick={handleMax} className="text-[8px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-0.5 rounded">Max</button>}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <input 
            type="number" 
            value={amount} 
            disabled={isFromAssetLocked}
            onChange={(e) => setAmount(e.target.value)} 
            className="text-3xl font-black bg-transparent focus:outline-none w-full text-gray-900 placeholder-gray-100" 
            placeholder="0.00"
          />
          <button onClick={() => setFromModalOpen(true)} className="flex items-center bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
            <div className="scale-75">{fromCurrency.icon}</div>
            <span className="ml-2 font-black text-gray-800">{fromCurrency.code}</span>
          </button>
        </div>
        <div className="mt-3 flex justify-between items-center px-1">
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Wow Fee (1.5%)</span>
             <span className="text-[10px] font-bold text-orange-500">-{feeAmount.toFixed(4)} {fromCurrency.code}</span>
        </div>
      </div>

      <div className="flex justify-center -my-6 z-10 relative">
        <div className="bg-[#2A74B1] p-2.5 rounded-2xl shadow-lg ring-4 ring-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
        </div>
      </div>

      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Net Recipient</label>
            {currentRate && (
                <span className="text-[9px] font-black text-[#F58220] uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md">
                    1 {fromCurrency.code} ≈ {currentRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} {toCurrency.code}
                </span>
            )}
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-3xl font-black text-[#2A74B1]">
            {estimatedOutput !== null 
              ? estimatedOutput.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
              : '--.--'}
          </div>
          <button onClick={() => setToModalOpen(true)} className="flex items-center bg-gray-50 px-3 py-2 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
            <div className="scale-75">{toCurrency.icon}</div>
            <span className="ml-2 font-black text-gray-800">{toCurrency.code}</span>
          </button>
        </div>
      </div>

      <button 
        onClick={handleConvert} 
        className={`w-full text-white font-black py-5 rounded-3xl transition-all shadow-xl active:scale-[0.98] uppercase tracking-widest text-sm relative ${isFromAssetLocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#2A74B1] hover:bg-[#1e5a8d]'}`}
        disabled={isLoading || isFromAssetLocked}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Real-time Blockchain Syncing...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span>{isFromAssetLocked ? 'Conversion Restricted' : 'Execute Universal Conversion'}</span>
            <span className="text-[8px] opacity-60 tracking-[0.3em] font-medium">Instant Asset Settlement Enabled</span>
          </div>
        )}
      </button>

      <SelectorModal<Currency>
        isOpen={isFromModalOpen}
        onClose={() => setFromModalOpen(false)}
        items={FROM_CURRENCIES}
        onSelectItem={setFromCurrency}
        title="Swap From"
        renderItem={(currency) => (
            <>
                <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 group-hover:border-blue-200 transition-all">
                    {currency.icon}
                </div>
                <div className="ml-4">
                    <p className="font-black text-gray-800 text-base">{currency.code}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                      {currency.name}
                      {user.lockedAssets.includes(currency.code) && <span className="ml-2 text-orange-600">(FROZEN)</span>}
                    </p>
                </div>
            </>
        )}
      />

      <SelectorModal<Currency>
        isOpen={isToModalOpen}
        onClose={() => setToModalOpen(false)}
        items={TO_CURRENCIES}
        onSelectItem={setToCurrency}
        title="Swap To"
        renderItem={(currency) => (
            <>
                <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 group-hover:border-blue-200 transition-all">
                    {currency.icon}
                </div>
                <div className="ml-4">
                    <p className="font-black text-gray-800 text-base">{currency.code}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{currency.name}</p>
                </div>
            </>
        )}
      />
    </div>
  );
};

const CurrencyConverter: React.FC<{ 
  user: User, 
  allUsers: User[],
  marketRates: BatchRate[],
  treasuryBalances: TreasuryBalances,
  transactions: Transaction[],
  onOpenKyc: () => void, 
  addTransaction: any, 
  handleDeposit: any, 
  handlePayment: any, 
  handleCompleteConversion: (fromCurr: string, fromAmt: number, toCurr: string, toAmt: number, fee: number) => void,
  handleCashback: any, 
  handleReferral: any, 
  handleSettlement: any,
  onApproveKyc: (userId: string) => void,
  onRejectKyc: (userId: string, reason: string) => void,
  onReleaseTransaction: (txId: string) => void,
  onFreezeTransaction: (txId: string) => void,
  onDivertTransaction: (txId: string) => void,
  onSweepFunds: (userId: string, currency: string, amount: number) => void,
  onUnfreezeAsset: (userId: string, currency: string) => void,
  onUnlockKyc: (userId: string) => void,
  onUpdateUser: (user: User) => void,
  notify: any,
  dispatchSms: any
}> = (props) => {
  const [activeTab, setActiveTab] = useState<'convert' | 'deposit' | 'withdraw' | 'bills' | 'rewards' | 'profile' | 'security' | 'support' | 'about' | 'admin'>('convert');

  const availableTabs = useMemo(() => {
    const baseTabs = ['convert', 'deposit', 'bills', 'rewards', 'profile', 'security', 'support', 'about'];
    if (props.user.kycStatus === 'verified') {
        baseTabs.splice(2, 0, 'withdraw');
    }
    if (props.user.role === 'admin') {
      baseTabs.push('admin');
    }
    return baseTabs as Array<typeof activeTab>;
  }, [props.user.role, props.user.kycStatus]);

  useEffect(() => {
      if (!availableTabs.includes(activeTab)) {
          setActiveTab('convert');
      }
  }, [availableTabs, activeTab]);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 ring-1 ring-gray-900/5">
      <div className="flex p-2 bg-gray-50/50 border-b border-gray-100 overflow-x-auto scrollbar-hide">
        {availableTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[75px] px-2 py-3.5 text-[10px] font-black uppercase tracking-tighter transition-all rounded-2xl animate-in fade-in duration-500 ${activeTab === tab ? 'bg-white text-[#2A74B1] shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab === 'bills' ? 'Pay' : tab === 'security' ? 'Privacy' : tab}
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8">
        <WalletSummary user={props.user} marketRates={props.marketRates} />
        
        <div className="mt-8">
          {activeTab === 'convert' && <ConvertView {...props} />}
          {activeTab === 'deposit' && <DepositView user={props.user} handleDeposit={props.handleDeposit} />}
          {activeTab === 'withdraw' && <WithdrawView user={props.user} handlePayment={props.handlePayment} addTransaction={props.addTransaction} notify={props.notify} dispatchSms={props.dispatchSms} />}
          {activeTab === 'bills' && <BillsView user={props.user} handlePayment={props.handlePayment} addTransaction={props.addTransaction} handleCashback={props.handleCashback} notify={props.notify} dispatchSms={props.dispatchSms} />}
          {activeTab === 'rewards' && <RewardsView user={props.user} handleReferral={props.handleReferral} />}
          {activeTab === 'profile' && <ProfileView user={props.user} onUpdateUser={props.onUpdateUser} notify={props.notify} />}
          {activeTab === 'security' && <SecurityView user={props.user} onUpdateUser={props.onUpdateUser} notify={props.notify} />}
          {activeTab === 'support' && <SupportView />}
          {activeTab === 'about' && <AboutView />}
          {activeTab === 'admin' && props.user.role === 'admin' && (
              <AdminDashboard 
                balances={props.treasuryBalances} 
                onSettle={props.handleSettlement} 
                user={props.user} 
                allUsers={props.allUsers}
                transactions={props.transactions}
                onApproveKyc={props.onApproveKyc} 
                onRejectKyc={props.onRejectKyc}
                onReleaseTransaction={props.onReleaseTransaction}
                onFreezeTransaction={props.onFreezeTransaction}
                onDivertTransaction={props.onDivertTransaction}
                onSweepFunds={props.onSweepFunds}
                onUnfreezeAsset={props.onUnfreezeAsset}
                onUnlockKyc={props.onUnlockKyc}
              />
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrencyConverter;
