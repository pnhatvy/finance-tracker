import { useState, useEffect } from "react";
import { useAppContext } from "../AppContext";
import {
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Goals() {
  const { theme, cycleStartDay } = useAppContext();

  const [monthlyBudget, setMonthlyBudget] = useState(null);
  const [monthlyIncome, setMonthlyIncome] = useState(null);
  const [offset, setOffset] = useState(0);
  const [spent, setSpent] = useState(0);
  const [earned, setEarned] = useState(0);

  const [globalIncomeGoal, setGlobalIncomeGoal] = useState(10000000);
  const [initialBalance, setInitialBalance] = useState(0);
  const [historicalNetWorth, setHistoricalNetWorth] = useState(0);
  const [avgMonthlySpend, setAvgMonthlySpend] = useState(0);

  const [showMonthly, setShowMonthly] = useState(() => {
    const saved = localStorage.getItem("vys_show_monthly");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showOverall, setShowOverall] = useState(() => {
    const saved = localStorage.getItem("vys_show_overall");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [editState, setEditState] = useState({
    isOpen: false,
    type: "",
    title: "",
    value: "",
    scope: "all",
  });

  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    localStorage.setItem("vys_show_monthly", JSON.stringify(showMonthly));
  }, [showMonthly]);
  useEffect(() => {
    localStorage.setItem("vys_show_overall", JSON.stringify(showOverall));
  }, [showOverall]);

  const getPeriodBounds = () => {
    const base = new Date();
    let currentStart = new Date(
      base.getFullYear(),
      base.getMonth(),
      cycleStartDay,
    );
    if (base.getDate() < cycleStartDay)
      currentStart.setMonth(currentStart.getMonth() - 1);
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
    if (cycleStartDay === 1)
      label = `${months[start.getMonth()]} ${start.getFullYear()}`;
    else {
      let endLabel = new Date(end);
      endLabel.setDate(endLabel.getDate() - 1);
      label = `${months[start.getMonth()]} ${start.getDate()} - ${months[endLabel.getMonth()]} ${endLabel.getDate()}`;
    }

    const key = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, "0")}`;
    return { start, end, label, key };
  };

  const bounds = getPeriodBounds();

  useEffect(() => {
    const calcAutoBudgetFromLimits = () => {
      const gLimits = JSON.parse(
        localStorage.getItem("vys_category_limits") || "{}",
      );
      const mLimitsData = JSON.parse(
        localStorage.getItem("vys_monthly_category_limits") || "{}",
      );
      const currentLocalLimits = mLimitsData[bounds.key] || {};

      let sum = 0;
      const mergedLimits = { ...gLimits, ...currentLocalLimits };
      Object.values(mergedLimits).forEach((val) => {
        sum += Number(val) || 0;
      });
      return sum;
    };

    const mGoals = JSON.parse(
      localStorage.getItem("vys_monthly_goals") || "{}",
    );

    // Ưu tiên đọc budget ghi đè riêng của tháng này. Nếu không có mới xài Auto Sum
    if (mGoals[bounds.key] && mGoals[bounds.key].budget !== undefined) {
      setMonthlyBudget(mGoals[bounds.key].budget);
    } else {
      setMonthlyBudget(calcAutoBudgetFromLimits());
    }

    if (mGoals[bounds.key]) {
      setMonthlyIncome(
        mGoals[bounds.key].income !== undefined
          ? mGoals[bounds.key].income
          : null,
      );
    } else {
      setMonthlyIncome(null);
    }

    const transactions = JSON.parse(
      localStorage.getItem("vys_transactions") || "[]",
    );
    let totalSpentMonth = 0;
    let totalEarnedMonth = 0;

    transactions.forEach((t) => {
      const amount = Number(t.amount) || 0;
      if (t.date) {
        const d = new Date(t.date);
        if (d >= bounds.start && d < bounds.end) {
          if (t.type === "expense") totalSpentMonth += amount;
          if (t.type === "income") totalEarnedMonth += amount;
        }
      }
    });

    setSpent(totalSpentMonth);
    setEarned(totalEarnedMonth);
  }, [bounds.key, cycleStartDay, editState.isOpen]);

  useEffect(() => {
    const gGoals = JSON.parse(
      localStorage.getItem("vys_global_goals_history") || "{}",
    );
    let currentGlobalIncome = 10000000;

    if (gGoals[bounds.key] && gGoals[bounds.key].income !== undefined) {
      currentGlobalIncome = gGoals[bounds.key].income;
    } else {
      const oldGlob = JSON.parse(
        localStorage.getItem("vys_global_goals") || '{"income": 10000000}',
      );
      currentGlobalIncome =
        oldGlob.income !== undefined ? oldGlob.income : 10000000;
    }

    const currentInitBal = Number(
      localStorage.getItem("vys_initial_balance") || 0,
    );
    setGlobalIncomeGoal(currentGlobalIncome);
    setInitialBalance(currentInitBal);

    const transactions = JSON.parse(
      localStorage.getItem("vys_transactions") || "[]",
    );
    let cumulativeEarned = 0;
    let cumulativeSpent = 0;
    let totalExpenseAllTime = 0;
    let firstDate = new Date();

    transactions.forEach((t) => {
      const amount = Number(t.amount) || 0;
      if (t.date) {
        const d = new Date(t.date);
        if (d < firstDate) firstDate = d;
        if (d < bounds.end) {
          if (t.type === "expense") cumulativeSpent += amount;
          if (t.type === "income") cumulativeEarned += amount;
        }
        if (t.type === "expense") totalExpenseAllTime += amount;
      }
    });

    setHistoricalNetWorth(currentInitBal + cumulativeEarned - cumulativeSpent);

    const now = new Date();
    const monthsActive = Math.max(
      1,
      (now.getFullYear() - firstDate.getFullYear()) * 12 +
        now.getMonth() -
        firstDate.getMonth() +
        1,
    );
    setAvgMonthlySpend(totalExpenseAllTime / monthsActive);
  }, [bounds.key, cycleStartDay, editState.isOpen]);

  const activeBudget = monthlyBudget || 0;
  const activeIncome =
    monthlyIncome !== null && monthlyIncome !== "" ? monthlyIncome : 10000000;

  const spentPercent =
    activeBudget > 0 ? Math.round((spent / activeBudget) * 100) : 0;
  const earnedPercent =
    activeIncome > 0 ? Math.round((earned / activeIncome) * 100) : 0;
  const overallPercent =
    globalIncomeGoal > 0
      ? Math.max(0, Math.round((historicalNetWorth / globalIncomeGoal) * 100))
      : 0;
  const runwayMonths =
    avgMonthlySpend > 0 && historicalNetWorth > 0
      ? (historicalNetWorth / avgMonthlySpend).toFixed(1)
      : 0;

  const now = new Date();
  let expectedPacePercent = 0;
  let isCurrentCycle = false;

  if (now >= bounds.start && now < bounds.end) {
    isCurrentCycle = true;
    const totalDays = Math.round((bounds.end - bounds.start) / 86400000);
    const daysPassed = Math.floor((now - bounds.start) / 86400000) + 1;
    expectedPacePercent = (daysPassed / totalDays) * 100;
  }

  const openEdit = (type, currentVal) => {
    let title = "";
    if (type === "m_budget") title = "Edit Monthly Budget";
    if (type === "m_income") title = "Edit Monthly Income";
    if (type === "g_income") title = "Edit Wallets Goal";
    if (type === "g_initial") title = "Set Initial Balance";

    setEditState({
      isOpen: true,
      type,
      title,
      value: currentVal ? currentVal.toLocaleString("vi-VN") : "",
      scope: type === "m_budget" ? "month" : "all", // Mặc định m_budget là chỉ cho tháng này
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
    const numValue =
      editState.value === "" ? 0 : Number(editState.value.replace(/\./g, ""));
    const applyToFuture = editState.scope === "all";

    if (editState.type === "g_initial") {
      localStorage.setItem("vys_initial_balance", numValue);
      setInitialBalance(numValue);
    } else if (editState.type === "g_income") {
      const gGoals = JSON.parse(
        localStorage.getItem("vys_global_goals_history") || "{}",
      );
      if (applyToFuture) {
        const baseDate = new Date(bounds.start);
        for (let i = 0; i < 120; i++) {
          const d = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth() + i,
            1,
          );
          const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
          if (!gGoals[key]) gGoals[key] = { income: null };
          gGoals[key].income = numValue;
        }
        const oldGlob = JSON.parse(
          localStorage.getItem("vys_global_goals") || "{}",
        );
        oldGlob.income = numValue;
        localStorage.setItem("vys_global_goals", JSON.stringify(oldGlob));
      } else {
        if (!gGoals[bounds.key]) gGoals[bounds.key] = { income: null };
        gGoals[bounds.key].income = numValue;
      }
      localStorage.setItem("vys_global_goals_history", JSON.stringify(gGoals));
      setGlobalIncomeGoal(numValue);
    } else if (editState.type === "m_income") {
      const mGoals = JSON.parse(
        localStorage.getItem("vys_monthly_goals") || "{}",
      );
      if (applyToFuture) {
        const baseDate = new Date(bounds.start);
        for (let i = 0; i < 120; i++) {
          const d = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth() + i,
            1,
          );
          const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
          if (!mGoals[key]) mGoals[key] = { budget: null, income: null };
          mGoals[key].income = numValue;
        }
      } else {
        if (!mGoals[bounds.key])
          mGoals[bounds.key] = { budget: null, income: null };
        mGoals[bounds.key].income = numValue;
      }
      localStorage.setItem("vys_monthly_goals", JSON.stringify(mGoals));
      setMonthlyIncome(numValue);
    } else if (editState.type === "m_budget") {
      const mGoals = JSON.parse(
        localStorage.getItem("vys_monthly_goals") || "{}",
      );
      if (numValue === 0) {
        // Nhập 0 hoặc xóa trắng -> Xóa ghi đè, trả về xài chung Auto-sum
        if (mGoals[bounds.key]) delete mGoals[bounds.key].budget;
      } else {
        if (!mGoals[bounds.key])
          mGoals[bounds.key] = { budget: null, income: null };
        mGoals[bounds.key].budget = numValue;
      }
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
          <div className="flex justify-between items-center pb-0">
            <div className="flex items-center gap-2 ml-2">
              <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest">
                Monthly Target
              </h3>
              <button
                onClick={() => setShowMonthly(!showMonthly)}
                className="text-[#8e8e93] active:opacity-50 p-1"
              >
                {showMonthly ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
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
              {/* KHÔI PHỤC LẠI NÚT BÚT CHÌ VÀ BỎ DÒNG TEXT AUTO-SUM */}
              <button
                onClick={() => openEdit("m_budget", activeBudget)}
                className="text-[#8e8e93] active:opacity-50 p-1"
              >
                <Pencil size={16} />
              </button>
            </div>
            <div className="text-[28px] font-bold mb-1.5 tracking-tight">
              {showMonthly
                ? `₫${activeBudget.toLocaleString("vi-VN")}`
                : "****"}
            </div>
            <div className="flex justify-between text-[12px] text-[#8e8e93] font-medium mb-2">
              <span>
                Spent:{" "}
                {showMonthly ? `₫${spent.toLocaleString("vi-VN")}` : "****"}
              </span>
              <span
                className={spentPercent > 100 ? "text-[#ff453a] font-bold" : ""}
              >
                {showMonthly ? `${spentPercent}%` : "**%"}
              </span>
            </div>
            <div
              className={`h-2 rounded-full relative ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
            >
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out ${spentPercent >= 100 ? "bg-[#ff453a]" : "bg-gray-300"}`}
                style={{ width: `${Math.min(spentPercent, 100)}%` }}
              ></div>
              {isCurrentCycle && (
                <div
                  className={`absolute top-[-3px] bottom-[-3px] w-[2px] rounded-full z-10 shadow-sm ${theme === "dark" ? "bg-white" : "bg-black"}`}
                  style={{
                    left: `${Math.min(expectedPacePercent, 100)}%`,
                    transform: "translateX(-50%)",
                  }}
                  title="Ideal pacing for today"
                ></div>
              )}
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
              {showMonthly
                ? `₫${activeIncome.toLocaleString("vi-VN")}`
                : "****"}
            </div>
            <div className="flex justify-between text-[12px] text-[#8e8e93] font-medium mb-2">
              <span>
                Earned:{" "}
                {showMonthly ? `₫${earned.toLocaleString("vi-VN")}` : "****"}
              </span>
              <span
                className={
                  earnedPercent >= 100 ? "text-[#32d74b] font-bold" : ""
                }
              >
                {showMonthly ? `${earnedPercent}%` : "**%"}
              </span>
            </div>
            <div
              className={`h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${earnedPercent >= 100 ? "bg-[#32d74b]" : "bg-gray-300"}`}
                style={{ width: `${Math.min(earnedPercent, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-2 pb-0 ml-2 -mt-1">
            <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest">
              Overall Target
            </h3>
            <button
              onClick={() => setShowOverall(!showOverall)}
              className="text-[#8e8e93] active:opacity-50 p-1"
            >
              {showOverall ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
          </div>

          <div
            className={`p-5 rounded-[24px] shadow-sm relative ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[13px] font-semibold text-[#8e8e93]">
                Wallets Goal
              </span>
              <button
                onClick={() => openEdit("g_income", globalIncomeGoal)}
                className="text-[#8e8e93] active:opacity-50 p-1"
              >
                <Pencil size={16} />
              </button>
            </div>
            <div className="text-[28px] font-bold mb-2 tracking-tight">
              {showOverall
                ? `₫${globalIncomeGoal.toLocaleString("vi-VN")}`
                : "****"}
            </div>
            <div className="flex justify-between items-center text-[12px] text-[#8e8e93] font-medium mb-2">
              <span className="flex items-center gap-1.5">
                Net Worth:{" "}
                <strong
                  className={
                    historicalNetWorth >= 0
                      ? "text-[#32d74b]"
                      : "text-[#ff453a]"
                  }
                >
                  {showOverall
                    ? `${historicalNetWorth < 0 ? "-" : ""}₫${Math.abs(historicalNetWorth).toLocaleString("vi-VN")}`
                    : "****"}
                </strong>
              </span>
              <span
                className={
                  overallPercent >= 100 ? "text-[#32d74b] font-bold" : ""
                }
              >
                {showOverall ? `${overallPercent}%` : "**%"}
              </span>
            </div>
            <div
              className={`h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${overallPercent >= 100 ? "bg-[#32d74b]" : "bg-gray-300"}`}
                style={{ width: `${Math.min(overallPercent, 100)}%` }}
              ></div>
            </div>
            {historicalNetWorth > 0 && avgMonthlySpend > 0 && (
              <div className="flex justify-between items-center text-[12px] text-[#8e8e93] mt-3 font-medium">
                <span>
                  Burn rate:{" "}
                  {showOverall
                    ? `₫${Math.round(avgMonthlySpend).toLocaleString("vi-VN")}/mo`
                    : "****"}
                </span>
                <span>
                  Runway: {showOverall ? `${runwayMonths} mos` : "****"}
                </span>
              </div>
            )}
            <button
              onClick={() => openEdit("g_initial", initialBalance)}
              className={`w-full flex justify-between items-center px-4 py-3 mt-4 rounded-xl cursor-pointer ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"} active:opacity-70 transition-opacity`}
            >
              <span className="text-[13px] font-semibold">
                Set Initial Balance
              </span>
              <ChevronRight size={16} className="text-[#8e8e93]" />
            </button>
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
          <div
            className={`w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl transition-transform duration-300 ease-out ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"} ${isInputFocused ? "-translate-y-12" : "translate-y-0"}`}
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

            {/* CHỈ ẨN CÁI THANH GẠT CHỌN THÁNG KHI LÀ INITIAL BALANCE HOẶC EXPENSE BUDGET */}
            {editState.type !== "g_initial" &&
              editState.type !== "m_budget" && (
                <div
                  className={`flex rounded-xl p-1 mb-5 w-full ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-200"}`}
                >
                  <button
                    onClick={() => setEditState({ ...editState, scope: "all" })}
                    className={`flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-colors duration-200 ${editState.scope === "all" ? (theme === "dark" ? "bg-[#3a3a3c] text-white" : "bg-white text-black shadow-sm") : theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
                  >
                    All Months
                  </button>
                  <button
                    onClick={() =>
                      setEditState({ ...editState, scope: "month" })
                    }
                    className={`flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-colors duration-200 ${editState.scope === "month" ? (theme === "dark" ? "bg-[#3a3a3c] text-white" : "bg-white text-black shadow-sm") : theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
                  >
                    This Month Only
                  </button>
                </div>
              )}

            <div className="relative w-full mb-6">
              <span
                className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                ₫
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={editState.value === "0" ? "" : editState.value}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onChange={(e) => handleInput(e.target.value)}
                className={`w-full rounded-2xl pl-10 pr-10 py-4 outline-none font-bold text-[24px] text-center ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-100 text-black"}`}
              />
              {editState.value !== "" && editState.value !== "0" && (
                <button
                  onClick={() => setEditState({ ...editState, value: "0" })}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#3a3a3c] text-[#8e8e93]" : "bg-gray-300 text-gray-600"}`}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              onClick={handleSave}
              className={`w-full py-4 rounded-2xl font-bold text-[17px] active:scale-[0.98] transition-transform ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
            >
              {editState.type === "g_initial" ? "Save Value" : "Save Goal"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
