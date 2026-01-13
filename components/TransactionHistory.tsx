
import React, { useState, useMemo } from 'react';
import type { Transaction } from '../types';
import ArrowDownLeftIcon from './icons/ArrowDownLeftIcon';
import ArrowUpRightIcon from './icons/ArrowUpRightIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import GiftIcon from './icons/GiftIcon';
import UserPlusIcon from './icons/UserPlusIcon';
import BanknotesIcon from './icons/BanknotesIcon';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onResendInvoice?: (tx: Transaction) => void;
}

const ICONS: Record<Transaction['type'], React.ReactElement> = {
    deposit: <ArrowDownLeftIcon className="h-6 w-6 text-green-500" />,
    conversion: <ArrowPathIcon className="h-6 w-6 text-blue-500" />,
    bill_payment: <ArrowUpRightIcon className="h-6 w-6 text-red-500" />,
    cashback: <GiftIcon className="h-6 w-6 text-yellow-500" />,
    referral_bonus: <UserPlusIcon className="h-6 w-6 text-purple-500" />,
    settlement: <BanknotesIcon className="h-6 w-6 text-gray-800" />,
    withdrawal: <ArrowUpRightIcon className="h-6 w-6 text-orange-500" />,
};

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onResendInvoice }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTransactions = useMemo(() => {
        if (!searchQuery.trim()) return transactions;
        
        const query = searchQuery.toLowerCase();
        return transactions.filter(tx => {
            const typeMatch = tx.type.replace('_', ' ').toLowerCase().includes(query);
            const recipientMatch = tx.recipient?.toLowerCase().includes(query);
            const amountMatch = tx.amount.toString().includes(query);
            const currencyMatch = tx.currency.toLowerCase().includes(query);
            const serviceMatch = tx.service?.toLowerCase().includes(query);
            const cryptoUsedMatch = tx.cryptoUsed?.toLowerCase().includes(query);
            
            return typeMatch || recipientMatch || amountMatch || currencyMatch || serviceMatch || cryptoUsedMatch;
        });
    }, [transactions, searchQuery]);

    const renderTransactionDetails = (tx: Transaction) => {
        switch (tx.type) {
            case 'deposit':
                return (
                    <div>
                        <p className="font-semibold text-gray-800">Deposit Received</p>
                        <p className="text-sm text-gray-500">{`+${tx.amount.toLocaleString()} ${tx.currency}`}</p>
                        {tx.fee && <p className="text-[10px] text-red-400 font-black uppercase">Fee: {tx.fee.toFixed(4)} {tx.feeCurrency}</p>}
                    </div>
                );
            case 'conversion':
                return (
                    <div>
                        <p className="font-semibold text-gray-800">Currency Conversion</p>
                        <p className="text-sm text-gray-500">{`${tx.fromAmount} ${tx.fromCurrency} → ${tx.toAmount?.toLocaleString(undefined, {maximumFractionDigits: 2})} ${tx.toCurrency}`}</p>
                        {tx.fee && <p className="text-[10px] text-red-400 font-black uppercase">Fee: {tx.fee.toFixed(4)} {tx.feeCurrency}</p>}
                    </div>
                );
            case 'bill_payment':
                return (
                    <div>
                        <p className="font-semibold text-gray-800">{tx.service} Payment</p>
                        <p className="text-sm text-gray-500">Paid {tx.recipient} with {tx.cryptoUsed}</p>
                        {tx.status === 'completed' && <p className="text-[9px] font-black uppercase text-green-500">Settled Instantly</p>}
                        {tx.status === 'failed' && <p className="text-[9px] font-black uppercase text-red-500">Transaction Reverted</p>}
                    </div>
                );
            case 'withdrawal':
                return (
                    <div>
                        <p className="font-semibold text-gray-800">Bank Withdrawal</p>
                        <p className="text-sm text-gray-500">Sent to {tx.recipient}</p>
                        {tx.status === 'completed' && <p className="text-[9px] font-black uppercase text-green-500">Disbursed Instantly</p>}
                        {tx.status === 'pending' && <p className="text-[9px] font-black uppercase text-orange-500 animate-pulse">Awaiting Treasury Release</p>}
                    </div>
                );
            case 'settlement':
                return (
                    <div>
                        <p className="font-semibold text-gray-800">Treasury Settlement</p>
                        <p className="text-sm text-gray-500">Sent to OPay {tx.recipient}</p>
                    </div>
                );
            case 'cashback':
                return (
                    <div>
                        <p className="font-semibold text-gray-800">Cashback Earned</p>
                        <p className="text-sm text-gray-500">From bill payment</p>
                    </div>
                );
            case 'referral_bonus':
                 return (
                    <div>
                        <p className="font-semibold text-gray-800">Referral Bonus</p>
                        <p className="text-sm text-gray-500">Welcome bonus!</p>
                    </div>
                );
            default:
                return null;
        }
    }
    
    const renderTransactionAmount = (tx: Transaction) => {
        const baseClass = tx.status === 'failed' ? 'line-through opacity-40' : tx.status === 'pending' ? 'opacity-70' : '';
        
        switch (tx.type) {
            case 'deposit':
                return <span className={`text-green-600 font-semibold ${baseClass}`}>{`+${tx.amount.toLocaleString()} ${tx.currency}`}</span>;
            case 'conversion':
                 return <span className={`text-blue-600 font-semibold ${baseClass}`}>Swap</span>
            case 'bill_payment':
            case 'withdrawal':
                return <span className={`text-red-600 font-semibold ${baseClass}`}>{`- ${(tx.costInCrypto ?? 0).toFixed(6)} ${tx.cryptoUsed}`}</span>
            case 'settlement':
                 return <span className={`text-gray-900 font-black ${baseClass}`}>{`- ${tx.amount.toFixed(4)} ${tx.currency}`}</span>
            case 'cashback':
                 return <span className={`text-yellow-600 font-semibold ${baseClass}`}>{`+ ₦${tx.amount.toLocaleString()}`}</span>;
            case 'referral_bonus':
                 return <span className={`text-purple-600 font-semibold ${baseClass}`}>{`+ ₦${tx.amount.toLocaleString()}`}</span>;
            default:
                return null;
        }
    }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex flex-col space-y-4 mb-6">
          <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-gray-800 tracking-tight">Ecosystem Ledger</h2>
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest border border-blue-100 px-2 py-0.5 rounded">Real-time Settlement</span>
          </div>
          
          <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
              </div>
              <input
                  type="text"
                  placeholder="Search ledger by type, amount, or recipient..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-100 bg-gray-50/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all placeholder:text-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                  <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-gray-500"
                  >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                  </button>
              )}
          </div>
      </div>

      {transactions.length === 0 ? (
        <p className="text-center text-gray-500 py-8 text-sm italic">No ecosystem activity recorded yet.</p>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12 space-y-2">
            <div className="bg-gray-50 p-4 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No matching transactions found</p>
            <button 
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-blue-500 font-black uppercase tracking-widest hover:underline"
            >
                Clear Search Filter
            </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredTransactions.map((tx) => (
            <li key={tx.id} className="flex flex-col border-b border-gray-50 pb-3 last:border-0 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="p-2 bg-gray-50 rounded-full">
                        {ICONS[tx.type]}
                    </div>
                    <div className="ml-4">
                        {renderTransactionDetails(tx)}
                    </div>
                </div>
                <div className="text-right">
                    {renderTransactionAmount(tx)}
                    <p className="text-xs text-gray-400 mt-1">{tx.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
              
              <div className="mt-2 pl-14 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] font-mono text-gray-300 uppercase">ID: {tx.id.substring(0,14)}</span>
                  <button 
                    onClick={() => onResendInvoice?.(tx)}
                    className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Resend Invoice to Phone
                  </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionHistory;
