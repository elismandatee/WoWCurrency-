
import React, { useState, useMemo, useEffect } from 'react';
import type { User, TransferRequest, Currency } from '../types';
import { ALL_CURRENCIES } from '../constants';
import VerifiedBadgeIcon from './icons/VerifiedBadgeIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';

interface TransferViewProps {
  user: User;
  allUsers: User[];
  transferRequests: TransferRequest[];
  onSend: (toUserId: string, amount: number, currency: string, note?: string) => void;
  onRequest: (toUserId: string, amount: number, currency: string, note?: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
}

const TransferView: React.FC<TransferViewProps> = ({ 
    user, allUsers, transferRequests, onSend, onRequest, onAcceptRequest, onDeclineRequest 
}) => {
    const [mode, setMode] = useState<'send' | 'request' | 'pending'>('send');
    const [view, setView] = useState<'input' | 'confirm' | 'success'>('input');
    const [recipientQuery, setRecipientQuery] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<Currency>(ALL_CURRENCIES[0]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const searchResults = useMemo(() => {
        if (!recipientQuery.trim()) return [];
        const q = recipientQuery.toLowerCase();
        return allUsers.filter(u => 
            u.id !== user.id && 
            (u.username.toLowerCase().includes(q) || u.phoneNumber?.includes(q))
        );
    }, [recipientQuery, allUsers, user.id]);

    const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);

    // Spendable balance check for registration bonus
    const isVerified = user.kycStatus === 'verified';
    const rawBalance = user.wallet[selectedAsset.code] || 0;
    const isBonusLocked = selectedAsset.code === 'PI' && !isVerified;
    const spendableBalance = isBonusLocked ? Math.max(0, rawBalance - (user.bonusPiAmount || 0)) : rawBalance;

    // Mock Recent Nodes for sleek fintech feel
    const recentNodes = useMemo(() => {
        return allUsers.filter(u => u.id !== user.id).slice(0, 4);
    }, [allUsers, user.id]);

    const incomingRequests = useMemo(() => {
        return transferRequests.filter(r => r.toUserId === user.id && r.status === 'pending');
    }, [transferRequests, user.id]);

    const handleAction = async () => {
        if (!selectedRecipient || !amount) return;
        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) return;

        setIsProcessing(true);
        // Simulate network propagation
        await new Promise(r => setTimeout(r, 1500));

        if (mode === 'send') {
            onSend(selectedRecipient.id, amt, selectedAsset.code, note);
        } else {
            onRequest(selectedRecipient.id, amt, selectedAsset.code, note);
        }

        setIsProcessing(false);
        setView('success');
    };

    const resetFlow = () => {
        setAmount('');
        setNote('');
        setSelectedRecipient(null);
        setRecipientQuery('');
        setView('input');
    };

    if (view === 'success') {
        return (
            <div className="bg-white border border-gray-100 p-8 rounded-[3rem] shadow-2xl space-y-8 animate-in zoom-in duration-500 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-green-500 to-blue-500 animate-pulse" />
                
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50/50">
                    <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Node Sync Successful</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Transaction broadcasted & settled</p>
                </div>

                <div className="bg-gray-50 rounded-[2.5rem] p-6 space-y-4 border border-gray-100">
                    <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Settlement Value</span>
                        <span className="text-xl font-black text-gray-900">{amount} {selectedAsset.code}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Destination Node</span>
                        <span className="text-sm font-black text-blue-600">@{selectedRecipient?.username}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <button onClick={resetFlow} className="w-full bg-gray-900 text-white py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-black transition-all">Return to Terminal</button>
                    <button className="w-full text-[9px] font-black text-blue-500 uppercase tracking-widest py-2 hover:underline">Download Proof of Ledger</button>
                </div>
            </div>
        );
    }

    if (view === 'confirm') {
        return (
            <div className="bg-[#0A0A0B] border border-white/5 p-10 rounded-[3.5rem] shadow-2xl space-y-10 animate-in slide-in-from-bottom-8 duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ArrowPathIcon className="w-32 h-32 text-blue-500 animate-spin-slow" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Final Security Review</p>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">Authorize Broadcast?</h2>
                </div>

                <div className="space-y-6 relative z-10">
                    <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5 space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Network Path</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">Your Vault</span>
                                <div className="flex items-center gap-1 opacity-40">
                                    <div className="w-1 h-1 bg-white rounded-full" />
                                    <div className="w-1 h-1 bg-white rounded-full" />
                                    <div className="w-1 h-1 bg-white rounded-full" />
                                </div>
                                <span className="text-xs font-bold text-blue-400">@{selectedRecipient?.username}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-white/5 pt-6">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Asset Release</span>
                            <span className="text-3xl font-black text-white">{amount} <span className="text-sm opacity-40">{selectedAsset.code}</span></span>
                        </div>
                    </div>

                    <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-3xl flex items-start gap-4">
                        <div className="bg-blue-500 text-white p-2 rounded-xl">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <p className="text-[9px] text-blue-200 font-bold leading-relaxed uppercase tracking-tight opacity-60">
                            Asset settlement is atomic and irreversible once broadcasted to the ecosystem node. By clicking below, you authorize the secure bridge.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 relative z-10">
                    <button 
                        onClick={() => setView('input')} 
                        disabled={isProcessing}
                        className="flex-1 bg-white/5 text-gray-400 py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={handleAction}
                        disabled={isProcessing}
                        className="flex-[2] bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-[0_20px_40px_rgba(59,130,246,0.3)] hover:bg-blue-500 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>SYNCING LEDGER...</span>
                            </>
                        ) : (
                            <span>SIGN & BROADCAST</span>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Segmented Control Header */}
            <div className="flex bg-gray-100/50 p-1.5 rounded-[2rem] gap-1 border border-gray-200/50">
                {(['send', 'request', 'pending'] as const).map((m) => (
                    <button 
                        key={m}
                        onClick={() => { setMode(m); setView('input'); }}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all relative ${mode === m ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/5 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {m === 'send' ? 'Send' : m === 'request' ? 'Request' : 'Incoming'}
                        {m === 'pending' && incomingRequests.length > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 bg-orange-500 text-white text-[9px] flex items-center justify-center rounded-full ring-4 ring-white font-black shadow-lg">
                                {incomingRequests.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {mode === 'pending' ? (
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-400/40 uppercase tracking-[0.2em] px-4">Pending Authorization Requests</h3>
                    {incomingRequests.length === 0 ? (
                        <div className="p-16 text-center bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[3rem] space-y-4">
                            <div className="bg-white w-16 h-16 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm border border-gray-50">
                                <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                            </div>
                            <p className="text-xs font-black text-gray-300 uppercase tracking-widest leading-relaxed">No pending universal <br/> payout requests.</p>
                        </div>
                    ) : (
                        incomingRequests.map(req => {
                            const fromUser = allUsers.find(u => u.id === req.fromUserId);
                            return (
                                <div key={req.id} className="bg-white border border-gray-100 p-8 rounded-[3rem] shadow-xl shadow-gray-200/20 space-y-6 animate-in zoom-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-white rounded-[1.8rem] flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner">
                                                <span className="text-xl font-black">{fromUser?.username.substring(0, 1).toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                                                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.15em]">Request Link</p>
                                                </div>
                                                <p className="text-lg font-black text-gray-900 leading-none">@{fromUser?.username}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-gray-900 tracking-tighter">{req.amount} <span className="text-xs text-gray-400 font-bold">{req.currency}</span></p>
                                        </div>
                                    </div>
                                    {req.note && (
                                        <div className="p-5 bg-gray-50/80 rounded-[1.8rem] border border-gray-100/50">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 opacity-40">Request Note</p>
                                            <p className="text-sm font-bold text-gray-700 italic">"{req.note}"</p>
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => onAcceptRequest(req.id)}
                                            className="flex-[2] bg-blue-600 text-white py-4.5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/30 active:scale-95 transition-all hover:bg-blue-700"
                                        >
                                            Authorize Payment
                                        </button>
                                        <button 
                                            onClick={() => onDeclineRequest(req.id)}
                                            className="flex-1 bg-gray-100 text-gray-500 py-4.5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all hover:bg-gray-200"
                                        >
                                            Ignore
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Recipient Selection */}
                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-gray-400/30 uppercase tracking-[0.2em] ml-4">
                            {mode === 'send' ? 'Destination Node' : 'Request From Node'}
                        </label>
                        
                        {!selectedRecipient && (
                            <div className="space-y-6">
                                {/* Recent Nodes display */}
                                <div className="grid grid-cols-4 gap-4 px-2">
                                    {recentNodes.map(r => (
                                        <button 
                                            key={r.id} 
                                            onClick={() => setSelectedRecipient(r)}
                                            className="flex flex-col items-center gap-2 group"
                                        >
                                            <div className="w-16 h-16 rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:shadow-lg transition-all duration-500">
                                                <span className="text-xl font-black text-gray-400 group-hover:text-blue-600 uppercase">{r.username.substring(0, 1)}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter group-hover:text-blue-600">{r.username}</span>
                                        </button>
                                    ))}
                                    <button className="flex flex-col items-center gap-2 group opacity-40">
                                        <div className="w-16 h-16 rounded-[2rem] bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                        </div>
                                        <span className="text-[10px] font-black uppercase">More</span>
                                    </button>
                                </div>

                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-200 transition-all group-focus-within:text-blue-500/40">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                    <input 
                                        type="text"
                                        placeholder="Search by username or node ID..."
                                        value={recipientQuery}
                                        onChange={(e) => setRecipientQuery(e.target.value)}
                                        className="w-full bg-white border border-gray-100 p-6 pl-14 rounded-[2rem] text-sm font-black text-gray-900 placeholder:text-gray-200 focus:ring-[12px] focus:ring-blue-500/5 focus:border-blue-500/30 outline-none transition-all shadow-xl shadow-gray-200/10"
                                    />
                                    {searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.15)] z-[60] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                            <div className="p-4 bg-gray-50/50 border-b border-gray-50">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">Live Node Directory</p>
                                            </div>
                                            <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                                                {searchResults.map(res => (
                                                    <button 
                                                        key={res.id}
                                                        onClick={() => setSelectedRecipient(res)}
                                                        className="w-full p-5 flex items-center gap-4 hover:bg-blue-50/50 text-left transition-all"
                                                    >
                                                        <div className="w-10 h-10 bg-gray-100 rounded-[1rem] flex items-center justify-center text-[10px] font-black text-gray-400 shadow-inner">
                                                            {res.username.substring(0, 1).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-black text-gray-900 leading-none mb-1">@{res.username}</p>
                                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{res.phoneNumber}</p>
                                                        </div>
                                                        {res.kycStatus === 'verified' && (
                                                            <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                                                                <VerifiedBadgeIcon className="w-3.5 h-3.5 text-blue-500" />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedRecipient && (
                            <div className="bg-[#0A0A0B] p-6 rounded-[2.5rem] flex items-center justify-between animate-in slide-in-from-top-4 shadow-2xl relative overflow-hidden group border border-white/5">
                                <div className="absolute top-0 right-0 p-6 opacity-5">
                                    <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" /></svg>
                                </div>
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-[1.8rem] flex items-center justify-center text-blue-400 border border-white/10 shadow-xl">
                                        <span className="text-2xl font-black">{selectedRecipient.username.substring(0, 1).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5 opacity-40">
                                            <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                                            <span className="text-[8px] font-black text-green-500 uppercase tracking-[0.2em]">Live Link</span>
                                        </div>
                                        <p className="text-xl font-black text-white leading-none">@{selectedRecipient.username}</p>
                                        <p className="text-[10px] font-mono font-bold text-gray-500 mt-2 tracking-widest">{selectedRecipient.phoneNumber}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedRecipient(null)} className="p-3 bg-white/5 rounded-2xl text-gray-500 hover:text-red-400 hover:bg-white/10 transition-all active:scale-90 relative z-10">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Value Input */}
                    <div className="bg-white border border-gray-100 p-8 rounded-[3.5rem] shadow-2xl space-y-6">
                        <div className="flex justify-between items-center px-2">
                            <label className="text-[9px] font-black text-gray-400/20 uppercase tracking-[0.2em]">Universal Value</label>
                            <div className="text-right">
                                <span className="text-[9px] font-black text-blue-500/30 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full">
                                    Spendable: {spendableBalance.toLocaleString(undefined, {maximumFractionDigits: 4})}
                                </span>
                                {isBonusLocked && (
                                    <p className="text-[7px] font-black text-orange-400 uppercase mt-1">Locked Bonus: {user.bonusPiAmount} PI</p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1 w-full relative">
                                <input 
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full text-6xl font-black bg-transparent outline-none placeholder:text-gray-50 tracking-tighter text-gray-900"
                                />
                            </div>
                            <div className="flex gap-2.5 bg-gray-50/50 p-2 rounded-[2rem] border border-gray-100">
                                {ALL_CURRENCIES.map(c => (
                                    <button 
                                        key={c.code}
                                        onClick={() => setSelectedAsset(c)}
                                        className={`p-3.5 rounded-2xl border-2 transition-all relative ${selectedAsset.code === c.code ? 'border-blue-500 bg-white shadow-xl scale-110' : 'border-transparent opacity-20 hover:opacity-100 hover:bg-white'}`}
                                    >
                                        <div className="scale-100">{c.icon}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-2 group">
                             <label className="text-[9px] font-black text-gray-400/20 uppercase tracking-[0.2em] ml-4 transition-colors group-focus-within:text-gray-400/40">Transfer Context</label>
                             <input 
                                type="text"
                                placeholder="Purpose of transaction..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full bg-gray-50 border border-transparent p-5 rounded-[1.8rem] text-sm font-black text-gray-800 placeholder:text-gray-200 focus:bg-white focus:border-gray-100 outline-none transition-all"
                             />
                        </div>
                    </div>

                    <button 
                        onClick={() => setView('confirm')}
                        disabled={!selectedRecipient || !amount || parseFloat(amount) > spendableBalance}
                        className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all active:scale-[0.98] disabled:opacity-5 relative overflow-hidden group ${mode === 'send' ? 'bg-[#2A74B1] text-white' : 'bg-[#F58220] text-white'}`}
                    >
                        <span className="relative z-10">
                            {parseFloat(amount) > spendableBalance ? 'INSUFFICIENT SPENDABLE' : (mode === 'send' ? `PREPARE ${selectedAsset.code} BROADCAST` : `GENERATE ${selectedAsset.code} REQUEST`)}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </button>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}} />
        </div>
    );
};

export default TransferView;
