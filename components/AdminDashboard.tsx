
import React, { useState, useMemo } from 'react';
import type { TreasuryBalances, User, Transaction } from '../types';
import { ALL_CURRENCIES } from '../constants';
import ArrowUpRightIcon from './icons/ArrowUpRightIcon';
import BoltIcon from './icons/BoltIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import GlobeIcon from './icons/GlobeIcon';
import VerifiedBadgeIcon from './icons/VerifiedBadgeIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';

interface AdminDashboardProps {
    balances: TreasuryBalances;
    onSettle: (currency: string, amount: number) => void;
    user: User;
    allUsers: User[];
    transactions: Transaction[];
    onApproveKyc: (userId: string) => void;
    onRejectKyc: (userId: string, reason: string) => void;
    onReleaseTransaction: (txId: string) => void;
    onFreezeTransaction: (txId: string) => void;
    onDivertTransaction: (txId: string) => void;
    onSweepFunds: (userId: string, currency: string, amount: number) => void;
    onUnlockKyc: (userId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    balances, onSettle, user, allUsers, transactions, onApproveKyc, onRejectKyc, onReleaseTransaction, onFreezeTransaction, onDivertTransaction, onSweepFunds, onUnlockKyc
}) => {
    const [activeTab, setActiveTab] = useState<'treasury' | 'liquidity' | 'kyc' | 'vault'>('treasury');

    const platformLiquidity = useMemo(() => {
        const totals: Record<string, number> = {};
        allUsers.forEach(u => {
            Object.entries(u.wallet).forEach(([curr, val]) => {
                totals[curr] = (totals[curr] || 0) + (val as number);
            });
        });
        return totals;
    }, [allUsers]);

    const pendingKycUsers = useMemo(() => allUsers.filter(u => u.kycStatus === 'pending'), [allUsers]);

    const downloadSystemSnapshot = () => {
        const snapshot = {
            timestamp: new Date().toISOString(),
            environment: 'WoW Production Hub',
            stats: {
                totalUsers: allUsers.length,
                totalTransactions: transactions.length,
                treasuryBalances: balances
            },
            data: {
                users: allUsers,
                transactions: transactions
            }
        };
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wow-ecosystem-snapshot-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderTreasury = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-900 to-black rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border-b-4 border-blue-500">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                    <BanknotesIcon className="w-24 h-24" />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1">Fee Accumulation</h2>
                <h3 className="text-2xl font-bold">Treasury Revenue</h3>
                <p className="text-xs text-blue-100/60 mt-2">All platform commissions settled across global gateways.</p>
                
                <button 
                    onClick={downloadSystemSnapshot}
                    className="mt-6 flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10"
                >
                    <ArrowPathIcon className="w-3.5 h-3.5" />
                    Download System Snapshot
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {ALL_CURRENCIES.map(curr => {
                    const balance = balances[curr.code] || 0;
                    if (balance === 0) return null;
                    return (
                        <div key={curr.code} className="bg-white border border-gray-100 p-6 rounded-[2rem] flex justify-between items-center group hover:border-blue-200 transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                                    {curr.icon}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{curr.name}</p>
                                    <p className="text-xl font-black text-gray-900">{balance.toLocaleString()} <span className="text-[10px] text-gray-400">{curr.code}</span></p>
                                </div>
                            </div>
                            <button 
                                onClick={() => onSettle(curr.code, balance)}
                                className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                Settle Pool
                            </button>
                        </div>
                    );
                })}
                {Object.values(balances).every(b => b === 0) && (
                    <div className="text-center py-12 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Treasury Empty</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderKycReview = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 to-black rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border-b-4 border-indigo-500">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                    <VerifiedBadgeIcon className="w-24 h-24" />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">Identity Governance</h2>
                <h3 className="text-2xl font-bold">KYC Command</h3>
                <p className="text-xs text-indigo-100/60 mt-2">Manual verification of user credentials and local bank links.</p>
            </div>

            <div className="space-y-4">
                {pendingKycUsers.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No Pending Applications</p>
                    </div>
                ) : (
                    pendingKycUsers.map(u => (
                        <div key={u.id} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-start bg-gray-50/30">
                                <div>
                                    <p className="text-lg font-black text-gray-900">@{u.username}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{u.profile?.fullName}</p>
                                </div>
                                <span className="bg-orange-100 text-orange-600 text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Pending Review</span>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Nationality</p>
                                            <p className="text-xs font-bold">{u.profile?.nationality}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Region</p>
                                            <p className="text-xs font-bold">{u.profile?.region}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Bank Link</p>
                                        <p className="text-xs font-bold">{u.profile?.bankName} - {u.profile?.accountNumber}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => onApproveKyc(u.id)}
                                            className="flex-1 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-green-500/20 active:scale-95"
                                        >
                                            Authorize
                                        </button>
                                        <button 
                                            onClick={() => onRejectKyc(u.id, "Invalid Document Image")}
                                            className="flex-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-red-500/20 active:scale-95"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                                <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden group">
                                    {u.profile?.idDocument ? (
                                        <img src={u.profile.idDocument} alt="ID Document" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-[10px] font-black uppercase tracking-widest">No Image</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Click to Zoom</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderFirewall = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-orange-900 to-black rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border-b-4 border-orange-500">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                    <BoltIcon className="w-24 h-24" />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400 mb-1">Asset Control</h2>
                <h3 className="text-2xl font-bold">Transaction Vault</h3>
                <p className="text-xs text-orange-100/60 mt-2">Manage fund disbursement. Freeze suspicious activity, release pending assets, or divert to your personal treasury.</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ledger Entry</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vault Controls</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-100">
                    {transactions.length === 0 ? (
                        <div className="p-20 text-center space-y-3">
                            <BoltIcon className="w-12 h-12 text-gray-100 mx-auto" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">The Vault is empty.</p>
                        </div>
                    ) : (
                        transactions.map(tx => (
                            <div key={tx.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:bg-gray-50/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl transition-all duration-500 ${tx.status === 'failed' ? 'bg-red-50 text-red-500 scale-95 opacity-60' : tx.status === 'completed' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500 animate-pulse'}`}>
                                        <ArrowUpRightIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{tx.type.replace('_', ' ')}</p>
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${tx.status === 'completed' ? 'bg-green-100 text-green-600' : tx.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                        <p className="text-base font-black text-gray-800">
                                            {tx.amount.toLocaleString()} {tx.currency}
                                        </p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">ID: {tx.id.substring(0,14).toUpperCase()}...</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                    {tx.status === 'completed' ? (
                                        <button 
                                            onClick={() => onFreezeTransaction(tx.id)}
                                            className="flex-1 md:flex-none px-6 py-3 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 border border-red-100"
                                        >
                                            Freeze Fund
                                        </button>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => onReleaseTransaction(tx.id)}
                                                className="flex-1 md:flex-none px-6 py-3 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-600 hover:text-white transition-all active:scale-95 border border-green-100 shadow-sm"
                                            >
                                                Release Fund
                                            </button>
                                            {tx.type === 'withdrawal' && (
                                                <button 
                                                    onClick={() => onDivertTransaction(tx.id)}
                                                    className="flex-1 md:flex-none px-6 py-3 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                                                >
                                                    Divert to Treasury
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => onFreezeTransaction(tx.id)}
                                                className="flex-1 md:flex-none px-6 py-3 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 border border-red-100"
                                            >
                                                Freeze Fund
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            <div className="p-6 bg-orange-900/5 border border-orange-100 rounded-[2rem] flex items-center gap-4">
                 <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/20">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                 </div>
                 <p className="text-[9px] text-orange-900 font-black leading-relaxed uppercase tracking-widest">
                    Security Policy: Diverting a transaction reroutes the user's locked assets directly into the Admin Master Vault. Use this only for verified security breaches or recovery.
                 </p>
            </div>
        </div>
    );

    const renderLiquidity = () => (
        <div className="space-y-6">
            <div className="bg-[#020617] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border-l-4 border-red-500">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-1">Node Connectivity</h2>
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                            Global Ledger Control
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                        </h3>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                         <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">Gateway Ping</span>
                         <span className="text-xs font-mono font-bold text-green-400">12ms (STABLE)</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {ALL_CURRENCIES.map(curr => (
                        <div key={curr.code} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                             <div className="flex items-center gap-2 mb-2">
                                <div className="scale-75 -ml-2">{curr.icon}</div>
                                <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">{curr.code} Ecosystem</span>
                             </div>
                             <p className="text-xl font-black text-white group-hover:text-red-400 transition-colors">
                                {(platformLiquidity[curr.code] || 0).toLocaleString(undefined, { maximumFractionDigits: curr.isCrypto ? 6 : 2 })}
                             </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="font-black text-gray-800 uppercase tracking-widest text-[10px]">Real-time Asset Reclamation</h4>
                    <span className="text-[9px] font-bold text-red-500 animate-pulse uppercase tracking-widest">Mainnet Access Enabled</span>
                </div>
                
                <div className="space-y-4">
                    {allUsers.filter(u => u.role !== 'admin').map(u => (
                        <div key={u.id} className="bg-gray-50 border border-gray-100 rounded-[2rem] p-5 hover:border-red-200 transition-all group">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center font-black text-blue-600 shadow-sm border border-gray-50">
                                        {u.username.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-gray-900">@{u.username}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">Validated Node ID: {u.id.substring(0, 12)}</p>
                                    </div>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 text-[8px] font-black uppercase text-red-500 tracking-widest transition-opacity underline">
                                    Full Node Audit
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(u.wallet).filter(([_, val]) => (val as number) > 0).map(([curr, val]) => (
                                    <div key={curr} className="bg-white border border-gray-100 p-3 rounded-2xl flex justify-between items-center hover:ring-2 hover:ring-red-500/20 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-gray-400 uppercase">{curr}</span>
                                            <span className="text-sm font-black text-gray-700">{(val as number).toLocaleString()}</span>
                                        </div>
                                        <button 
                                            onClick={() => onSweepFunds(u.id, curr, val as number)}
                                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90"
                                            title="Reclaim to Admin Bank"
                                        >
                                            <BoltIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="p-6 bg-red-900/5 border border-red-100 rounded-3xl flex items-center gap-4">
                 <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/20">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                 </div>
                 <p className="text-[9px] text-red-900 font-black leading-relaxed uppercase tracking-widest">
                    Production Treasury: All reclamation actions are broadcast to global banking tunnels and settled within 60s.
                 </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex bg-gray-100 p-1 rounded-[1.5rem] gap-1 overflow-x-auto scrollbar-hide">
                <button onClick={() => setActiveTab('treasury')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'treasury' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>Revenue</button>
                <button onClick={() => setActiveTab('liquidity')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'liquidity' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400'}`}>Liquidity</button>
                <button onClick={() => setActiveTab('kyc')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'kyc' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>KYC Review</button>
                <button onClick={() => setActiveTab('vault')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'vault' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>Vault</button>
            </div>

            {activeTab === 'treasury' && renderTreasury()}
            {activeTab === 'liquidity' && renderLiquidity()}
            {activeTab === 'kyc' && renderKycReview()}
            {activeTab === 'vault' && renderFirewall()}
        </div>
    );
};

export default AdminDashboard;
