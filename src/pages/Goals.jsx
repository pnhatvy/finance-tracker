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
    const mGoals = JSON.parse(
      localStorage.getItem("vys_monthly_goals") || "{}",
    );
    if (mGoals[bounds.key]) {
      setMonthlyBudget(
        mGoals[bounds.key].budget !== undefined
          ? mGoals[bounds.key].budget
          : null,
      );
      setMonthlyIncome(
        mGoals[bounds.key].income !== undefined
          ? mGoals[bounds.key].income
          : null,
      );
    } else {
      setMonthlyBudget(null);
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

  const activeBudget =
    monthlyBudget !== null && monthlyBudget !== "" ? monthlyBudget : 9500000;
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

  // TÍNH TOÁN VỊ TRÍ THANH PACING (TIẾN ĐỘ THÁNG NÀY)
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

  const handleSave = (applyToFuture = false) => {
    const numValue =
      editState.value === "" ? 0 : Number(editState.value.replace(/\./g, ""));

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
      } else {
        if (!gGoals[bounds.key]) gGoals[bounds.key] = { income: null };
        gGoals[bounds.key].income = numValue;
      }
      localStorage.setItem("vys_global_goals_history", JSON.stringify(gGoals));

      const oldGlob = JSON.parse(
        localStorage.getItem("vys_global_goals") || "{}",
      );
      oldGlob.income = numValue;
      localStorage.setItem("vys_global_goals", JSON.stringify(oldGlob));
      setGlobalIncomeGoal(numValue);
    } else {
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
          if (editState.type === "m_budget") mGoals[key].budget = numValue;
          if (editState.type === "m_income") mGoals[key].income = numValue;
        }
      } else {
        if (!mGoals[bounds.key])
          mGoals[bounds.key] = { budget: null, income: null };
        if (editState.type === "m_budget") mGoals[bounds.key].budget = numValue;
        if (editState.type === "m_income") mGoals[bounds.key].income = numValue;
      }
      localStorage.setItem("vys_monthly_goals", JSON.stringify(mGoals));
      if (editState.type === "m_budget") setMonthlyBudget(numValue);
      if (editState.type === "m_income") setMonthlyIncome(numValue);
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
              {/* THANH THỰC TẾ CHI TIÊU */}
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out ${spentPercent >= 100 ? "bg-[#ff453a]" : "bg-gray-300"}`}
                style={{ width: `${Math.min(spentPercent, 100)}%` }}
              ></div>

              {/* THANH ĐỊNH VỊ (PACING MARKER) */}
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
                Net Worth:
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
                placeholder="0"
                value={editState.value}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onChange={(e) => handleInput(e.target.value)}
                className={`flex-1 bg-transparent py-3 outline-none font-bold text-[22px] w-full ${theme === "dark" ? "text-white" : "text-black"}`}
              />
              {editState.value !== "" && (
                <button
                  onClick={() => setEditState({ ...editState, value: "" })}
                  className={`p-1 ml-2 text-[#8e8e93] active:opacity-50 transition-opacity`}
                  title="Clear"
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>

            {editState.type === "g_initial" ? (
              <button
                onClick={() => handleSave()}
                className={`w-full py-3.5 rounded-2xl font-bold text-[17px] active:scale-[0.98] transition-transform ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
              >
                Save Value
              </button>
            ) : (
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => handleSave(false)}
                  className={`w-full py-3.5 rounded-2xl font-bold text-[17px] active:scale-[0.98] transition-transform ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-200 text-black"}`}
                >
                  This Month Only
                </button>
                <button
                  onClick={() => handleSave(true)}
                  className={`w-full py-3.5 rounded-2xl font-bold text-[17px] active:scale-[0.98] transition-transform ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
                >
                  This & Future Months
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
