import { useState, useEffect } from "react";
import { useAppContext } from "../AppContext";
import { Pencil, X } from "lucide-react";

export default function Goals() {
  const { theme, cycleStartDay } = useAppContext();

  // Dữ liệu mục tiêu
  const [globalBudget, setGlobalBudget] = useState(0);
  const [globalIncome, setGlobalIncome] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [monthlyIncome, setMonthlyIncome] = useState(null);

  // Dữ liệu chi tiêu thực tế trong tháng
  const [spent, setSpent] = useState(0);
  const [earned, setEarned] = useState(0);

  // State Modal chỉnh sửa
  const [editState, setEditState] = useState({
    isOpen: false,
    type: "",
    title: "",
    value: "",
  });

  const getCurrentMonthKey = () => {
    const base = new Date();
    let currentStart = new Date(
      base.getFullYear(),
      base.getMonth(),
      cycleStartDay,
    );
    if (base.getDate() < cycleStartDay) {
      currentStart.setMonth(currentStart.getMonth() - 1);
    }
    return `${currentStart.getFullYear()}-${(currentStart.getMonth() + 1).toString().padStart(2, "0")}`;
  };

  const currentMonthKey = getCurrentMonthKey();

  useEffect(() => {
    const gGoals = JSON.parse(
      localStorage.getItem("vys_global_goals") ||
        '{"budget": 9500000, "income": 10000000}',
    );
    setGlobalBudget(gGoals.budget);
    setGlobalIncome(gGoals.income);

    const mGoals = JSON.parse(
      localStorage.getItem("vys_monthly_goals") || "{}",
    );
    if (mGoals[currentMonthKey]) {
      setMonthlyBudget(mGoals[currentMonthKey].budget);
      setMonthlyIncome(mGoals[currentMonthKey].income);
    } else {
      setMonthlyBudget(null);
      setMonthlyIncome(null);
    }

    const transactions = JSON.parse(
      localStorage.getItem("vys_transactions") || "[]",
    );
    const base = new Date();
    let start = new Date(base.getFullYear(), base.getMonth(), cycleStartDay);
    if (base.getDate() < cycleStartDay) start.setMonth(start.getMonth() - 1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    let totalSpent = 0;
    let totalEarned = 0;

    transactions.forEach((t) => {
      if (t.date) {
        const d = new Date(t.date);
        if (d >= start && d < end) {
          if (t.type === "expense") totalSpent += t.amount;
          if (t.type === "income") totalEarned += t.amount;
        }
      }
    });

    setSpent(totalSpent);
    setEarned(totalEarned);
  }, [currentMonthKey, cycleStartDay, editState.isOpen]);

  const activeBudget = monthlyBudget !== null ? monthlyBudget : globalBudget;
  const activeIncome = monthlyIncome !== null ? monthlyIncome : globalIncome;

  const spentPercent =
    activeBudget > 0
      ? Math.min(Math.round((spent / activeBudget) * 100), 100)
      : 0;
  const earnedPercent =
    activeIncome > 0
      ? Math.min(Math.round((earned / activeIncome) * 100), 100)
      : 0;

  // Tính tiến độ cho phần Target All
  const globalSpentPercent =
    globalBudget > 0
      ? Math.min(Math.round((spent / globalBudget) * 100), 100)
      : 0;
  const globalEarnedPercent =
    globalIncome > 0
      ? Math.min(Math.round((earned / globalIncome) * 100), 100)
      : 0;

  const openEdit = (type, currentVal) => {
    let title = "";
    if (type === "m_budget") title = "Edit Expense Budget";
    if (type === "m_income") title = "Edit Income Goal";
    if (type === "g_budget") title = "Edit Default Budget (All)";
    if (type === "g_income") title = "Edit Default Income (All)";

    setEditState({
      isOpen: true,
      type,
      title,
      value: currentVal ? currentVal.toLocaleString("vi-VN") : "",
    });
  };

  const handleInput = (val) => {
    const raw = val.replace(/\./g, "").replace(/\D/g, "");
    if (!raw) {
      setEditState({ ...editState, value: "" });
      return;
    }
    setEditState({ ...editState, value: Number(raw).toLocaleString("vi-VN") });
  };

  const handleSave = () => {
    const numValue = Number(editState.value.replace(/\./g, ""));

    if (editState.type.startsWith("g_")) {
      const gGoals = { budget: globalBudget, income: globalIncome };
      if (editState.type === "g_budget") gGoals.budget = numValue;
      if (editState.type === "g_income") gGoals.income = numValue;
      localStorage.setItem("vys_global_goals", JSON.stringify(gGoals));
    } else {
      const mGoals = JSON.parse(
        localStorage.getItem("vys_monthly_goals") || "{}",
      );
      if (!mGoals[currentMonthKey])
        mGoals[currentMonthKey] = { budget: null, income: null };
      if (editState.type === "m_budget")
        mGoals[currentMonthKey].budget = numValue;
      if (editState.type === "m_income")
        mGoals[currentMonthKey].income = numValue;
      localStorage.setItem("vys_monthly_goals", JSON.stringify(mGoals));
    }

    setEditState({ ...editState, isOpen: false });
  };

  return (
    <>
      <div
        className={`h-[100dvh] w-full flex flex-col relative overflow-hidden animate-ios-page ${theme === "dark" ? "bg-black text-white" : "bg-[#f2f2f7] text-black"}`}
      >
        <div
          className={`flex-shrink-0 z-40 px-4 pb-3 flex flex-col justify-end shadow-[0_1px_0_0_rgba(0,0,0,0.05)] relative ${theme === "dark" ? "bg-black/90 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]" : "bg-[#f2f2f7]/90"}`}
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <h1 className="text-[22px] font-bold tracking-tight w-full text-center">
            Goals
          </h1>
        </div>

        <div
          className="flex-1 overflow-y-auto px-4 pt-4 pb-32 space-y-4 overscroll-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* SECTION: TARGET (MONTH) */}
          <div className="pt-2 pb-1">
            <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest ml-2 mb-1">
              Target (Month)
            </h3>
            <p className="text-[#8e8e93] text-[11px] font-medium ml-2 leading-tight">
              Specific goals set for the current month.
            </p>
          </div>

          <div
            className={`p-5 rounded-[24px] shadow-sm relative ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[13px] font-semibold text-[#8e8e93]">
                Expense Budget
              </span>
              <button
                onClick={() => openEdit("m_budget", activeBudget)}
                className="text-[#8e8e93] active:opacity-50 p-1"
              >
                <Pencil size={16} />
              </button>
            </div>
            <div className="text-[28px] font-bold mb-4 tracking-tight">
              ₫{activeBudget.toLocaleString("vi-VN")}
            </div>
            <div className="flex justify-between text-[12px] text-[#8e8e93] font-medium mb-2">
              <span>Spent: ₫{spent.toLocaleString("vi-VN")}</span>
              <span>{spentPercent}%</span>
            </div>
            <div
              className={`h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${spentPercent >= 100 ? "bg-[#ff453a]" : "bg-gray-300"}`}
                style={{ width: `${spentPercent}%` }}
              ></div>
            </div>
          </div>

          <div
            className={`p-5 rounded-[24px] shadow-sm relative ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[13px] font-semibold text-[#8e8e93]">
                Income Goal
              </span>
              <button
                onClick={() => openEdit("m_income", activeIncome)}
                className="text-[#8e8e93] active:opacity-50 p-1"
              >
                <Pencil size={16} />
              </button>
            </div>
            <div className="text-[28px] font-bold mb-4 tracking-tight">
              ₫{activeIncome.toLocaleString("vi-VN")}
            </div>
            <div className="flex justify-between text-[12px] text-[#8e8e93] font-medium mb-2">
              <span>Earned: ₫{earned.toLocaleString("vi-VN")}</span>
              <span>{earnedPercent}%</span>
            </div>
            <div
              className={`h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${earnedPercent >= 100 ? "bg-[#32d74b]" : "bg-gray-300"}`}
                style={{ width: `${earnedPercent}%` }}
              ></div>
            </div>
          </div>

          {/* SECTION: TARGET (ALL) */}
          <div className="pt-6 pb-1">
            <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest ml-2 mb-1">
              Target (All)
            </h3>
            <p className="text-[#8e8e93] text-[11px] font-medium ml-2 leading-tight">
              These values apply if a specific month is not configured.
            </p>
          </div>

          <div
            className={`p-5 rounded-[24px] shadow-sm relative ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[13px] font-semibold text-[#8e8e93]">
                Default Expense Budget
              </span>
              <button
                onClick={() => openEdit("g_budget", globalBudget)}
                className="text-[#8e8e93] active:opacity-50 p-1"
              >
                <Pencil size={16} />
              </button>
            </div>
            <div className="text-[28px] font-bold mb-4 tracking-tight">
              ₫{globalBudget.toLocaleString("vi-VN")}
            </div>
            <div className="flex justify-between text-[12px] text-[#8e8e93] font-medium mb-2">
              <span>Spent: ₫{spent.toLocaleString("vi-VN")}</span>
              <span>{globalSpentPercent}%</span>
            </div>
            <div
              className={`h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${globalSpentPercent >= 100 ? "bg-[#ff453a]" : "bg-gray-300"}`}
                style={{ width: `${globalSpentPercent}%` }}
              ></div>
            </div>
          </div>

          <div
            className={`p-5 rounded-[24px] shadow-sm relative ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[13px] font-semibold text-[#8e8e93]">
                Default Income Goal
              </span>
              <button
                onClick={() => openEdit("g_income", globalIncome)}
                className="text-[#8e8e93] active:opacity-50 p-1"
              >
                <Pencil size={16} />
              </button>
            </div>
            <div className="text-[28px] font-bold mb-4 tracking-tight">
              ₫{globalIncome.toLocaleString("vi-VN")}
            </div>
            <div className="flex justify-between text-[12px] text-[#8e8e93] font-medium mb-2">
              <span>Earned: ₫{earned.toLocaleString("vi-VN")}</span>
              <span>{globalEarnedPercent}%</span>
            </div>
            <div
              className={`h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${globalEarnedPercent >= 100 ? "bg-[#32d74b]" : "bg-gray-300"}`}
                style={{ width: `${globalEarnedPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {editState.isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-[60] flex flex-col justify-end animate-ios-fade"
          onClick={() => setEditState({ ...editState, isOpen: false })}
        >
          <div
            className={`w-full max-w-md mx-auto rounded-t-[32px] p-6 shadow-2xl pb-10 animate-ios-slide ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg">{editState.title}</h2>
              <button
                onClick={() => setEditState({ ...editState, isOpen: false })}
                className={`p-1.5 rounded-full ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-100 text-black"}`}
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={`flex items-center rounded-2xl px-4 py-2 mb-6 ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
            >
              <span
                className={`text-xl font-bold mr-2 ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                ₫
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder="0"
                value={editState.value}
                onChange={(e) => handleInput(e.target.value)}
                className={`flex-1 bg-transparent py-3 outline-none font-bold text-[22px] w-full ${theme === "dark" ? "text-white" : "text-black"}`}
              />
            </div>

            <button
              onClick={handleSave}
              className={`w-full py-3.5 rounded-2xl font-bold text-[17px] active:scale-[0.98] transition-transform ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
            >
              Save Goal
            </button>
          </div>
        </div>
      )}
    </>
  );
}
