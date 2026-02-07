import React, { useState } from 'react';
import { X, Lock, ArrowRight } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => void;
}

export const AdminLoginModal: React.FC<ModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Updated password check
    if (password === '20261004') {
        onLogin(password);
        setPassword('');
        setError(false);
        onClose();
    } else {
        setError(true);
        const input = document.getElementById('admin-password');
        input?.focus();
        input?.classList.add('animate-shake');
        setTimeout(() => input?.classList.remove('animate-shake'), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1C1C1E] rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-fade-in-up border border-transparent dark:border-[#38383A]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-2">
            <Lock size={20} className="text-gray-500 dark:text-gray-400" />
            관리자 로그인
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-full hover:bg-gray-200 dark:hover:bg-[#3A3A3C] transition-colors">
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">비밀번호</label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={e => {
                  setPassword(e.target.value);
                  setError(false);
              }}
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#2C2C2E] border rounded-xl focus:outline-none focus:ring-2 transition-all dark:text-white ${
                  error 
                  ? 'border-red-300 focus:ring-red-200 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-300' 
                  : 'border-gray-200 dark:border-[#38383A] focus:ring-blue-500/50'
              }`}
              placeholder="비밀번호 입력"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-2 pl-1">비밀번호가 올바르지 않습니다.</p>}
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-[#1D1D1F] dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-black font-semibold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            접속하기 <ArrowRight size={16} />
          </button>
        </form>
      </div>
      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
        }
        .animate-shake {
            animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};