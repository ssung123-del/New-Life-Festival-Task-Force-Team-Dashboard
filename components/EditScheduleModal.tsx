import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Priority, Schedule } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Schedule) => Promise<void>;
  initialData: Schedule | null;
}

export const EditScheduleModal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Schedule>({
    id: '',
    content: '',
    startDate: '',
    endDate: '',
    priority: Priority.Medium,
    category: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  if (!isOpen || !initialData) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
    onClose();
  };

  const isNotice = formData.category?.toLowerCase() === 'notice' || formData.category === '공지';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#1C1C1E] rounded-3xl w-full max-w-md p-8 shadow-2xl animate-fade-in-up border border-transparent dark:border-[#38383A]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-[#1D1D1F] dark:text-white">일정 수정</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-full hover:bg-gray-200 dark:hover:bg-[#3A3A3C] transition-colors">
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
           {/* Category Selector */}
           <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">유형 선택</label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-[#2C2C2E] rounded-xl">
                <button
                    type="button"
                    onClick={() => setFormData({...formData, category: 'General'})}
                    className={`py-2 text-sm font-medium rounded-lg transition-all ${
                        !isNotice
                        ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                    일반 사역
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({...formData, category: 'Notice'})}
                    className={`py-2 text-sm font-medium rounded-lg transition-all ${
                        isNotice
                        ? 'bg-white dark:bg-[#3A3A3C] text-black dark:text-white shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                    공지사항
                </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">사역 내용</label>
            <input
              required
              type="text"
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2C2C2E] dark:text-white border border-gray-200 dark:border-[#38383A] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">시작일</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2C2C2E] dark:text-white border border-gray-200 dark:border-[#38383A] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">종료일</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#2C2C2E] dark:text-white border border-gray-200 dark:border-[#38383A] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">중요도</label>
            <div className="flex gap-2">
              {Object.values(Priority).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setFormData({...formData, priority: p})}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                    formData.priority === p 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30' 
                      : 'bg-white dark:bg-[#2C2C2E] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#38383A] hover:bg-gray-50 dark:hover:bg-[#3A3A3C]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? '수정 사항 저장' : '수정 완료'}
          </button>
        </form>
      </div>
    </div>
  );
};