
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
import TelemetryGraph from './TelemetryGraph';

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
    onUnfreezeAsset: (userId: string, currency: string) => void;
    onUnlockKyc: (userId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'treasury' | 'kyc' | 'vault' | 'telemetry' | 'governance'>('treasury');
    const [telemetry, setTelemetry] = useState({ connected: false, latency: 0, nodeId: '', protocol: '', perfActive: false, loadAverage: 0, databaseUrl: '' });
    const [latencyHistory, setLatencyHistory] = useState<number[]>(new Array(20).fill(25));
    const [isDeployConsoleOpen, setIsDeployConsoleOpen] = useState(false);
    const [searchUser, setSearchUser] = useState('');
    const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

    useEffect(() => {
        return subscribeToCloudHealth(m => {
            setTelemetry({ 
                connected: m.connected, 
                latency: m.latency, 
                nodeId: m.nodeId, 
                protocol: m.protocol,
                perfActive: m.perfActive,
                loadAverage: m.loadAverage,
                databaseUrl: m.databaseUrl
            });
            setLatencyHistory(prev => [...prev.slice(1), m.latency]);
        });
    }, []);

    const pendingTransactions = useMemo(() => {
        return props.transactions.filter(tx => tx.status === 'pending' && (tx.type === 'withdrawal' || tx.type === 'transfer_send'));
    }, [props.transactions]);

    const filteredUsers = useMemo(() => {
        return props.allUsers.filter(u => 
            u.id !== props.user.id && 
            (u.username.toLowerCase().includes(searchUser.toLowerCase()) || u.phoneNumber?.includes(searchUser))
        );
    }, [props.allUsers, searchUser, props.user.id]);

    const pendingKycUsers = useMemo(() => {
        return props.allUsers.filter(u => u.kycStatus === 'pending');
    }, [props.allUsers]);

    const renderKycManager = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#334155] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border-b-4 border-blue-400">
                <div className="absolute top-0 right-0 p-8 opacity-10"><VerifiedBadgeIcon className="w-24 h-24" /></div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300 mb-1">Identity Protocol</h2>
                <h3 className="text-2xl font-bold">KYC Review Station</h3>
                <p className="text-xs text-slate-300 mt-2">Inspect government-issued documents and verify ecosystem nodes.</p>
            </div>

            {pendingKycUsers.length === 0 ? (
                <div className="p-20 text-center bg-white border border-gray-100 rounded-[3rem] space-y-4 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto">
                        <VerifiedBadgeIcon className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest leading-relaxed">Identity queue is clear. <br/> No pending verifications.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {pendingKycUsers.map(u => (
                        <div key={u.id} className="bg-white border border-gray-100 p-8 rounded-[3rem] shadow-xl shadow-gray-200/20 space-y-8 animate-in slide-in-from-right-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-slate-50 rounded-[1.8rem] flex items-center justify-center text-slate-300 border border-slate-100 shadow-inner">
                                        <span className="text-2xl font-black">{u.username.substring(0, 1).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Pending Verification</p>
                                        </div>
                                        <h4 className="text-xl font-black text-gray-900 leading-none">@{u.username}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{u.phoneNumber}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Submission Node</p>
                                    <span className="text-[9px] font-mono bg-slate-100 px-2 py-1 rounded text-gray-500">{u.id.substring(0, 12)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Legal Identity Data</h5>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase">Full Legal Name</p>
                                                <p className="text-sm font-bold text-gray-800 uppercase">{u.profile?.fullName}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase">Date of Birth</p>
                                                    <p className="text-sm font-bold text-gray-800">{u.profile?.dateOfBirth}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-gray-400 uppercase">Nationality</p>
                                                    <p className="text-sm font-bold text-gray-800">{u.profile?.nationality}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase">ID Type & Number</p>
                                                <p className="text-sm font-bold text-gray-800 uppercase">{u.profile?.idType}: {u.profile?.idNumber}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Internal Rejection Reason (If applicable)</label>
                                        <input 
                                            type="text" 
                                            placeholder="E.g. Document blurry, mismatched name..."
                                            value={rejectionReason[u.id] || ''}
                                            onChange={(e) => setRejectionReason(prev => ({ ...prev, [u.id]: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-bold text-gray-800 focus:ring-4 focus:ring-red-500/5 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Document Evidence (Optical)</h5>
                                    {u.profile?.idDocument ? (
                                        <div 
                                            onClick={() => setSelectedDoc(u.profile?.idDocument || null)}
                                            className="relative group cursor-zoom-in bg-slate-900 rounded-[2.5rem] border border-slate-200 aspect-video overflow-hidden shadow-2xl transition-transform hover:scale-[1.02]"
                                        >
                                            <img 
                                                src={u.profile.idDocument} 
                                                alt="KYC Document" 
                                                className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                    Inspect High-Res
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-300 aspect-video flex flex-col items-center justify-center space-y-3">
                                            <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Binary Stream Missing</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <button 
                                    onClick={() => props.onRejectKyc(u.id, rejectionReason[u.id] || "Documents rejected by administrative review.")}
                                    className="bg-white border border-red-200 text-red-500 py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] hover:bg-red-50 transition-all active:scale-95"
                                >
                                    Ignore / Reject Node
                                </button>
                                <button 
                                    onClick={() => props.onApproveKyc(u.id)}
                                    className="bg-blue-600 text-white py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <VerifiedBadgeIcon className="w-4 h-4" />
                                    Confirm Identity Node
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Fullscreen Document Viewer */}
            {selectedDoc && (
                <div 
                    className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedDoc(null)}
                >
                    <div className="absolute top-6 right-6">
                        <button className="bg-white/10 hover:bg-white/20 p-4 rounded-full text-white transition-all">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <img 
                        src={selectedDoc} 
                        alt="KYC Inspection" 
                        className="max-w-full max-h-[90vh] object-contain shadow-[0_0_100px_rgba(59,130,246,0.3)] animate-in zoom-in-95 duration-500" 
                    />
                </div>
            )}
        </div>
    );

    const renderGovernance = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#1E293B] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border-b-4 border-red-500">
                <div className="absolute top-0 right-0 p-8 opacity-10"><VerifiedBadgeIcon className="w-24 h-24" /></div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400 mb-1">Asset Control</h2>
                <h3 className="text-2xl font-bold">User Ledger Governance</h3>
                <p className="text-xs text-slate-400 mt-2">Administrative access to liquidate and withdraw funds from any user vault node.</p>
            </div>

            <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                    type="text" 
                    placeholder="Identify user node for asset sweep..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="w-full bg-white border border-gray-100 p-6 pl-14 rounded-[2rem] text-sm font-black text-gray-900 focus:ring-4 focus:ring-red-500/5 focus:border-red-500/20 outline-none transition-all shadow-xl"
                />
            </div>

            <div className="space-y-4">
                {filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 italic">No user nodes matching signature.</div>
                ) : (
                    filteredUsers.map(u => (
                        <div key={u.id} className="bg-white border border-gray-100 p-6 rounded-[2.5rem] shadow-sm space-y-6 group hover:border-red-100 transition-all">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 font-black">
                                        {u.username.substring(0,1).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-base font-black text-gray-900">@{u.username}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{u.phoneNumber}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${u.kycStatus === 'verified' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {u.kycStatus}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(u.wallet).map(([currency, balance]) => (
                                    (balance as number) > 0 && (
                                        <div key={currency} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black text-gray-400 uppercase">{currency}</span>
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                            </div>
                                            <p className="text-lg font-black text-gray-900 leading-none">{balance.toLocaleString()}</p>
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm(`Sweep all ${balance} ${currency} from @${u.username} to Treasury?`)) {
                                                        props.onSweepFunds(u.id, currency, balance);
                                                    }
                                                }}
                                                className="w-full py-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-500/10"
                                            >
                                                Sweep to Vault
                                            </button>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderVault = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#0F172A] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border-b-4 border-orange-500">
                <div className="absolute top-0 right-0 p-8 opacity-10"><BoltIcon className="w-24 h-24" /></div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-400 mb-1">Security Queue</h2>
                <h3 className="text-2xl font-bold">Vault Governance</h3>
                <p className="text-xs text-slate-400 mt-2">Manage in-flight asset movement and platform liquidity exits.</p>
            </div>

            {pendingTransactions.length === 0 ? (
                <div className="p-20 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-[3rem] space-y-4">
                    <div className="bg-white w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                        <VerifiedBadgeIcon className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest leading-relaxed">No transactions currently <br/> awaiting vault clearance.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingTransactions.map(tx => {
                        const txUser = props.allUsers.find(u => u.id === tx.userId);
                        return (
                            <div key={tx.id} className="bg-white border border-gray-100 p-6 rounded-[2.5rem] shadow-xl shadow-gray-200/20 group hover:border-blue-200 transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                                            <ArrowUpRightIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">@{txUser?.username || 'System'}</p>
                                            <h4 className="text-base font-black text-gray-900 uppercase">{tx.type} Request</h4>
                                            <p className="text-[10px] font-mono text-gray-400">ID: {tx.id.substring(0, 14)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-gray-900">{tx.amount.toLocaleString()} <span className="text-xs text-gray-400">{tx.currency}</span></p>
                                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-tight animate-pulse">Awaiting Signal</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Target Payout</p>
                                        <p className="text-xs font-bold text-gray-700">{tx.recipient}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Cost Logic</p>
                                        <p className="text-xs font-bold text-blue-600">{(tx.costInCrypto || 0).toFixed(6)} {tx.cryptoUsed}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <button 
                                        onClick={() => props.onReleaseTransaction(tx.id)}
                                        className="bg-green-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 active:scale-95 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                        Release
                                    </button>
                                    <button 
                                        onClick={() => props.onFreezeTransaction(tx.id)}
                                        className="bg-slate-800 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 active:scale-95 hover:bg-black transition-all flex items-center justify-center gap-2"
                                    >
                                        Freeze
                                    </button>
                                    <button 
                                        onClick={() => props.onDivertTransaction(tx.id)}
                                        className="bg-red-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        Divert
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderTelemetry = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#020617] rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <GlobeIcon className="w-40 h-40" />
                </div>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${telemetry.connected ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]' : 'bg-red-500 animate-pulse'}`} />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Ledger Governance Node</h2>
                    </div>
                    <button 
                        onClick={() => setIsDeployConsoleOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                        <ArrowPathIcon className="w-3.5 h-3.5" />
                        Sync Production Cache
                    </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">WSS Sync</p>
                        <p className="text-xl font-black">{telemetry.connected ? 'ACTIVE' : 'OFFLINE'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">DB Latency</p>
                        <p className={`text-xl font-black ${(telemetry.latency as number) < 25 ? 'text-green-400' : 'text-orange-400'}`}>{telemetry.latency}ms</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Perf Monitoring</p>
                        <p className={`text-xl font-black ${telemetry.perfActive ? 'text-blue-400' : 'text-gray-600'}`}>{telemetry.perfActive ? 'ENABLED' : 'IDLE'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cluster Pressure</p>
                        <p className="text-xl font-black">{(telemetry.loadAverage * 100).toFixed(1)}%</p>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <ArrowPathIcon className="w-4 h-4 text-blue-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Global P2P Relay Traces</span>
                        </div>
                        <span className="text-[8px] font-mono text-gray-500">v34.8.0 BOM SECURITY</span>
                    </div>
                    <TelemetryGraph data={latencyHistory} color="#3b82f6" />
                </div>

                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-2">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Primary Realtime Database (Admin SDK)</p>
                    <p className="text-[10px] font-mono text-blue-400 truncate select-all">{telemetry.databaseUrl || 'Initializing Bridge...'}</p>
                </div>
            </div>

            <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex items-start gap-5">
                 <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Administrative Control Point</p>
                    <p className="text-[10px] text-blue-700/60 font-medium leading-relaxed">
                        Securely connected via Firebase Admin Credentials. All conversion ledger entries for Pi Network and institutional crypto assets are cryptographically signed before Realtime Database propagation.
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
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-1">Treasury Ledger</h2>
                <h3 className="text-2xl font-bold">Platform Capital</h3>
                <p className="text-xs text-blue-100/60 mt-2">Aggregated commissions awaiting master gateway settlement.</p>
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
                 <span className="text-[9px] font-black bg-[#008751] text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">Verified</span>
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
                            <button onClick={() => props.onSettle(curr.code, balance)} className="px-6 py-3 bg-[#008751] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-green-500/20 active:scale-95 transition-all">Settle to Master</button>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex bg-gray-100 p-1.5 rounded-[2rem] gap-1 overflow-x-auto scrollbar-hide border border-gray-200/50">
                <button onClick={() => setActiveTab('treasury')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'treasury' ? 'bg-white text-gray-900 shadow-xl ring-1 ring-black/5' : 'text-gray-400'}`}>Revenue</button>
                <button onClick={() => setActiveTab('vault')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'vault' ? 'bg-white text-orange-600 shadow-xl ring-1 ring-orange-500/5' : 'text-gray-400'}`}>Vault</button>
                <button onClick={() => setActiveTab('governance')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'governance' ? 'bg-white text-red-600 shadow-xl ring-1 ring-red-500/5' : 'text-gray-400'}`}>Governance</button>
                <button onClick={() => setActiveTab('kyc')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'kyc' ? 'bg-white text-blue-600 shadow-xl ring-1 ring-blue-500/5' : 'text-gray-400'}`}>Identity</button>
                <button onClick={() => setActiveTab('telemetry')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${activeTab === 'telemetry' ? 'bg-white text-indigo-600 shadow-xl ring-1 ring-indigo-500/5' : 'text-gray-400'}`}>Health</button>
            </div>

            {activeTab === 'treasury' && renderTreasury()}
            {activeTab === 'vault' && renderVault()}
            {activeTab === 'governance' && renderGovernance()}
            {activeTab === 'kyc' && renderKycManager()}
            {activeTab === 'telemetry' && renderTelemetry()}
        </div>
    );
};

export default AdminDashboard;
