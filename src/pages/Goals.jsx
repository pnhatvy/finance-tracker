import { useState, useEffect } from "react";
import { useAppContext } from "../AppContext";
import { Pencil, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function Goals() {
  const { theme, cycleStartDay } = useAppContext();

  // Dữ liệu mục tiêu
  const [globalBudget, setGlobalBudget] = useState(0);
  const [globalIncome, setGlobalIncome] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [monthlyIncome, setMonthlyIncome] = useState(null);

  // Điều hướng tháng
  const [offset, setOffset] = useState(0);

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

  // CẢM BIẾN BÀN PHÍM
  const [isInputFocused, setIsInputFocused] = useState(false);

  const getPeriodBounds = () => {
    const base = new Date();
    let currentStart = new Date(
      base.getFullYear(),
      base.getMonth(),
      cycleStartDay,
    );
    if (base.getDate() < cycleStartDay) {
      currentStart.setMonth(currentStart.getMonth() - 1);
    }
    currentStart.setMonth(currentStart.getMonth() + offset);

    const start = new Date(currentStart);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let label = "";
    if (cycleStartDay === 1) {
      label = `${months[start.getMonth()]} ${start.getFullYear()}`;
    } else {
      let endLabel = new Date(end);
      endLabel.setDate(endLabel.getDate() - 1);
      label = `${months[start.getMonth()]} ${start.getDate()} - ${months[endLabel.getMonth()]} ${endLabel.getDate()}`;
    }

    const key = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, "0")}`;
    return { start, end, label, key };
  };

  const bounds = getPeriodBounds();

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
    if (mGoals[bounds.key]) {
      setMonthlyBudget(mGoals[bounds.key].budget);
      setMonthlyIncome(mGoals[bounds.key].income);
    } else {
      setMonthlyBudget(null);
      setMonthlyIncome(null);
    }

    const transactions = JSON.parse(
      localStorage.getItem("vys_transactions") || "[]",
    );
    let totalSpent = 0;
    let totalEarned = 0;

    transactions.forEach((t) => {
      if (t.date) {
        const d = new Date(t.date);
        if (d >= bounds.start && d < bounds.end) {
          if (t.type === "expense") totalSpent += t.amount;
          if (t.type === "income") totalEarned += t.amount;
        }
      }
    });

    setSpent(totalSpent);
    setEarned(totalEarned);
  }, [bounds.key, cycleStartDay, editState.isOpen]);

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

  const globalEarnedPercent =
    globalIncome > 0
      ? Math.min(Math.round((earned / globalIncome) * 100), 100)
      : 0;

  const openEdit = (type, currentVal) => {
    let title = "";
    if (type === "m_budget") title = "Edit Expense Budget";
    if (type === "m_income") title = "Edit Income Goal";
    if (type === "g_income") title = "Edit Overall Income Goal";

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
      if (editState.type === "g_income") gGoals.income = numValue;
      localStorage.setItem("vys_global_goals", JSON.stringify(gGoals));
    } else {
      const mGoals = JSON.parse(
        localStorage.getItem("vys_monthly_goals") || "{}",
      );
      if (!mGoals[bounds.key])
        mGoals[bounds.key] = { budget: null, income: null };
      if (editState.type === "m_budget") mGoals[bounds.key].budget = numValue;
      if (editState.type === "m_income") mGoals[bounds.key].income = numValue;
      localStorage.setItem("vys_monthly_goals", JSON.stringify(mGoals));
    }

    setEditState({ ...editState, isOpen: false });
    setIsInputFocused(false);
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
          <div className="flex justify-between items-center pt-2 pb-0">
            <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest ml-2">
              Monthly Target
            </h3>
            <div
              className={`flex items-center rounded-full px-2 py-0.5 shadow-sm mr-1 ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
            >
              <button
                onClick={() => setOffset((o) => o - 1)}
                className="p-1 text-[#32ade6] active:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[11px] font-bold px-2">{bounds.label}</span>
              <button
                onClick={() => setOffset((o) => o + 1)}
                className="p-1 text-[#32ade6] active:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
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
            <div className="text-[28px] font-bold mb-1.5 tracking-tight">
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
            <div className="text-[28px] font-bold mb-1.5 tracking-tight">
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

          <div className="pt-5 pb-0">
            <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest ml-2 mb-2">
              Overall Target
            </h3>
          </div>

          <div
            className={`p-5 rounded-[24px] shadow-sm relative ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[13px] font-semibold text-[#8e8e93]">
                Income Goal
              </span>
              <button
                onClick={() => openEdit("g_income", globalIncome)}
                className="text-[#8e8e93] active:opacity-50 p-1"
              >
                <Pencil size={16} />
              </button>
            </div>
            <div className="text-[28px] font-bold mb-1.5 tracking-tight">
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
          className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4 animate-ios-fade"
          onClick={() => {
            setEditState({ ...editState, isOpen: false });
            setIsInputFocused(false);
          }}
        >
          {/* SỬ DỤNG TRANSLATE ĐỂ ĐẨY MODAL LÊN KHI CÓ BÀN PHÍM */}
          <div
            className={`w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl transition-transform duration-300 ease-out ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"} ${isInputFocused ? "-translate-y-28" : "translate-y-0"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className={`font-bold text-lg ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                {editState.title}
              </h2>
              <button
                onClick={() => {
                  setEditState({ ...editState, isOpen: false });
                  setIsInputFocused(false);
                }}
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
                onFocus={() => setIsInputFocused(true)} // Khi nhấp vào input -> đẩy Modal lên
                onBlur={() => setIsInputFocused(false)} // Khi mất focus -> thả Modal về giữa
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
