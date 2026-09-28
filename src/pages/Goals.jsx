import { useAppContext } from '../AppContext';
import { Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function Goals() {
  const { monthlyBudget, setMonthlyBudget, monthlyIncomeGoal, setMonthlyIncomeGoal, setIsModalOpen, theme, cycleStartDay } = useAppContext();
  const [editingType, setEditingType] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [transactions, setTransactions] = useState([]);

  // Lấy dữ liệu thực tế từ Firebase
  useEffect(() => {
    const q = query(collection(db, 'transactions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    });
    return () => unsubscribe();
  }, []);

  // Tính toán chu kỳ hiện tại
  const getCycleBounds = () => {
    const base = new Date();
    let start = new Date(base.getFullYear(), base.getMonth(), cycleStartDay);
    if (base.getDate() < cycleStartDay) start.setMonth(start.getMonth() - 1);
    let end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    return { start, end };
  };

  const bounds = getCycleBounds();
  
  // Tính tổng thu / chi thực tế trong chu kỳ
  let totalExpense = 0;
  let totalIncome = 0;

  transactions.forEach(t => {
    if (!t.date) return;
    const d = new Date(t.date);
    if (d >= bounds.start && d < bounds.end) {
      if (t.type === 'expense') totalExpense += t.amount;
      else if (t.type === 'income') totalIncome += t.amount;
    }
  });

  // Tính phần trăm độ dài của thanh màu (Tối đa 100%)
  const expensePercent = monthlyBudget > 0 ? Math.min((totalExpense / monthlyBudget) * 100, 100) : 0;
  const incomePercent = monthlyIncomeGoal > 0 ? Math.min((totalIncome / monthlyIncomeGoal) * 100, 100) : 0;

  const openEdit = (type, currentVal) => { setEditingType(type); setTempValue(currentVal.toString()); setIsModalOpen(true); };
  const closeEdit = () => { setEditingType(null); setIsModalOpen(false); };
  const handleSave = () => { const val = Number(tempValue.replace(/\./g, '')); if (editingType === 'expense') setMonthlyBudget(val || 0); else setMonthlyIncomeGoal(val || 0); closeEdit(); };
  const formatCurrency = (val) => { return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."); };

  return (
    <div className={`h-[100dvh] w-full flex flex-col relative overflow-hidden animate-ios-page ${theme === 'dark' ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'}`}>
      
      <div 
        className={`flex-shrink-0 z-40 px-4 pb-3 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] ${theme === 'dark' ? 'bg-black/90 shadow-[0_1px_0_0_rgba(255,255,255,0.05)] text-white' : 'bg-[#f2f2f7]/90 text-black'}`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <h1 className="text-[22px] font-bold w-full text-center tracking-tight">Goals</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-4 overscroll-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className={`rounded-2xl p-5 ${theme === 'dark' ? 'bg-[#1c1c1e]' : 'bg-white shadow-sm'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[#8e8e93] text-sm font-semibold">Expense Budget</span>
            <button onClick={() => openEdit('expense', monthlyBudget)} className="text-[#8e8e93] p-1 active:opacity-50"><Edit2 size={16} /></button>
          </div>
          <div className="text-[26px] font-bold tracking-tight mb-2">₫{monthlyBudget.toLocaleString('vi-VN')}</div>
          
          <div className="flex justify-between text-xs text-[#8e8e93] mb-2 font-medium">
            <span>Spent: ₫{totalExpense.toLocaleString('vi-VN')}</span>
            <span>{Math.round(expensePercent)}%</span>
          </div>
          
          <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#2c2c2e]' : 'bg-gray-200'}`}>
            <div className="h-full bg-[#ff453a] rounded-full transition-all duration-500 ease-out" style={{ width: `${expensePercent}%` }}></div>
          </div>
        </div>

        <div className={`rounded-2xl p-5 ${theme === 'dark' ? 'bg-[#1c1c1e]' : 'bg-white shadow-sm'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[#8e8e93] text-sm font-semibold">Income Goal</span>
            <button onClick={() => openEdit('income', monthlyIncomeGoal)} className="text-[#8e8e93] p-1 active:opacity-50"><Edit2 size={16} /></button>
          </div>
          <div className="text-[26px] font-bold tracking-tight mb-2">₫{monthlyIncomeGoal.toLocaleString('vi-VN')}</div>
          
          <div className="flex justify-between text-xs text-[#8e8e93] mb-2 font-medium">
            <span>Earned: ₫{totalIncome.toLocaleString('vi-VN')}</span>
            <span>{Math.round(incomePercent)}%</span>
          </div>

          <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-[#2c2c2e]' : 'bg-gray-200'}`}>
            <div className="h-full bg-[#32d74b] rounded-full transition-all duration-500 ease-out" style={{ width: `${incomePercent}%` }}></div>
          </div>
        </div>
      </div>

      {editingType && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-ios-fade" onClick={closeEdit}>
          <div className={`w-full max-w-[300px] rounded-3xl p-6 shadow-2xl ${theme === 'dark' ? 'bg-[#2c2c2e]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold text-center mb-6 text-lg">Edit {editingType === 'expense' ? 'Budget' : 'Income Goal'}</h2>
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8e93] text-lg font-bold">₫</span>
              <input type="text" inputMode="numeric" value={formatCurrency(tempValue)} onChange={(e) => setTempValue(e.target.value.replace(/\./g, ''))} className={`w-full text-lg font-bold rounded-xl pl-10 pr-4 py-3 outline-none ${theme === 'dark' ? 'bg-[#1c1c1e] text-white' : 'bg-gray-100 text-black'}`} />
            </div>
            <div className="flex gap-3">
              <button onClick={closeEdit} className={`flex-1 py-3 rounded-2xl font-bold ${theme === 'dark' ? 'bg-[#3a3a3c] text-white' : 'bg-gray-200 text-black'}`}>Cancel</button>
              <button onClick={handleSave} className={`flex-1 py-3 rounded-2xl font-bold ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}