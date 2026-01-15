
import React, { useState } from 'react';
import type { KycData, Region } from '../types';

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: KycData) => void;
}

const KycModal: React.FC<KycModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Omit<KycData, 'idDocument'>>({
    fullName: '',
    dateOfBirth: '',
    nationality: 'Nigerian',
    region: 'Africa',
    idType: 'national-id',
    idNumber: '',
    bankName: '',
    accountNumber: '',
  });
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value as any }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileObject(file);
      setFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileObject || !consentGiven) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Simulate high-security identity hashing
        await new Promise(resolve => setTimeout(resolve, 3000));
        onSubmit({ ...formData, idDocument: base64String });
        setIsLoading(false);
    };
    reader.readAsDataURL(fileObject);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#020203]/98 backdrop-blur-3xl z-[300] flex items-center justify-center p-4 overflow-y-auto selection:bg-blue-600 selection:text-white" onClick={onClose}>
      <div className="bg-[#0A0A0B] rounded-[3.5rem] shadow-[0_50px_120px_rgba(0,0,0,1)] w-full max-w-xl overflow-hidden border border-white/[0.03] ring-1 ring-white/5" onClick={(e) => e.stopPropagation()}>
        
        {/* Header - Ghosted Typography */}
        <div className="p-10 pb-6 border-b border-white/[0.03] relative overflow-hidden bg-[#101012]">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
              <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
                    <p className="text-[10px] font-black text-blue-500/40 uppercase tracking-[0.3em]">Identity Node Protocol</p>
                </div>
                <h2 className="text-3xl font-black text-white/90 tracking-tighter">Vault Provisioning</h2>
            </div>
            <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-4 rounded-3xl border border-white/5 transition-all active:scale-95 text-gray-700 hover:text-white">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="mt-10 flex gap-2">
             {[1, 2, 3].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-700 ${i <= step ? 'bg-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-white/[0.03]'}`} />
             ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 pt-10 space-y-10">
          
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="space-y-2 group">
                <label className="block text-[9px] font-black text-white/10 uppercase tracking-widest ml-4 group-focus-within:text-blue-500/50 transition-colors">Legal Identity Proof</label>
                <input 
                    type="text" 
                    name="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter full name"
                    className="w-full px-7 py-6 bg-white/[0.02] border border-white/[0.03] rounded-[2rem] text-sm font-black text-white placeholder:text-white/5 focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/40 focus:bg-white/[0.04] outline-none transition-all" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2 group">
                    <label className="block text-[9px] font-black text-white/10 uppercase tracking-widest ml-4 group-focus-within:text-blue-500/50 transition-colors">Birth Date</label>
                    <input 
                        type="date" 
                        name="dateOfBirth" 
                        value={formData.dateOfBirth} 
                        onChange={handleChange} 
                        required 
                        className="w-full px-7 py-6 bg-white/[0.02] border border-white/[0.03] rounded-[2rem] text-sm font-black text-white focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/40 outline-none transition-all appearance-none" 
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="block text-[9px] font-black text-white/10 uppercase tracking-widest ml-4 group-focus-within:text-blue-500/50 transition-colors">Region</label>
                    <select 
                        name="region" 
                        value={formData.region} 
                        onChange={handleChange} 
                        className="w-full px-7 py-6 bg-white/[0.02] border border-white/[0.03] rounded-[2rem] text-sm font-black text-white/80 focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/40 outline-none transition-all cursor-pointer"
                    >
                        <option value="Africa" className="bg-[#0A0A0B]">Africa (NGN)</option>
                        <option value="Europe" className="bg-[#0A0A0B]">Europe (EUR)</option>
                        <option value="Americas" className="bg-[#0A0A0B]">Americas (USD)</option>
                        <option value="Asia" className="bg-[#0A0A0B]">Asia (SGD)</option>
                    </select>
                  </div>
              </div>
              <button type="button" onClick={() => setStep(2)} className="w-full bg-[#2A74B1] text-white py-6 rounded-[2.2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-blue-600 transition-all active:scale-95">Analyze Identity Source</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="space-y-2 group">
                <label className="block text-[9px] font-black text-white/10 uppercase tracking-widest ml-4 group-focus-within:text-blue-500/50 transition-colors">Credential Class</label>
                <select 
                    name="idType" 
                    value={formData.idType} 
                    onChange={handleChange} 
                    className="w-full px-7 py-6 bg-white/[0.02] border border-white/[0.03] rounded-[2rem] text-sm font-black text-white/80 focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/40 outline-none transition-all cursor-pointer"
                >
                    <option value="national-id" className="bg-[#0A0A0B]">National ID (NIN/SSN)</option>
                    <option value="drivers-license" className="bg-[#0A0A0B]">Driver's License</option>
                    <option value="passport" className="bg-[#0A0A0B]">International Passport</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-[9px] font-black text-white/10 uppercase tracking-widest ml-4">Optical Data Link</label>
                <label htmlFor="idDocument" className="relative cursor-pointer bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-white/[0.05] p-12 flex flex-col items-center justify-center hover:border-blue-500/30 transition-all group">
                    <div className="bg-white/5 p-6 rounded-[2.2rem] mb-5 border border-white/[0.03] group-hover:bg-blue-500/10 transition-colors">
                        <svg className="w-10 h-10 text-white/10 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-black uppercase text-gray-600 tracking-[0.2em] group-hover:text-blue-400 transition-colors">
                        {fileName ? fileName : 'Optical Scan Initiation'}
                    </span>
                    <input id="idDocument" name="idDocument" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,application/pdf" required />
                </label>
              </div>

              <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 bg-white/5 text-gray-600 py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">Previous</button>
                  <button type="button" onClick={() => setStep(3)} className="flex-[2] bg-[#2A74B1] text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 shadow-2xl transition-all">Settlement Configuration</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="space-y-5">
                    <div className="space-y-2 group">
                        <label className="block text-[9px] font-black text-white/10 uppercase tracking-widest ml-4 group-focus-within:text-blue-500/50 transition-colors">Destination Bank Node</label>
                        <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} required placeholder="E.g. OPay Digital" className="w-full px-7 py-6 bg-white/[0.02] border border-white/[0.03] rounded-[2rem] text-sm font-black text-white placeholder:text-white/5 focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/40 outline-none transition-all" />
                    </div>
                    <div className="space-y-2 group">
                        <label className="block text-[9px] font-black text-white/10 uppercase tracking-widest ml-4 group-focus-within:text-blue-500/50 transition-colors">Direct Ledger ID</label>
                        <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} required placeholder="Enter account ID" className="w-full px-7 py-6 bg-white/[0.02] border border-white/[0.03] rounded-[2rem] text-sm font-black text-white placeholder:text-white/5 focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500/40 outline-none transition-all" />
                    </div>
                </div>

                <div className="bg-blue-600/[0.02] p-8 rounded-[3rem] border border-white/[0.03] space-y-4">
                    <div className="flex gap-4">
                        <div className="shrink-0 pt-1">
                            <input 
                                type="checkbox" 
                                id="consent" 
                                checked={consentGiven} 
                                onChange={(e) => setConsentGiven(e.target.checked)}
                                className="w-5 h-5 bg-black rounded-lg border-white/10 text-blue-600 focus:ring-offset-black transition-all cursor-pointer"
                                required
                            />
                        </div>
                        <label htmlFor="consent" className="text-[9px] text-white/10 font-bold leading-relaxed uppercase tracking-widest text-justify select-none cursor-pointer hover:text-white/30 transition-colors">
                            I verify that all provided data is accurate. I consent to manual identity processing for WoW Protocol compliance.
                        </label>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button type="button" onClick={() => setStep(2)} className="flex-1 bg-white/5 text-gray-600 py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">Back</button>
                    <button
                        type="submit"
                        disabled={isLoading || !consentGiven || !fileObject}
                        className="flex-[2] bg-green-600/60 text-white font-black py-6 rounded-[2rem] hover:bg-green-600 transition-all duration-300 disabled:opacity-5 flex items-center justify-center text-[10px] uppercase tracking-[0.2em] shadow-2xl"
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>SIGNING HASH...</span>
                            </div>
                        ) : 'SYNC WITH ECOSYSTEM'}
                    </button>
                </div>
            </div>
          )}

          <div className="text-center pt-4 opacity-[0.03]">
             <p className="text-[8px] font-black text-white uppercase tracking-[0.4em]">Ecosystem Node v3.11.0</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KycModal;
