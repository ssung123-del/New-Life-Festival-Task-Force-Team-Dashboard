import { Schedule, Priority } from '../types';
import { INITIAL_SCHEDULES } from './mockData';

// [중요] 팀원들과 공유할 때 URL 입력 없이 바로 접속되게 하려면:
// 아래 따옴표 안에 배포된 Google Apps Script URL을 붙여넣고 저장하세요.
// 주의: URL 앞뒤에 공백이 없어야 합니다.
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz1uRupzIs9uyZbMv-oRm2vZN0ZKZq378z3riVMrfSbqb8kZ4kP8ZvRtG8nhQTs8Ux4mg/exec";

const STORAGE_KEY_SCRIPT_URL = 'hms_script_url';

class MinistryService {
  private scriptUrl: string | null;
  private isDemo: boolean = false;

  constructor() {
      // 공백 제거 후 할당
      const hardcodedUrl = GOOGLE_APPS_SCRIPT_URL ? GOOGLE_APPS_SCRIPT_URL.trim() : "";
      this.scriptUrl = hardcodedUrl || (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SCRIPT_URL) : null);
  }

  // 앱이 시작될 때 URL 파라미터(?key=...)를 확인하여 자동으로 연결을 설정합니다.
  checkUrlParams(): boolean {
    if (typeof window === 'undefined') return false;
    
    // 하드코딩된 URL이 있으면 파라미터 체크보다 우선순위를 가집니다.
    if (this.isHardcoded()) return true;

    const params = new URLSearchParams(window.location.search);
    const key = params.get('key') || params.get('source'); // ?key=URL 또는 ?source=URL 지원

    // 유효한 Script URL이 감지되면 저장하고 URL을 정리합니다.
    if (key && key.includes('script.google.com')) {
        this.setCredentials(key);
        // 주소창에서 긴 URL 파라미터를 제거하여 깔끔하게 만듭니다.
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
        return true;
    }
    return false;
  }

  isAuthenticated(): boolean {
    return !!this.scriptUrl;
  }

  enableDemoMode() {
    this.isDemo = true;
    this.scriptUrl = 'DEMO_MODE';
  }

  setCredentials(scriptUrl: string) {
    this.scriptUrl = scriptUrl;
    this.isDemo = false;
    // 하드코딩되지 않은 경우에만 로컬 스토리지 사용
    if (!this.isHardcoded()) {
        localStorage.setItem(STORAGE_KEY_SCRIPT_URL, scriptUrl);
    }
  }

  disconnect() {
    if (!this.isHardcoded()) {
        this.scriptUrl = null;
        this.isDemo = false;
        localStorage.removeItem(STORAGE_KEY_SCRIPT_URL);
    } else {
        alert("코드에 URL이 고정되어 있어(하드코딩) 연결을 해제할 수 없습니다.");
    }
  }

  isHardcoded(): boolean {
      return !!GOOGLE_APPS_SCRIPT_URL && GOOGLE_APPS_SCRIPT_URL.trim().length > 0;
  }

  // 모바일/사파리 호환성을 위해 날짜 형식을 YYYY-MM-DD로 정규화
  private formatDate(date: any): string {
    if (!date) return '';
    let dateStr = String(date).trim();
    
    // 2026. 2. 1 또는 2026.02.01 등의 형식을 처리
    if (dateStr.includes('.')) {
        const parts = dateStr.split('.').map(p => p.trim());
        if (parts.length >= 3) {
            const y = parts[0];
            const m = parts[1].padStart(2, '0');
            const d = parts[2].padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
    }
    return dateStr;
  }

  async getSchedules(): Promise<Schedule[]> {
    if (this.isDemo) {
        return new Promise((resolve) => {
            setTimeout(() => resolve([...INITIAL_SCHEDULES]), 600);
        });
    }

    if (!this.scriptUrl) {
      throw new Error("Backend URL not found");
    }

    const response = await fetch(`${this.scriptUrl}?action=read`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from Google Apps Script');
    }

    const data = await response.json();
    
    if (data.result === 'error') {
      throw new Error(data.message);
    }

    return data.map((item: any) => ({
      id: item.id,
      startDate: this.formatDate(item.startDate),
      endDate: this.formatDate(item.endDate),
      content: item.content,
      priority: item.priority as Priority,
      category: item.category
    })).sort((a: Schedule, b: Schedule) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }

  async addSchedule(schedule: Omit<Schedule, 'id'>): Promise<Schedule> {
    const formattedSchedule = {
        ...schedule,
        startDate: this.formatDate(schedule.startDate),
        endDate: this.formatDate(schedule.endDate)
    };

    if (this.isDemo) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newSchedule = {
                    ...formattedSchedule,
                    id: 'demo-' + Date.now().toString(),
                };
                resolve(newSchedule as Schedule);
            }, 600);
        });
    }

    if (!this.scriptUrl) throw new Error("Not connected");

    const newSchedule = {
      ...formattedSchedule,
      id: Math.random().toString(36).substr(2, 9),
    };

    const response = await fetch(this.scriptUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        ...newSchedule,
        status: 'Auto'
      })
    });

    const result = await response.json();
    if (result.result === 'error') throw new Error(result.message);

    return newSchedule as Schedule;
  }

  async updateSchedule(schedule: Schedule): Promise<void> {
    const formattedSchedule = {
        ...schedule,
        startDate: this.formatDate(schedule.startDate),
        endDate: this.formatDate(schedule.endDate)
    };

    if (this.isDemo) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), 600);
        });
    }

    if (!this.scriptUrl) throw new Error("Not connected");

    const response = await fetch(this.scriptUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'edit',
        id: formattedSchedule.id,
        startDate: formattedSchedule.startDate,
        endDate: formattedSchedule.endDate,
        content: formattedSchedule.content,
        priority: formattedSchedule.priority,
        category: formattedSchedule.category
      })
    });

    const result = await response.json();
    if (result.result === 'error') throw new Error(result.message);
  }
}

export const ministryService = new MinistryService();