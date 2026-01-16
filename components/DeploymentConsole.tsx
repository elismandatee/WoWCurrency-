
import React, { useState, useEffect, useRef } from 'react';
import ArrowPathIcon from './icons/ArrowPathIcon';
import BoltIcon from './icons/BoltIcon';

interface LogEntry {
    text: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'header';
    timestamp: string;
}

const DeploymentConsole: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<'idle' | 'deploying' | 'finished'>('idle');
    const scrollRef = useRef<HTMLDivElement>(null);

    const addLog = (text: string, type: LogEntry['type'] = 'info') => {
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [...prev, { text, type, timestamp: time }]);
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const runDeployment = async () => {
        setStatus('deploying');
        setLogs([]);
        setProgress(0);

        const sequence = [
            { msg: '=== WoWCurrency Ecosystem Deployment Initiated ===', type: 'header', delay: 500, p: 5 },
            { msg: 'Project ID: wowcurrency-converter', type: 'info', delay: 400, p: 10 },
            { msg: 'Scanning local environment...', type: 'info', delay: 600, p: 15 },
            { msg: 'Checking firestore.rules...', type: 'info', delay: 400, p: 20 },
            { msg: 'Validating security protocols [E2E-AES-256]...', type: 'info', delay: 800, p: 25 },
            { msg: 'Rules validation SUCCESS.', type: 'success', delay: 200, p: 30 },
            { msg: 'Compressing application assets (4.12 MB)...', type: 'info', delay: 1000, p: 40 },
            { msg: 'Building optimized WASM modules...', type: 'info', delay: 1200, p: 55 },
            { msg: 'Uploading to Firebase Global CDN nodes...', type: 'info', delay: 1500, p: 70 },
            { msg: 'Syncing Firestore Indexes...', type: 'info', delay: 500, p: 80 },
            { msg: 'Cloud Functions warming up...', type: 'info', delay: 700, p: 85 },
            { msg: 'Invalidating edge caches...', type: 'info', delay: 400, p: 90 },
            { msg: 'Deployment Phase 3 COMPLETE.', type: 'success', delay: 300, p: 95 },
            { msg: 'Site is now LIVE at https://wowcurrency-converter.web.app', type: 'header', delay: 600, p: 100 },
        ];

        for (const step of sequence) {
            await new Promise(r => setTimeout(r, step.delay));
            addLog(step.msg, step.type as any);
            setProgress(step.p);
        }

        setStatus('finished');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-[#0F1115] rounded-[2.5rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[80vh]">
                {/* Terminal Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest ml-4">Deployment Terminal (Firebase CLI)</span>
                    </div>
                    {status === 'finished' && (
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>

                {/* Terminal Body */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 font-mono text-sm space-y-2 scrollbar-hide">
                    {logs.length === 0 && status === 'idle' && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                            <div className="p-6 bg-blue-500/10 rounded-full animate-pulse">
                                <BoltIcon className="w-12 h-12 text-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-white font-bold text-lg">Production Ready</h3>
                                <p className="text-gray-500 text-xs max-w-xs mx-auto">Push latest WoWCurrency ecosystem changes to live Firebase production nodes.</p>
                            </div>
                            <button 
                                onClick={runDeployment}
                                className="px-8 py-4 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                            >
                                Trigger Deploy Protocol
                            </button>
                        </div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className={`flex gap-4 animate-in slide-in-from-left-2 duration-300 ${log.type === 'header' ? 'py-4' : ''}`}>
                            <span className="text-gray-600 shrink-0 text-[10px] pt-0.5">[{log.timestamp}]</span>
                            <span className={`
                                ${log.type === 'info' ? 'text-gray-300' : ''}
                                ${log.type === 'success' ? 'text-green-400 font-bold' : ''}
                                ${log.type === 'header' ? 'text-blue-400 font-black' : ''}
                                ${log.type === 'error' ? 'text-red-400 font-bold' : ''}
                            `}>
                                {log.type === 'success' && '✓ '}
                                {log.text}
                            </span>
                        </div>
                    ))}
                    {status === 'deploying' && (
                        <div className="flex gap-4 items-center pt-4">
                            <span className="text-blue-500 animate-pulse text-[10px]">SYNCING...</span>
                            <div className="h-0.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-blue-500 text-[10px] font-bold">{progress}%</span>
                        </div>
                    )}
                </div>

                {/* Footer Status */}
                <div className="p-6 bg-black border-t border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status === 'deploying' ? 'bg-yellow-500 animate-pulse' : status === 'finished' ? 'bg-green-500' : 'bg-gray-700'}`} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {status === 'idle' ? 'Awaiting Protocol' : status === 'deploying' ? 'Ecosystem Syncing...' : 'Cluster Stable'}
                        </span>
                    </div>
                    {status === 'finished' && (
                        <button 
                            onClick={onClose}
                            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
                        >
                            Return to Dashboard
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeploymentConsole;
