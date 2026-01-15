
import React, { useState } from 'react';
import Logo from './Logo';

interface LoginOverlayProps {
  onUnlock: () => void;
}

const LoginOverlay: React.FC<LoginOverlayProps> = ({ onUnlock }) => {
  const [authMode, setAuthMode] = useState<'biometric' | 'passcode'>('biometric');
  const [passcode, setPasscode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(false);

  const handleBiometricClick = () => {
    setIsScanning(true);
    setError(false);
    setTimeout(() => {
      setIsScanning(false);
      onUnlock();
    }, 1000);
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
    <div className="fixed inset-0 z-[250] flex flex-col items-center justify-center p-6 bg-slate-50 animate-in fade-in duration-500">
      <div className="w-full max-w-sm flex flex-col items-center space-y-8">
        
        <div className="text-center">
          <Logo className="h-10 mx-auto mb-6" />
          <h1 className="text-xl font-bold text-slate-800">Verify Identity</h1>
          <p className="text-slate-500 text-sm mt-1">Unlock your secure vault session</p>
        </div>

        <div className="w-full bg-white border border-slate-200 p-10 rounded-3xl shadow-xl relative overflow-hidden flex flex-col items-center">
          {authMode === 'biometric' ? (
            <div className="flex flex-col items-center space-y-8 w-full">
              <button 
                onClick={handleBiometricClick}
                disabled={isScanning}
                className={`group relative p-8 rounded-full border-2 transition-all duration-500 ${
                  isScanning 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-white'
                }`}
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className={`w-14 h-14 transition-all duration-500 ${isScanning ? 'text-blue-600' : 'text-slate-300 group-hover:text-blue-500'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0 4.5 4.5 0 01-4.5 4.5 4.875 4.875 0 00-4.875 4.875M14.25 21.75a11.209 11.209 0 002.731-1.393" />
                </svg>
                {isScanning && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-ping opacity-20" />
                )}
              </button>
              <p className={`text-sm font-bold transition-colors ${isScanning ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`}>
                {isScanning ? 'Verifying...' : 'Tap to use biometric scan'}
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasscodeSubmit} className="space-y-8 flex flex-col items-center w-full">
              <div className="flex gap-3">
                 {[0,1,2,3].map((i) => (
                    <div 
                        key={i} 
                        className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                            passcode.length > i 
                            ? 'bg-blue-50 border-blue-500' 
                            : 'bg-slate-50 border-slate-100'
                        } ${error ? 'border-red-500 bg-red-50 animate-shake' : ''}`} 
                    >
                      <span className="text-xl font-bold text-slate-800">
                        {passcode[i] ? '•' : ''}
                      </span>
                    </div>
                 ))}
              </div>
              <input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4} 
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                className="opacity-0 absolute inset-0 w-full h-full cursor-default"
              />
              <p className={`text-sm font-bold ${error ? 'text-red-500' : 'text-slate-400'}`}>
                {error ? 'Incorrect PIN' : 'Enter 4-digit security PIN'}
              </p>
            </form>
          )}
        </div>

        <button 
          onClick={() => setAuthMode(authMode === 'biometric' ? 'passcode' : 'biometric')}
          className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-white px-6 py-3 rounded-xl border border-slate-200 shadow-sm"
        >
          {authMode === 'biometric' ? 'Use Security PIN' : 'Use Biometrics'}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default LoginOverlay;
