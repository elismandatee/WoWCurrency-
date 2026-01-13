
import React, { useState, useEffect } from 'react';
import Logo from './Logo';

interface LoginOverlayProps {
  onUnlock: () => void;
}

const LoginOverlay: React.FC<LoginOverlayProps> = ({ onUnlock }) => {
  const [authMode, setAuthMode] = useState<'biometric' | 'passcode'>('biometric');
  const [passcode, setPasscode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(false);

  // Mock Biometric Unlock
  const handleBiometricClick = () => {
    setIsScanning(true);
    setError(false);
    
    // Simulate biometric processing delay
    setTimeout(() => {
      setIsScanning(false);
      onUnlock();
    }, 1500);
  };

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '1234') { // Mock pin
      onUnlock();
    } else {
      setError(true);
      setPasscode('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-white/90 backdrop-blur-xl transition-all duration-500">
      <div className="w-full max-w-sm flex flex-col items-center space-y-12">
        {/* Brand Section */}
        <div className="flex flex-col items-center space-y-4">
          <Logo className="h-20" showText={false} />
          <div className="text-center">
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Welcome Back</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Secure Session Active</p>
          </div>
        </div>

        {/* Auth Interaction Area */}
        <div className="w-full bg-gray-50/50 border border-gray-100 p-8 rounded-[3rem] shadow-sm relative overflow-hidden">
          {authMode === 'biometric' ? (
            <div className="flex flex-col items-center space-y-6">
              <button 
                onClick={handleBiometricClick}
                disabled={isScanning}
                className={`group relative p-8 rounded-full border-4 transition-all duration-500 ${
                  isScanning 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/10'
                }`}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className={`w-16 h-16 transition-colors duration-500 ${isScanning ? 'text-blue-500' : 'text-gray-300 group-hover:text-blue-400'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0 4.5 4.5 0 01-4.5 4.5 4.875 4.875 0 00-4.875 4.875M14.25 21.75a11.209 11.209 0 002.731-1.393" />
                </svg>
                {isScanning && (
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping opacity-20" />
                )}
              </button>
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest animate-pulse">
                {isScanning ? 'Verifying Identity...' : 'Tap to scan fingerprint'}
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasscodeSubmit} className="space-y-6 flex flex-col items-center">
              <div className="flex gap-3">
                 {[0,1,2,3].map((i) => (
                    <div 
                        key={i} 
                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                            passcode.length > i 
                            ? 'bg-[#2A74B1] border-[#2A74B1] scale-110' 
                            : 'border-gray-200'
                        } ${error ? 'border-red-500 bg-red-500 animate-bounce' : ''}`} 
                    />
                 ))}
              </div>
              <input 
                type="password" 
                maxLength={4} 
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-default"
              />
              <p className={`text-xs font-black uppercase tracking-widest ${error ? 'text-red-500' : 'text-gray-400'}`}>
                {error ? 'Incorrect Passcode' : 'Enter 4-digit PIN'}
              </p>
            </form>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="flex gap-4">
          <button 
            onClick={() => setAuthMode(authMode === 'biometric' ? 'passcode' : 'biometric')}
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-500 transition-colors bg-gray-100/50 px-6 py-3 rounded-2xl"
          >
            Switch to {authMode === 'biometric' ? 'Passcode' : 'Fingerprint'}
          </button>
        </div>

        <div className="pt-12 text-center opacity-30 grayscale pointer-events-none">
           <Logo className="h-6" showText={true} />
        </div>
      </div>
    </div>
  );
};

export default LoginOverlay;
