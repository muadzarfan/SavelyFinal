import React, { useState } from 'react';
import { Lock, Sparkles, AlertCircle } from 'lucide-react';
import { Language } from '../lib/i18n';

interface PinLockScreenProps {
  correctPin: string;
  language: Language;
  onUnlocked: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  correctPin,
  language,
  onUnlocked,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);
      if (newPin.length === 4) {
        if (newPin === correctPin) {
          onUnlocked();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070b0d] text-white p-4">
      <div className="w-full max-w-xs text-center space-y-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto">
          <Lock className="h-7 w-7" />
        </div>

        <div>
          <h2 className="font-display font-bold text-xl text-white">
            {language === 'id' ? 'Masukkan PIN Keamanan' : 'Enter Security PIN'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'id' ? 'Savely Intelligence Vault terkunci' : 'Your vault is encrypted'}
          </p>
        </div>

        {/* 4 dots */}
        <div className="flex items-center justify-center space-x-4 my-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`h-4 w-4 rounded-full border transition-all ${
                error
                  ? 'border-rose-500 bg-rose-500 animate-shake'
                  : pin.length > idx
                  ? 'border-emerald-400 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                  : 'border-slate-700 bg-slate-900'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-400 flex items-center justify-center space-x-1">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{language === 'id' ? 'PIN salah. Coba lagi.' : 'Incorrect PIN. Try again.'}</span>
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl border border-white/5 bg-white/[0.03] text-lg font-mono font-bold hover:bg-white/[0.08] active:scale-95 transition-all"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl border border-white/5 bg-white/[0.03] text-lg font-mono font-bold hover:bg-white/[0.08] active:scale-95 transition-all"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl border border-white/5 bg-white/[0.03] text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all flex items-center justify-center"
          >
            Del
          </button>
        </div>
      </div>
    </div>
  );
};
