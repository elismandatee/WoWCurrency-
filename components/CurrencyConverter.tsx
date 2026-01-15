
import React, { useState, useEffect, useMemo } from 'react';
import { FROM_CURRENCIES, TO_CURRENCIES, FUNDING_SOURCES, DEPOSITABLE_CURRENCIES, ALL_CURRENCIES } from '../constants';
import { convertCurrency, BatchRate } from '../services/conversionService';
import type { Currency, FundingSource, User, Transaction, TreasuryBalances, Region, TransferRequest } from '../types';
import BillsView from './BillsView';
import WalletSummary from './WalletSummary';
import RewardsView from './RewardsView';
import AdminDashboard from './AdminDashboard';
import AboutView from './AboutView';
import SupportView from './SupportView';
import SecurityView from './SecurityView';
import ProfileView from './ProfileView';
import WithdrawView from './WithdrawView';
import TransferView from './TransferView';
import PrivacyPolicyView from './PrivacyPolicyView';
import BanknotesIcon from './icons/BanknotesIcon';
import GlobeIcon from './icons/GlobeIcon';
// Fix: Import missing VerifiedBadgeIcon for the Privacy Policy button
import VerifiedBadgeIcon from './icons/VerifiedBadgeIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import BoltIcon from './icons/BoltIcon';
import ArrowUpRightIcon from './icons/ArrowUpRightIcon';
import GiftIcon from './icons/GiftIcon';

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
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Deposit Amount ({currency})</label>
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
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Card Number</label>
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
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Expiry Date</label>
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
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">CVV</label>
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
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Cardholder Name</label>
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
                    {copiedField === 'wallet' ? <CheckCircleIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button onClick={() => handleDeposit(targetCurrency.code, 100)} className="w-full py-5 text-[11px] font-black text-blue-600 uppercase bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all active:scale-95 shadow-lg shadow-blue-500/5">
                Simulate Successful Receipt
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
           <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
              {(['Africa', 'Europe', 'Americas'] as Region[]).map(reg => (
                <button 
                    key={reg} 
                    onClick={() => setActiveRegion(reg)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeRegion === reg ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                    {reg}
                </button>
              ))}
           </div>

           {isGenerating ? (
              <div className="flex flex-col items-center py-12 bg-white rounded-[2rem] border border-gray-100">
                <div className="h-16 w-16 rounded-full border-[5px] border-blue-50 border-t-blue-500 animate-spin" />
                <p className="mt-6 text-gray-400 font-black uppercase tracking-widest text-[10px]">Provisioning Global Ledger...</p>
              </div>
           ) : activeVirtualAccount ? (
             <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm space-y-4">
                <div className="text-center mb-6">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">Global Payout Node</p>
                    <h3 className="text-xl font-black text-gray-900">{activeVirtualAccount.bankName}</h3>
                </div>
                <div className="space-y-1">
                    {renderDetailItem('Account Name', activeVirtualAccount.accountName)}
                    {renderDetailItem('Account Number', activeVirtualAccount.accountNumber)}
                    {activeVirtualAccount.routingInfo && renderDetailItem('Routing/SWIFT', activeVirtualAccount.routingInfo)}
                </div>
                <div className="pt-4">
                    <button onClick={() => handleDeposit(targetCurrency.code, 5000)} className="w-full py-5 text-[11px] font-black text-green-600 uppercase bg-green-50 rounded-2xl border border-green-100 hover:bg-green-100 transition-all active:scale-95 shadow-lg shadow-green-500/5">
                       Simulate Bank Credit
                    </button>
                </div>
             </div>
           ) : (
             <div className="p-12 bg-white border border-gray-100 rounded-[2.5rem] text-center space-y-4">
                <VerifiedBadgeIcon className="w-12 h-12 text-gray-200 mx-auto" />
                <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Bank Node Not Active</p>
                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-1">Complete KYC verification to provision your global virtual accounts.</p>
                </div>
             </div>
           )}
        </div>
      )}

      <SelectorModal 
        isOpen={isSourceModalOpen} onClose={() => setIsSourceModalOpen(false)}
        items={FUNDING_SOURCES} title="Select Source"
        onSelectItem={setSelectedSource}
        renderItem={(s) => (
            <>
                <div className="bg-gray-100 p-2 rounded-xl group-hover:bg-white transition-colors">{s.icon}</div>
                <div className="ml-4">
                    <p className="text-sm font-black text-gray-900 leading-none mb-1">{s.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.description}</p>
                </div>
            </>
        )}
      />

      <SelectorModal 
        isOpen={isCurrencyModalOpen} onClose={() => setIsCurrencyModalOpen(false)}
        items={DEPOSITABLE_CURRENCIES} title="Select Destination"
        onSelectItem={setTargetCurrency}
        renderItem={(c) => (
            <>
                <div className="bg-gray-100 p-2 rounded-xl group-hover:bg-white transition-colors">{c.icon}</div>
                <div className="ml-4">
                    <p className="text-sm font-black text-gray-900 leading-none mb-1">{c.code} Wallet</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{c.name}</p>
                </div>
            </>
        )}
      />
    </div>
  );
};

// --- MAIN COMPONENT ---

interface CurrencyConverterProps {
  user: User;
  allUsers: User[];
  marketRates: BatchRate[];
  treasuryBalances: TreasuryBalances;
  transactions: Transaction[];
  transferRequests: TransferRequest[];
  onOpenKyc: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => string;
  handleDeposit: (currency: string, amount: number) => void;
  handlePayment: (currency: string, netAmount: number, feeAmount: number) => void;
  handleCompleteConversion: (fromCurr: string, fromAmt: number, toCurr: string, toAmt: number, fee: number) => void;
  handleCashback: (amount: number) => void;
  handleReferral: () => void;
  handleSettlement: (currency: string, amount: number) => void;
  handleDirectTransfer: (toUserId: string, amount: number, currency: string, note?: string) => void;
  handleCreateTransferRequest: (toUserId: string, amount: number, currency: string, note?: string) => void;
  handleAcceptTransferRequest: (requestId: string) => void;
  handleDeclineTransferRequest: (requestId: string) => void;
  onApproveKyc: (userId: string) => Promise<void>;
  onRejectKyc: (userId: string, reason: string) => void;
  onReleaseTransaction: (txId: string) => void;
  onFreezeTransaction: (txId: string) => void;
  onDivertTransaction: (txId: string) => void;
  onSweepFunds: (userId: string, currency: string, amount: number) => void;
  onUnfreezeAsset: (userId: string, currency: string) => void;
  onUnlockKyc: (userId: string) => void;
  onUpdateUser: (updatedUser: User) => void;
  notify: (title: string, message: string, type?: any) => void;
  dispatchSms: (message: string) => void;
}

/**
 * CurrencyConverter component serves as the main hub of the application,
 * managing the different functional views via a tab-based navigation system.
 */
const CurrencyConverter: React.FC<CurrencyConverterProps> = (props) => {
  const [activeTab, setActiveTab] = useState('wallet');
  
  const tabs = [
    { id: 'wallet', label: 'Wallet', icon: <BanknotesIcon className="w-4 h-4" /> },
    { id: 'deposit', label: 'Deposit', icon: <ArrowPathIcon className="w-4 h-4" /> },
    { id: 'bills', label: 'Bills', icon: <BoltIcon className="w-4 h-4" /> },
    { id: 'withdraw', label: 'Withdraw', icon: <GlobeIcon className="w-4 h-4" /> },
    { id: 'transfer', label: 'Transfer', icon: <ArrowUpRightIcon className="w-4 h-4" /> },
    { id: 'rewards', label: 'Rewards', icon: <GiftIcon className="w-4 h-4" /> },
  ];

  if (props.user.role === 'admin') {
    tabs.push({ id: 'admin', label: 'Admin', icon: <VerifiedBadgeIcon className="w-4 h-4" /> });
  }

  const settingsTabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'about', label: 'About' },
    { id: 'support', label: 'Support' },
    { id: 'privacy', label: 'Privacy' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto scrollbar-hide gap-2 p-1 bg-gray-100 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-100 min-h-[400px]">
        {activeTab === 'wallet' && <WalletSummary user={props.user} marketRates={props.marketRates} />}
        {activeTab === 'deposit' && <DepositView user={props.user} handleDeposit={props.handleDeposit} />}
        {activeTab === 'bills' && (
          <BillsView 
            user={props.user} 
            handlePayment={props.handlePayment} 
            addTransaction={props.addTransaction} 
            handleCashback={props.handleCashback} 
            notify={props.notify} 
            dispatchSms={props.dispatchSms} 
          />
        )}
        {activeTab === 'withdraw' && (
          <WithdrawView 
            user={props.user} 
            handlePayment={props.handlePayment} 
            addTransaction={props.addTransaction} 
            notify={props.notify} 
            dispatchSms={props.dispatchSms} 
          />
        )}
        {activeTab === 'transfer' && (
          <TransferView 
            user={props.user} 
            allUsers={props.allUsers} 
            transferRequests={props.transferRequests} 
            onSend={props.handleDirectTransfer} 
            onRequest={props.handleCreateTransferRequest} 
            onAcceptRequest={props.handleAcceptTransferRequest} 
            onDeclineRequest={props.handleDeclineTransferRequest} 
          />
        )}
        {activeTab === 'rewards' && <RewardsView user={props.user} handleReferral={props.handleReferral} />}
        {activeTab === 'admin' && (
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
        {activeTab === 'profile' && <ProfileView user={props.user} onUpdateUser={props.onUpdateUser} notify={props.notify} />}
        {activeTab === 'security' && <SecurityView user={props.user} onUpdateUser={props.onUpdateUser} notify={props.notify} />}
        {activeTab === 'about' && <AboutView />}
        {activeTab === 'support' && <SupportView />}
        {activeTab === 'privacy' && <PrivacyPolicyView />}
      </div>

      {/* Footer Settings Navigation */}
      <div className="flex flex-wrap justify-center gap-4 pt-4">
        {settingsTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id ? 'text-blue-500 underline underline-offset-4' : 'text-gray-300 hover:text-gray-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CurrencyConverter;
