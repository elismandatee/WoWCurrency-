
import React, { useState, useEffect } from 'react';
import Logo from './Logo';
import type { User } from '../types';

interface AuthOverlayProps {
  users: User[];
  onAuthSuccess: (user: User) => void;
}

const COUNTRIES = [
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+1', name: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
  { code: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
];

const ADMIN_PHONE_NUMBER = '+2348066821979';

const AuthOverlay: React.FC<AuthOverlayProps> = ({ users, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    password: '',
    otp: '',
    rememberMe: true 
  });
  
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReadingSms, setIsReadingSms] = useState(false);
  const [error, setError] = useState('');
  const [smsNotification, setSmsNotification] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({ 
      ...formData, 
      [name]: val 
    });
    setError('');
  };

  const triggerSmsSimulation = (code: string, phone: string) => {
    setSmsNotification(null);
    setTimeout(() => {
      setSmsNotification(`WoW AUTH: Your security code is ${code}. Valid for 10 minutes. Do not share.`);
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      
      setTimeout(() => {
          setIsReadingSms(true);
          setTimeout(() => {
              setFormData(prev => ({ ...prev, otp: code }));
              setIsReadingSms(false);
          }, 1500);
      }, 500);

    }, 1000);
  };

  const persistSession = (userId: string) => {
    if (formData.rememberMe) {
      const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000);
      localStorage.setItem('wow_session', JSON.stringify({ userId, expiry }));
    }
  };

  const handleAuthAction = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanedNumber = formData.phoneNumber.replace(/^0+/, '');
    const fullPhone = `${selectedCountry.code}${cleanedNumber}`;

    if (mode === 'register') {
      // Check if user exists
      const exists = users.find(u => u.username === formData.username || u.phoneNumber === fullPhone);
      if (exists) {
        setError('Username or Phone already registered. Try logging in.');
        return;
      }
      // Trigger OTP for registration
      setIsLoading(true);
      setTimeout(() => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        setMode('otp');
        setIsLoading(false);
        triggerSmsSimulation(code, fullPhone);
      }, 800);
      return;
    }

    if (loginMethod === 'otp') {
      setIsLoading(true);
      setTimeout(() => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        setMode('otp');
        setIsLoading(false);
        triggerSmsSimulation(code, fullPhone);
      }, 800);
      return;
    }

    // Direct Password Login
    setIsLoading(true);
    setTimeout(() => {
      const user = users.find(u => 
        (u.username === formData.username || u.phoneNumber === fullPhone) && 
        u.password === formData.password
      );

      if (user) {
        persistSession(user.id);
        onAuthSuccess(user);
      } else {
        setError('Invalid credentials. Check your details or use OTP login.');
        setIsLoading(false);
      }
    }, 1000);
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.otp === generatedOtp) {
      const cleanedNumber = formData.phoneNumber.replace(/^0+/, '');
      const fullPhone = `${selectedCountry.code}${cleanedNumber}`;

      const existingUser = users.find(u => u.phoneNumber === fullPhone || u.username === formData.username);
      
      if (existingUser) {
        persistSession(existingUser.id);
        onAuthSuccess(existingUser);
      } else {
        // Finalize registration
        const newUser: User = {
          id: crypto.randomUUID(),
          username: formData.username || `user_${Math.random().toString(36).slice(2, 7)}`,
          role: fullPhone === ADMIN_PHONE_NUMBER ? 'admin' : 'user', 
          phoneNumber: fullPhone,
          password: formData.password || 'wow_temp_pass',
          profilePic: '',
          kycStatus: 'unverified',
          profile: null,
          wallet: { 'PI': 10, 'BTC': 0, 'ETH': 0, 'USDT': 0, 'NGN': 0, 'USD': 0 },
          cashbackBalance: 0,
          totalDepositedUsd: 0,
          bonusPiAmount: 10,
          biometricEnabled: false
        };
        persistSession(newUser.id);
        onAuthSuccess(newUser);
      }
    } else {
      setError('Invalid code. Please tap "Resend" if you missed it.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-2xl overflow-hidden">
      
      {smsNotification && (
        <div 
          onClick={() => setSmsNotification(null)}
          className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-black/95 text-white p-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 animate-in slide-in-from-top-32 duration-500 z-[300] ring-1 ring-white/20 cursor-pointer active:scale-95 transition-transform"
        >
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/40">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-1">
               <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">MESSAGES • NOW</p>
                  <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping" />
               </div>
            </div>
            <p className="text-sm font-bold text-gray-100">{smsNotification}</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center space-y-4">
          <Logo className="h-16" showText={false} />
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Join the Hub' : 'Security Check'}
            </h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Ecosystem Auth Gateway</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 p-8 rounded-[3.5rem] shadow-sm relative overflow-hidden ring-1 ring-black/[0.02]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold text-center animate-shake border border-red-100">
              {error}
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <form onSubmit={handleAuthAction} className="space-y-4">
              {mode === 'login' && (
                <div className="flex bg-white/50 p-1 rounded-2xl gap-1 mb-2 border border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setLoginMethod('password')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${loginMethod === 'password' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                  >
                    Password
                  </button>
                  <button 
                    type="button"
                    onClick={() => setLoginMethod('otp')}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${loginMethod === 'otp' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                  >
                    SMS OTP
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Username</label>
                  <input 
                    type="text" 
                    name="username"
                    placeholder="E.g. crypto_king"
                    required
                    className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Phone Number</label>
                  <div className="flex gap-2">
                    <select 
                      className="bg-white border border-gray-100 p-4 rounded-2xl text-sm font-bold focus:outline-none appearance-none"
                      value={selectedCountry.code}
                      onChange={(e) => {
                        const found = COUNTRIES.find(c => c.code === e.target.value);
                        if (found) setSelectedCountry(found);
                      }}
                    >
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                    </select>
                    <input 
                      type="tel" 
                      name="phoneNumber"
                      placeholder="080..."
                      required
                      className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Always show password field for register or password login */}
                {(mode === 'register' || loginMethod === 'password') && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Password</label>
                    <input 
                      type="password" 
                      name="password"
                      placeholder="••••••••"
                      required
                      className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 px-2 py-1">
                  <input 
                    type="checkbox" 
                    id="rememberMe" 
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="rememberMe" className="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">Stay Logged In</label>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2A74B1] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : mode === 'login' ? 'Enter Vault' : 'Create My Account'}
              </button>

              <div className="text-center mt-6">
                {mode === 'login' ? (
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    New user? <button type="button" onClick={() => setMode('register')} className="text-blue-500 hover:underline">Create Account</button>
                  </p>
                ) : (
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Already registered? <button type="button" onClick={() => setMode('login')} className="text-blue-500 hover:underline">Sign In</button>
                  </p>
                )}
              </div>
            </form>
          )}

          {mode === 'otp' && (
            <form onSubmit={verifyOtp} className="space-y-6">
              <div className="flex flex-col items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    {isReadingSms ? 'Auto-filling code...' : '6-Digit Verification Code'}
                </label>
                <div className="relative w-full">
                    <input 
                    type="text" 
                    name="otp"
                    placeholder="000000"
                    maxLength={6}
                    required
                    className={`w-full bg-white border p-5 rounded-2xl text-3xl font-black text-center tracking-[0.4em] focus:outline-none transition-all ${isReadingSms ? 'border-blue-500 bg-blue-50/50 animate-pulse' : 'border-gray-100'}`}
                    value={formData.otp}
                    onChange={handleInputChange}
                    />
                    {isReadingSms && (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/5 rounded-2xl">
                             <div className="h-10 w-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-green-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 active:scale-95"
              >
                Verify & Finish
              </button>
              <button 
                type="button" 
                onClick={() => setMode(mode === 'otp' ? 'login' : 'otp')} 
                className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthOverlay;
