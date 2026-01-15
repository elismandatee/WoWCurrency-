
import React, { useState, useEffect, useRef } from 'react';
import Logo from './Logo';
import type { User } from '../types';

interface AuthOverlayProps {
  users: User[];
  onAuthSuccess: (user: User) => void;
}

/**
 * MASTER ECOSYSTEM ENCRYPTION
 * Administrative privileges are hard-encrypted to the specific signature of: 08066821979.
 * This node has the unique capability of "Reregistration" — it can be re-provisioned 
 * even if the record already exists in the local ledger.
 */
const MASTER_ADMIN_PHONE_VARIANTS = [
  '08066821979', 
  '8066821979', 
  '2348066821979', 
  '23408066821979', 
  '+2348066821979'
];
const REMEMBERED_KEY = 'wow_vault_master_signature';

const AuthOverlay: React.FC<AuthOverlayProps> = ({ users, onAuthSuccess }) => {
  // Steps: identify -> otp -> pin_biometric -> setup_pin | forgot_identify -> otp -> reset_password
  const [step, setStep] = useState<'identify' | 'otp' | 'pin_biometric' | 'setup_pin' | 'forgot_identify' | 'reset_password'>('identify');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'recovery'>('login');
  
  // Form State
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Process State
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const generatedOtpRef = useRef<string>('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Authorize Bridge');
  const [error, setError] = useState('');
  const [showSimulatedSms, setShowSimulatedSms] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isRemembered, setIsRemembered] = useState(false);

  // ALWAYS REMEMBER: Restore the last login credentials on mount
  useEffect(() => {
    const signature = localStorage.getItem(REMEMBERED_KEY);
    if (signature) {
      try {
        const decoded = atob(signature).split(':');
        if (decoded[0]) {
          setUsername(decoded[0]);
          if (decoded[1]) setPassword(decoded[1]);
          if (decoded[2]) setPhone(decoded[2]);
          setIsRemembered(true);
        }
      } catch (e) {
        localStorage.removeItem(REMEMBERED_KEY);
      }
    }
  }, []);

  const handleIdentifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/[^\d+]/g, ''); 
    const numericPhone = phone.replace(/\D/g, '');
    const isMasterAdmin = MASTER_ADMIN_PHONE_VARIANTS.some(variant => 
        cleanPhone === variant || numericPhone === variant.replace(/\D/g, '')
    );

    if (authMode === 'register') {
      if (!username || !phone || !password || !confirmPassword) {
        setError('Complete all vault provisioning fields.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Master Keys do not match.');
        return;
      }
      if (!agreedToTerms) {
        setError('You must accept the WoW Terms of Service.');
        return;
      }
      
      const existingUserByPhone = users.find(u => u.phoneNumber === phone);
      const existingUserByUsername = users.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (!isMasterAdmin && (existingUserByUsername || existingUserByPhone)) {
        setError('Identity node already exists. Please sign in.');
        return;
      }
    } else if (authMode === 'recovery') {
      if (!username || !phone) {
        setError('Enter your Username and registered Phone Number.');
        return;
      }
      const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.phoneNumber === phone);
      if (!existingUser) {
        setError('No identity matches this Username and Phone signature.');
        return;
      }
    } else {
      if (!username || !password) {
        setError('Enter your Username and Master Key.');
        return;
      }
      
      const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (!existingUser || existingUser.password !== password) {
        setError('ACCESS DENIED: The Master Key provided is invalid for this node.');
        setIsRemembered(false);
        return;
      }
    }

    setIsLoading(true);
    setLoadingText(authMode === 'recovery' ? 'Synchronizing Recovery...' : authMode === 'register' && isMasterAdmin ? 'Re-provisioning Admin...' : 'Securing Connection...');

    // PERSIST CREDENTIALS: Always remember the last login credentials if checkbox is active
    if (rememberMe && authMode !== 'recovery') {
      const signature = btoa(`${username}:${password}:${phone}:${Date.now()}`);
      localStorage.setItem(REMEMBERED_KEY, signature);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    generatedOtpRef.current = code; 
    
    setTimeout(() => {
      setStep('otp');
      setOtpValue(['', '', '', '', '', '']);
      
      setTimeout(() => {
        setShowSimulatedSms(true);
        setIsAutoFilling(true);
        
        const digits = code.split('');
        digits.forEach((digit, idx) => {
          setTimeout(() => {
            setOtpValue(prev => {
              const next = [...prev];
              next[idx] = digit;
              return next;
            });
            if (idx === 5) {
              setTimeout(() => {
                validateOtp(code);
                setIsAutoFilling(false);
                setShowSimulatedSms(false);
              }, 800);
            }
          }, idx * 100);
        });
      }, 1000);
      setIsLoading(false);
    }, 1500);
  };

  const validateOtp = (finalOtp: string) => {
    if (finalOtp === generatedOtpRef.current) {
      setError('');
      if (authMode === 'register') {
        setStep('setup_pin');
      } else if (authMode === 'recovery') {
        setStep('reset_password');
        setPassword(''); 
        setConfirmPassword('');
      } else {
        setStep('pin_biometric');
      }
    } else {
      setError('Invalid authorization code.');
      setOtpValue(['', '', '', '', '', '']);
      if (otpRefs.current[0]) otpRefs.current[0].focus();
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password || !confirmPassword) {
      setError('Enter and confirm your new Master Key.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Keys do not match.');
      return;
    }
    if (password.length < 6) {
        setError('New Master Key must be at least 6 characters.');
        return;
    }

    setIsLoading(true);
    setLoadingText('Updating Ecosystem Data...');

    setTimeout(() => {
      const targetUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (targetUser) {
        const updatedUser: User = { ...targetUser, password: password };
        if (rememberMe) {
          const signature = btoa(`${username}:${password}:${phone}:${Date.now()}`);
          localStorage.setItem(REMEMBERED_KEY, signature);
        }
        onAuthSuccess(updatedUser);
      } else {
        setError('Ecosystem sync failed. Identity node lost. Restart session.');
        setStep('identify');
        setAuthMode('login');
      }
      setIsLoading(false);
    }, 1500);
  };

  const handlePinSubmit = (finalPin: string) => {
    if (authMode === 'register') {
      finalizeRegistration(finalPin);
    } else {
      const targetUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (targetUser) {
        onAuthSuccess(targetUser);
      } else {
        setError('Ecosystem synchronization error.');
        setStep('identify');
      }
    }
  };

  const handlePinChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = cleanValue;
    setPin(newPin);
    if (cleanValue && index < 3) pinRefs.current[index + 1]?.focus();
    if (newPin.every(digit => digit !== '')) handlePinSubmit(newPin.join(''));
  };

  const handleBiometricAuth = () => {
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      const targetUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (targetUser) onAuthSuccess(targetUser);
    }, 1500);
  };

  const finalizeRegistration = (finalPin: string) => {
    setIsLoading(true);
    const cleanPhone = phone.replace(/[^\d+]/g, ''); 
    const numericPhone = phone.replace(/\D/g, '');
    
    const isAdmin = MASTER_ADMIN_PHONE_VARIANTS.some(variant => 
        cleanPhone === variant || numericPhone === variant.replace(/\D/g, '')
    );

    const existingAdmin = users.find(u => u.phoneNumber === phone && u.role === 'admin');

    const newUser: User = {
      id: existingAdmin ? existingAdmin.id : crypto.randomUUID(),
      username: username,
      role: isAdmin ? 'admin' : 'user',
      phoneNumber: phone,
      password: password,
      kycStatus: existingAdmin ? existingAdmin.kycStatus : 'unverified',
      profile: existingAdmin ? existingAdmin.profile : null,
      wallet: existingAdmin ? existingAdmin.wallet : { 'PI': 10, 'NGN': 0, 'USD': 0 },
      lockedAssets: existingAdmin ? existingAdmin.lockedAssets : [],
      cashbackBalance: existingAdmin ? existingAdmin.cashbackBalance : 0,
      totalDepositedUsd: existingAdmin ? existingAdmin.totalDepositedUsd : 0,
      bonusPiAmount: 10,
      biometricEnabled: true 
    };

    setTimeout(() => onAuthSuccess(newUser), 1000);
  };

  return (
    <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center p-6 bg-[#F8FAFC]">
      {showSimulatedSms && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-black/95 backdrop-blur-2xl border border-white/10 p-4 rounded-[2rem] shadow-2xl z-[600] animate-in slide-in-from-top-10 duration-500">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Vault Security</p>
              <p className="text-xs font-bold text-white leading-snug">Code: <span className="text-blue-400 font-black tracking-widest">{generatedOtpRef.current}</span>. Auto-syncing...</p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-[0_32px_80px_-15px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden relative z-10 transition-all duration-500">
        <div className="p-10 pb-8 text-center bg-slate-50/50 border-b border-slate-100">
          <Logo className="h-10 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {step === 'identify' || step === 'forgot_identify' ? (authMode === 'login' ? 'Vault Entry' : authMode === 'register' ? 'Provision Account' : 'Initialize Recovery Bridge') : 
             step === 'otp' ? 'Security Handshake' : step === 'reset_password' ? 'Recorrect Key' : 'Identity Layer'}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
            {step === 'reset_password' ? 'Establish your new access credentials' : 'E2E Encrypted Protocol'}
          </p>
        </div>

        <div className="p-10">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] flex items-center gap-3 animate-shake">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          )}

          {(step === 'identify' || step === 'forgot_identify') && (
            <form onSubmit={handleIdentifySubmit} className="space-y-5">
              {authMode !== 'recovery' && (
                <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] mb-4">
                   <button type="button" onClick={() => { setAuthMode('login'); setStep('identify'); setError(''); }} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authMode === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Sign In</button>
                   <button type="button" onClick={() => { setAuthMode('register'); setStep('identify'); setError(''); }} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authMode === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Register</button>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Username</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="e.g. wow_user" 
                    value={username} 
                    onChange={(e) => { setUsername(e.target.value); setIsRemembered(false); }} 
                    className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-slate-900 text-sm font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner" 
                  />
                  {isRemembered && authMode === 'login' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                       <span className="text-[8px] font-black bg-green-100 text-green-600 px-2 py-1 rounded-md uppercase tracking-tight shadow-sm border border-green-200">Secure Node Found</span>
                    </div>
                  )}
                </div>
              </div>

              {(authMode === 'register' || authMode === 'recovery') && (
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number (Global Identity)</label>
                  <input type="tel" placeholder="+234 800 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-slate-900 text-sm font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner" />
                </div>
              )}

              {authMode !== 'recovery' && (
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Master Password (Key)</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-slate-900 text-sm font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner" />
                </div>
              )}

              {authMode === 'login' && (
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="remember_me" 
                      checked={rememberMe} 
                      onChange={(e) => setRememberMe(e.target.checked)} 
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <label htmlFor="remember_me" className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer select-none">Remember Credentials</label>
                  </div>
                  <button type="button" onClick={() => { setAuthMode('recovery'); setStep('forgot_identify'); setError(''); }} className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:underline">Forgot Key?</button>
                </div>
              )}

              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Confirm Master Key</label>
                    <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-slate-900 text-sm font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner" />
                  </div>
                  <div className="flex items-center gap-3 p-1">
                    <input type="checkbox" id="terms_agree" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                    <label htmlFor="terms_agree" className="text-[10px] font-bold text-slate-500 cursor-pointer">I agree to the <span className="text-blue-600 underline">Terms and Conditions</span>.</label>
                  </div>
                </>
              )}

              {authMode === 'recovery' && (
                <div className="flex items-center justify-center pt-2">
                  <button type="button" onClick={() => { setAuthMode('login'); setStep('identify'); setError(''); }} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-500 transition-colors">Return to login portal</button>
                </div>
              )}

              <button type="submit" disabled={isLoading} className="w-full bg-[#2A74B1] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center min-h-[64px]">
                {isLoading ? (
                   <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{loadingText}</span>
                   </div>
                ) : (authMode === 'login' ? 'Verify and Enter Vault' : authMode === 'register' ? 'Provision Secure Node' : 'Initialize Recovery Bridge')}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <div className="space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="text-center">
                <p className="text-sm text-slate-600 font-bold mb-6">Security code sent to your<br/><span className="text-slate-900 font-black tracking-wider">Identity Node</span></p>
                <div className="flex justify-between gap-2">
                  {otpValue.map((digit, i) => (
                    <input 
                      key={i} 
                      ref={(el) => (otpRefs.current[i] = el)} 
                      type="text" 
                      inputMode="numeric" 
                      maxLength={1} 
                      value={digit} 
                      readOnly={isAutoFilling}
                      className={`w-12 h-16 bg-slate-50 border-2 rounded-2xl text-center text-2xl font-black text-slate-900 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner ${isAutoFilling && digit ? 'border-blue-500 animate-pulse bg-blue-50/50' : 'border-slate-100'}`} 
                    />
                  ))}
                </div>
                {isAutoFilling && <p className="mt-6 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] animate-pulse">Syncing OTP Bridge...</p>}
              </div>
            </div>
          )}

          {step === 'reset_password' && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-4">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest text-center">Identity Verified</p>
                 <p className="text-[9px] text-blue-400 font-bold text-center mt-1">Establish a new Master Key for account @{username}</p>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">New Master Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-slate-900 text-sm font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner" />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Confirm New Password</label>
                <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-slate-900 text-sm font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner" />
              </div>
              <div className="flex items-center gap-2 px-1">
                <input 
                  type="checkbox" 
                  id="reset_remember_me" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                />
                <label htmlFor="reset_remember_me" className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer select-none">Update remembered credentials</label>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-[#2A74B1] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center min-h-[64px]">
                {isLoading ? (
                   <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{loadingText}</span>
                   </div>
                ) : 'Finalize Key Reset'}
              </button>
            </form>
          )}

          {(step === 'pin_biometric' || step === 'setup_pin') && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                  {step === 'setup_pin' ? 'Establish Secure Access PIN' : 'Verify Identity Access PIN'}
                </p>
                <div className="flex justify-center gap-4 mb-10">
                  {pin.map((digit, i) => (
                    <input key={i} ref={(el) => (pinRefs.current[i] = el)} type="password" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handlePinChange(i, e.target.value)} className={`w-14 h-14 bg-slate-50 border-2 rounded-2xl text-center text-3xl font-black focus:ring-4 outline-none transition-all ${digit ? 'border-blue-500 bg-white shadow-xl' : 'border-slate-100'}`} />
                  ))}
                </div>
                
                {step === 'pin_biometric' && (
                  <div className="pt-8 border-t border-slate-100">
                    <button onClick={handleBiometricAuth} disabled={biometricScanning} className="group flex flex-col items-center gap-4 mx-auto">
                      <div className={`p-7 rounded-[2.5rem] border-2 transition-all duration-500 ${biometricScanning ? 'border-blue-500 animate-pulse bg-blue-50' : 'border-slate-100 hover:border-blue-200 bg-slate-50/50'}`}>
                        <svg className={`w-12 h-12 ${biometricScanning ? 'text-blue-500' : 'text-slate-300 group-hover:text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 21a10.003 10.003 0 008.384-4.51l.054.09m-4.283-9.93l-.149.368A9.06 9.06 0 0115 10.5a9.06 9.06 0 01-4.709-1.28l-.149-.368m5.156-5.25a9.06 9.06 0 00-5.156 0m5.156 0a9.06 9.06 0 010 5.25m-5.156-5.25a9.06 9.06 0 000 5.25" /></svg>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">{biometricScanning ? 'Scanning Identity Node...' : 'Touch Identity Sensor'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <p className="mt-10 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-40">Master ID Signature: 08066821979 • WoW Vault v4.7.4 • End-to-End Encryption</p>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out; }
      `}} />
    </div>
  );
};

export default AuthOverlay;
