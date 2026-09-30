import { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, CheckCircle2, Globe, CalendarDays } from 'lucide-react';

export default function Goals() {
  const { theme, cycleStartDay } = useAppContext();
  const [offset, setOffset] = useState(0);
  const [showToast, setShowToast] = useState(false);

  // State cho Global (Mặc định)
  const [globalBudget, setGlobalBudget] = useState('');
  const [globalIncome, setGlobalIncome] = useState('');

  // State cho Monthly (Tháng hiện tại)
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');

  const getPeriodBounds = () => {
    const base = new Date();
    let currentStart = new Date(base.getFullYear(), base.getMonth(), cycleStartDay);
    if (base.getDate() < cycleStartDay) currentStart.setMonth(currentStart.getMonth() - 1);
    currentStart.setMonth(currentStart.getMonth() + offset);
    
    const start = new Date(currentStart);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let label = '';
    if (cycleStartDay === 1) {
      label = `${months[start.getMonth()]} ${start.getFullYear()}`;
    } else {
      let endLabel = new Date(end);
      endLabel.setDate(endLabel.getDate() - 1);
      label = `${months[start.getMonth()]} ${start.getDate()} - ${months[endLabel.getMonth()]} ${endLabel.getDate()}`;
    }
    
    const key = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}`;
    return { start, label, key };
  };

  const bounds = getPeriodBounds();

  // Load Global Goals một lần
  useEffect(() => {
    const gGoals = JSON.parse(localStorage.getItem('vys_global_goals') || '{"budget": 0, "income": 0}');
    setGlobalBudget(gGoals.budget ? gGoals.budget.toLocaleString('vi-VN') : '');
    setGlobalIncome(gGoals.income ? gGoals.income.toLocaleString('vi-VN') : '');
  }, []);

  // Load Monthly Goals mỗi khi đổi tháng
  useEffect(() => {
    const mGoals = JSON.parse(localStorage.getItem('vys_monthly_goals') || '{}');
    if (mGoals[bounds.key]) {
      setMonthlyBudget(mGoals[bounds.key].budget ? mGoals[bounds.key].budget.toLocaleString('vi-VN') : '');
      setMonthlyIncome(mGoals[bounds.key].income ? mGoals[bounds.key].income.toLocaleString('vi-VN') : '');
    } else {
      setMonthlyBudget('');
      setMonthlyIncome('');
    }
  }, [bounds.key]);

  const handleInput = (val, setter) => {
    const raw = val.replace(/\./g, '').replace(/\D/g, ''); 
    if (!raw) { setter(''); return; }
    setter(Number(raw).toLocaleString('vi-VN')); 
  };

  const handleSave = () => {
    // Lưu Global
    localStorage.setItem('vys_global_goals', JSON.stringify({
      budget: Number(globalBudget.replace(/\./g, '')),
      income: Number(globalIncome.replace(/\./g, ''))
    }));

    // Lưu Monthly
    const mGoals = JSON.parse(localStorage.getItem('vys_monthly_goals') || '{}');
    mGoals[bounds.key] = {
      budget: Number(monthlyBudget.replace(/\./g, '')),
      income: Number(monthlyIncome.replace(/\./g, ''))
    };
    localStorage.setItem('vys_monthly_goals', JSON.stringify(mGoals));
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className={`h-[100dvh] w-full flex flex-col relative overflow-hidden animate-ios-page ${theme === 'dark' ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'}`}>
      
      {/* HEADER */}
      <div 
        className={`flex-shrink-0 z-40 px-4 pb-3 flex flex-col justify-end shadow-[0_1px_0_0_rgba(0,0,0,0.05)] relative ${theme === 'dark' ? 'bg-black/90 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]' : 'bg-[#f2f2f7]/90'}`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <h1 className="text-[22px] font-bold tracking-tight w-full text-center">Goals</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-32 space-y-6 overscroll-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        
        {/* PHẦN 1: MONTHLY GOALS */}
        <div className="animate-ios-slide">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[#8e8e93] text-[12px] font-bold uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <CalendarDays size={14} /> Specific Month
            </h3>
            <div className={`flex items-center justify-between rounded-full px-2 py-0.5 shadow-sm ${theme === 'dark' ? 'bg-[#1c1c1e]' : 'bg-white'}`}>
              <button onClick={() => setOffset(o => o - 1)} className="p-1 text-[#32ade6] active:opacity-50"><ChevronLeft size={16}/></button>
              <span className="text-[12px] font-bold tracking-wide px-2">{bounds.label}</span>
              <button onClick={() => setOffset(o => o + 1)} className="p-1 text-[#32ade6] active:opacity-50"><ChevronRight size={16}/></button>
            </div>
          </div>

          <div className={`rounded-3xl overflow-hidden shadow-sm ${theme === 'dark' ? 'bg-[#1c1c1e]' : 'bg-white'}`}>
            <div className={`flex items-center px-4 py-3 border-b ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
              <TrendingDown size={20} className="text-[#ff453a] mr-3" />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-[#8e8e93] uppercase mb-0.5">Expense Budget</p>
                <div className="flex items-center">
                  <span className="font-bold text-[#ff453a] mr-1.5">₫</span>
                  <input type="text" inputMode="numeric" placeholder="0" value={monthlyBudget} onChange={(e) => handleInput(e.target.value, setMonthlyBudget)} className={`bg-transparent outline-none font-bold text-[17px] w-full ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                </div>
              </div>
            </div>
            <div className="flex items-center px-4 py-3">
              <TrendingUp size={20} className="text-[#32d74b] mr-3" />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-[#8e8e93] uppercase mb-0.5">Income Goal</p>
                <div className="flex items-center">
                  <span className="font-bold text-[#32d74b] mr-1.5">₫</span>
                  <input type="text" inputMode="numeric" placeholder="0" value={monthlyIncome} onChange={(e) => handleInput(e.target.value, setMonthlyIncome)} className={`bg-transparent outline-none font-bold text-[17px] w-full ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PHẦN 2: GLOBAL GOALS */}
        <div className="animate-ios-slide" style={{ animationDelay: '0.05s' }}>
          <div className="mb-3">
            <h3 className="text-[#8e8e93] text-[12px] font-bold uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <Globe size={14} /> Default Goals (All Months)
            </h3>
            <p className="text-[#8e8e93] text-[11px] font-medium ml-1 mt-1 leading-tight">Applied automatically if a specific month is not set.</p>
          </div>

          <div className={`rounded-3xl overflow-hidden shadow-sm ${theme === 'dark' ? 'bg-[#1c1c1e]' : 'bg-white'}`}>
            <div className={`flex items-center px-4 py-3 border-b ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
              <TrendingDown size={20} className="text-[#ff453a] mr-3" />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-[#8e8e93] uppercase mb-0.5">Default Expense Budget</p>
                <div className="flex items-center">
                  <span className="font-bold text-[#ff453a] mr-1.5">₫</span>
                  <input type="text" inputMode="numeric" placeholder="0" value={globalBudget} onChange={(e) => handleInput(e.target.value, setGlobalBudget)} className={`bg-transparent outline-none font-bold text-[17px] w-full ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                </div>
              </div>
            </div>
            <div className="flex items-center px-4 py-3">
              <TrendingUp size={20} className="text-[#32d74b] mr-3" />
              <div className="flex-1">
                <p className="text-[11px] font-bold text-[#8e8e93] uppercase mb-0.5">Default Income Goal</p>
                <div className="flex items-center">
                  <span className="font-bold text-[#32d74b] mr-1.5">₫</span>
                  <input type="text" inputMode="numeric" placeholder="0" value={globalIncome} onChange={(e) => handleInput(e.target.value, setGlobalIncome)} className={`bg-transparent outline-none font-bold text-[17px] w-full ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NÚT SAVE */}
        <button 
          onClick={handleSave} 
          className={`w-full py-3.5 mt-4 rounded-full font-bold text-[17px] active:scale-[0.98] transition-transform animate-ios-slide shadow-sm ${theme === 'dark' ? 'bg-[#32ade6] text-black' : 'bg-black text-white'}`}
          style={{ animationDelay: '0.1s' }}
        >
          Save All Goals
        </button>

      </div>

      {/* THÔNG BÁO LƯU THÀNH CÔNG */}
      <div 
        className={`fixed top-12 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full flex items-center gap-2 font-semibold shadow-xl transition-all duration-300 z-50 pointer-events-none ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'} ${theme === 'dark' ? 'bg-[#2c2c2e] text-white' : 'bg-white text-black'}`}
      >
        <CheckCircle2 size={20} className="text-[#32d74b]" />
        Goals updated!
      </div>

    </div>
  );
}