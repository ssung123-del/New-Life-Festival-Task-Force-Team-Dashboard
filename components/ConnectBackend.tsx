import React, { useState } from 'react';
import { Database, Link2, ArrowRight } from 'lucide-react';
import { ministryService } from '../services/ministryService';

interface ConnectBackendProps {
  onConnect: (scriptUrl: string) => void;
}

export const ConnectBackend: React.FC<ConnectBackendProps> = ({ onConnect }) => {
  const [scriptUrl, setScriptUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Slight delay for UX
    setTimeout(() => {
      onConnect(scriptUrl);
      setIsLoading(false);
    }, 800);
  };

  const handleDemo = () => {
      ministryService.enableDemoMode();
      onConnect('DEMO_MODE');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-black p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up border border-transparent dark:border-[#38383A]">
        {/* Header Graphic */}
        <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-full shadow-lg">
                <Database className="text-white" size={40} />
            </div>
        </div>

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#1D1D1F] dark:text-white">Ministry Cloud 연결</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm break-keep">
              공유받은 매직 링크가 있나요?<br/>
              링크로 재접속하시면 자동 연결됩니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                Apps Script URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Link2 size={18} className="text-gray-400" />
                </div>
                <input
                  type="url"
                  required
                  value={scriptUrl}
                  onChange={(e) => setScriptUrl(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-[#38383A] rounded-xl text-gray-900 dark:text-white focus:bg-white dark:focus:bg-[#3A3A3C] focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                  placeholder="https://script.google.com/macros/s/..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !scriptUrl.includes('script.google.com')}
              className="group w-full flex items-center justify-center gap-2 bg-[#1D1D1F] hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-semibold py-4 rounded-xl transition-all active:scale-[0.98] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  연결하기 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <button
                type="button"
                onClick={handleDemo}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
            >
                테스트용 데모 모드 실행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};