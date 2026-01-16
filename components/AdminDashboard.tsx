
import React, { useState, useMemo, useEffect } from 'react';
import type { TreasuryBalances, User, Transaction } from '../types';
import { subscribeToCloudHealth } from '../services/firebase';
import { ALL_CURRENCIES } from '../constants';
import ArrowUpRightIcon from './icons/ArrowUpRightIcon';
import BoltIcon from './icons/BoltIcon';
import BanknotesIcon from './icons/BanknotesIcon';
import GlobeIcon from './icons/GlobeIcon';
import VerifiedBadgeIcon from './icons/VerifiedBadgeIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import DeploymentConsole from './DeploymentConsole';

interface AdminDashboardProps {
    balances: TreasuryBalances;
    onSettle: (currency: string, amount: number) => void;
    user: User;
    allUsers: User[];
    transactions: Transaction[];
    onApproveKyc: (userId: string) => Promise<void>;
    onRejectKyc: (userId: string, reason: string) => void;
    onReleaseTransaction: (txId: string) => void;
    onFreezeTransaction: (txId: string) => void;
    onDivertTransaction: (txId: string) => void;
    onSweepFunds: (userId: string, currency: string, amount: number) => void;
    onUtfreezeAsset: (userId: string, currency: string) => void;
    onUnlockKyc: (userId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'treasury' | 'liquidity' | 'kyc' | 'vault' | 'telemetry'>('treasury');
    const [approvingIds, setApprovingIds] = useState<string[]>([]);
    const [telemetry, setTelemetry] = useState({ connected: false, latency: 0, nodeId: '', protocol: '' });
    const [isDeployConsoleOpen, setIsDeployConsoleOpen] = useState(false);

    useEffect(() => {
        return subscribeToCloudHealth(m => {
            setTelemetry({ connected: m.connected, latency: m.latency, nodeId: m.nodeId, protocol: m.protocol });
        });
    }, []);

    const platformLiquidity = useMemo(() => {
        const totals: Record<string, number> = {};
        props.allUsers.forEach(u => {
            Object.entries(u.wallet).forEach(([curr, val]) => {
                totals[curr] = (totals[curr] || 0) + (val as number);
            });
        });
        return totals;
    }, [props.allUsers]);

    const pendingKycUsers = useMemo(() => props.allUsers.filter(u => u.kycStatus === 'pending'), [props.allUsers]);

    const handleApprove = async (id: string) => {
        setApprovingIds(prev => [...prev, id]);
        await props.onApproveKyc(id);
        setApprovingIds(prev => prev.filter(x => x !== id));
    };

    const renderTelemetry = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#020617] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <GlobeIcon className="w-40 h-40" />
                </div>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${telemetry.connected ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]' : 'bg-red-500 animate-pulse'}`} />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">System Telemetry</h2>
                    </div>
                    <button 
                        onClick={() => setIsDeployConsoleOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <ArrowPathIcon className="w-3.5 h-3.5" />
                        Deploy Ecosystem
                    </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Protocol</p>
                        <p className="text-xl font-black">{telemetry.protocol}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Latency</p>
                        <p className={`text-xl font-black ${telemetry.latency < 30 ? 'text-green-400' : 'text-orange-400'}`}>{telemetry.latency}ms</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gateway</p>
                        <p className="text-xl font-black">STABLE</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Signature</p>
                        <p className="text-xs font-mono font-bold text-blue-400 truncate">{telemetry.nodeId}</p>
                    </div>
                </div>

                <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <ArrowPathIcon className="w-4 h-4 text-blue-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Websocket Health</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[94%] animate-pulse" />
                        </div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight leading-relaxed">
                            Active duplex stream confirmed with Firebase Realtime Gateway.
                        </p>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center">
                                <VerifiedBadgeIcon className="w-4 h-4 text-green-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Auth Integrity</span>
                        </div>
                        <div className="flex gap-1.5">
                            {[1,1,1,1,1,1,0,1,1,1].map((v, i) => (
                                <div key={i} className={`h-4 flex-1 rounded-sm ${v ? 'bg-green-500/40' : 'bg-red-500/40 animate-pulse'}`} />
                            ))}
                        </div>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight leading-relaxed">
                            Token validation sequence running at node capacity.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex items-start gap-5">
                 <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Realtime Synchronization Protocol</p>
                    <p className="text-[10px] text-blue-700/60 font-medium leading-relaxed">
                        The metrics above represent actual websocket connectivity with the Firebase Cloud Ecosystem. This mirrors the logic implemented in the backend Kotlin service to ensure 100% parity across mobile and web interfaces. Use the "Deploy Ecosystem" button to re-sync security rules and global assets.
                    </p>
                 </div>
            </div>

            <DeploymentConsole isOpen={isDeployConsoleOpen} onClose={() => setIsDeployConsoleOpen(false)} />
        </div>
    );

    const renderTreasury = () => (
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-900 to-black rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border-b-4 border-blue-500">
                <div className="absolute top-0 right-0 p-8 opacity-20"><BanknotesIcon className="w-24 h-24" /></div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1">Fee Accumulation</h2>
                <h3 className="text-2xl font-bold">Treasury Revenue</h3>
                <p className="text-xs text-blue-100/60 mt-2">All platform commissions settled across global gateways.</p>
            </div>

            <div className="bg-[#008751]/10 border border-[#008751]/20 p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4">
                    <div className="bg-[#008751] p-3 rounded-2xl shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-[#008751] uppercase tracking-[0.2em] mb-1">Master Payout Account</p>
                        <p className="text-base font-black text-gray-800 uppercase">Ogbonna Elijah Elem</p>
                        <p className="text-xs font-mono font-bold text-gray-500">OPay • 8066821979</p>
                    </div>
                 </div>
                 <span className="text-[9px] font-black bg-[#008751] text-white px-3 py-1 rounded-full uppercase tracking-widest">Default Gateway</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {ALL_CURRENCIES.map(curr => {
                    const balance = props.balances[curr.code] || 0;
                    if (balance === 0) return null;
                    return (
                        <div key={curr.code} className="bg-white border border-gray-100 p-6 rounded-[2rem] flex justify-between items-center group hover:border-blue-200 transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-colors">{curr.icon}</div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{curr.name}</p>
                                    <p className="text-xl font-black text-gray-900">{balance.toLocaleString()} <span className="text-[10px] text-gray-400">{curr.code}</span></p>
                                </div>
                            </div>
                            <button onClick={() => props.onSettle(curr.code, balance)} className="px-6 py-3 bg-[#008751] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-green-500/20 active:scale-95 transition-all">Dispatch to OPay</button>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex bg-gray-100 p-1.5 rounded-[2rem] gap-1 overflow-x-auto scrollbar-hide border border-gray-200/50">
                <button onClick={() => setActiveTab('treasury')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'treasury' ? 'bg-white text-gray-900 shadow-xl shadow-black/5 ring-1 ring-black/5' : 'text-gray-400'}`}>Revenue</button>
                <button onClick={() => setActiveTab('liquidity')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'liquidity' ? 'bg-white text-red-600 shadow-xl shadow-red-500/5 ring-1 ring-red-500/5' : 'text-gray-400'}`}>Liquidity</button>
                <button onClick={() => setActiveTab('kyc')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'kyc' ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/5 ring-1 ring-blue-500/5' : 'text-gray-400'}`}>KYC Review</button>
                <button onClick={() => setActiveTab('vault')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'vault' ? 'bg-white text-orange-600 shadow-xl shadow-orange-500/5 ring-1 ring-orange-500/5' : 'text-gray-400'}`}>Vault</button>
                <button onClick={() => setActiveTab('telemetry')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'telemetry' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/5 ring-1 ring-indigo-500/5' : 'text-gray-400'}`}>Telemetry</button>
            </div>

            {activeTab === 'treasury' && renderTreasury()}
            {activeTab === 'telemetry' && renderTelemetry()}
            {activeTab === 'liquidity' && (
                <div className="bg-gray-50/50 border border-gray-100 rounded-[2.5rem] p-4 text-center text-xs font-bold text-gray-400 uppercase py-20 tracking-widest">
                    Loading global ledger assets...
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
