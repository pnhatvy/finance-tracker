import { useEffect, useState, useRef } from "react";
import { useAppContext } from "../AppContext";
import { ChevronLeft, ChevronRight, X, ChevronDown } from "lucide-react";

export default function Analytics() {
  const { monthlyBudget, monthlyIncomeGoal, cycleStartDay, theme, categories } =
    useAppContext();
  const [transactions, setTransactions] = useState([]);

  const [timeFilter, setTimeFilter] = useState("month");
  const [typeFilter, setTypeFilter] = useState("expense");
  const [offset, setOffset] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // MẶC ĐỊNH MỞ RA LÀ XEM LIMIT (Theo đúng ý ông)
  const [catViewMode, setCatViewMode] = useState("limit");
  const [catLimits, setCatLimits] = useState({});
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitForm, setLimitForm] = useState({ categoryId: null, amount: "0" });

  const [, setGoalsTrigger] = useState(0);
  const rawDataRef = useRef({ tx: "", goals: "", limits: "" });

  useEffect(() => {
    const loadData = () => {
      const txRaw = localStorage.getItem("vys_transactions") || "[]";
      if (txRaw !== rawDataRef.current.tx) {
        rawDataRef.current.tx = txRaw;
        setTransactions(JSON.parse(txRaw));
      }

      const gRaw1 = localStorage.getItem("vys_monthly_goals") || "{}";
      const gRaw2 = localStorage.getItem("vys_global_goals") || "{}";
      const combinedGoals = gRaw1 + gRaw2;

      if (combinedGoals !== rawDataRef.current.goals) {
        rawDataRef.current.goals = combinedGoals;
        setGoalsTrigger((prev) => prev + 1);
      }

      const limitsRaw = localStorage.getItem("vys_category_limits") || "{}";
      if (limitsRaw !== rawDataRef.current.limits) {
        rawDataRef.current.limits = limitsRaw;
        setCatLimits(JSON.parse(limitsRaw));
      }
    };

    loadData();
    const interval = setInterval(loadData, 500);
    return () => clearInterval(interval);
  }, []);

  const getPeriodBounds = () => {
    const base = new Date();
    let start, end, label, monthKey;
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

    if (timeFilter === "week") {
      const targetDate = new Date(
        base.getFullYear(),
        base.getMonth(),
        base.getDate(),
      );
      targetDate.setDate(targetDate.getDate() + offset * 7);

      const dayOfWeek = targetDate.getDay();
      const distToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      start = new Date(targetDate);
      start.setDate(targetDate.getDate() - distToMonday);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 7);

      let endLabel = new Date(end);
      endLabel.setDate(endLabel.getDate() - 1);
      label = `${months[start.getMonth()]} ${start.getDate()} - ${months[endLabel.getMonth()]} ${endLabel.getDate()}`;
    } else if (timeFilter === "month") {
      let currentStart = new Date(
        base.getFullYear(),
        base.getMonth(),
        cycleStartDay,
      );
      if (base.getDate() < cycleStartDay)
        currentStart.setMonth(currentStart.getMonth() - 1);
      currentStart.setMonth(currentStart.getMonth() + offset);
      start = new Date(currentStart);
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      monthKey = `${start.getMonth() + 1}-${start.getFullYear()}`;

      if (cycleStartDay === 1) {
        label = `${months[start.getMonth()]} ${start.getFullYear()}`;
      } else {
        let endLabel = new Date(end);
        endLabel.setDate(endLabel.getDate() - 1);
        label = `${months[start.getMonth()]} ${start.getDate()} - ${months[endLabel.getMonth()]} ${endLabel.getDate()}`;
      }
    } else {
      base.setFullYear(base.getFullYear() + offset);
      start = new Date(base.getFullYear(), 0, 1);
      end = new Date(base.getFullYear() + 1, 0, 1);
      label = `${start.getFullYear()}`;
    }
    return { start, end, label, monthKey };
  };

  const bounds = getPeriodBounds();

  let currentBudget = Number(monthlyBudget) || 0;
  let currentIncomeGoal = Number(monthlyIncomeGoal) || 0;

  try {
    const glob = JSON.parse(localStorage.getItem("vys_global_goals") || "{}");
    if (glob.expense !== undefined) currentBudget = Number(glob.expense);
    else if (glob.budget !== undefined) currentBudget = Number(glob.budget);

    if (glob.income !== undefined) currentIncomeGoal = Number(glob.income);
    else if (glob.incomeGoal !== undefined)
      currentIncomeGoal = Number(glob.incomeGoal);

    if (timeFilter === "month" && bounds.start) {
      const monthObj = JSON.parse(
        localStorage.getItem("vys_monthly_goals") || "{}",
      );
      const m = bounds.start.getMonth() + 1;
      const y = bounds.start.getFullYear();
      const keys = [
        `${y}-${String(m).padStart(2, "0")}`,
        `${m}-${y}`,
        `${String(m).padStart(2, "0")}-${y}`,
      ];

      for (let k of keys) {
        if (monthObj[k]) {
          if (monthObj[k].expense !== undefined)
            currentBudget = Number(monthObj[k].expense);
          else if (monthObj[k].budget !== undefined)
            currentBudget = Number(monthObj[k].budget);

          if (monthObj[k].income !== undefined)
            currentIncomeGoal = Number(monthObj[k].income);
          else if (monthObj[k].incomeGoal !== undefined)
            currentIncomeGoal = Number(monthObj[k].incomeGoal);
          break;
        }
      }
    }
  } catch (e) {}

  const filteredData = transactions.filter((tItem) => {
    if (tItem.type !== typeFilter || !tItem.date) return false;
    const d = new Date(tItem.date);
    return d >= bounds.start && d < bounds.end;
  });

  const formatDetailDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()} • ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  };

  const openDetail = (cat) => {
    setSelectedCategory(cat);
    setTimeout(() => setShowDetail(true), 10);
  };
  const closeDetail = () => {
    setShowDetail(false);
    setTimeout(() => setSelectedCategory(null), 300);
  };

  let totalAmount = 0;
  let catMap = {};
  filteredData.forEach((item) => {
    totalAmount += item.amount;
    if (item.category) {
      const catId = item.category.id;
      if (!catMap[catId]) catMap[catId] = { ...item.category, spent: 0 };
      catMap[catId].spent += item.amount;
    }
  });

  const categoryData = Object.values(catMap)
    .map((cat) => ({
      ...cat,
      percent: totalAmount > 0 ? (cat.spent / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.spent - a.spent);

  const budgetLeft =
    typeFilter === "expense"
      ? currentBudget - totalAmount
      : currentIncomeGoal - totalAmount;

  const isCurrentPeriod = offset === 0;
  const now = new Date();
  const daysInCycle = Math.round((bounds.end - bounds.start) / 86400000);
  const pastData = filteredData.filter((item) => new Date(item.date) <= now);
  const totalAmountPast = pastData.reduce((sum, item) => sum + item.amount, 0);
  const futureDataTotal = totalAmount - totalAmountPast;

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const periodStart = new Date(
    bounds.start.getFullYear(),
    bounds.start.getMonth(),
    bounds.start.getDate(),
  );

  let daysPassed = Math.round((todayStart - periodStart) / 86400000) + 1;
  if (daysPassed > daysInCycle) daysPassed = daysInCycle;
  if (daysPassed < 1) daysPassed = 1;

  const dailyAverage = totalAmountPast / daysPassed;
  const onPaceFor = isCurrentPeriod
    ? dailyAverage * daysInCycle + futureDataTotal
    : totalAmount;
  const pacePercent = (daysPassed / daysInCycle) * 100;

  const catTransactions = selectedCategory
    ? filteredData.filter((t) => t.category?.id === selectedCategory.id)
    : [];
  const catTotal = catTransactions.reduce((sum, t) => sum + t.amount, 0);

  // ĐIỀU KIỆN CHỈ HIỂN THỊ LIMIT KHI: Cột Expense + Tab Month
  const isLimitApplicable = typeFilter === "expense" && timeFilter === "month";
  const currentViewMode = isLimitApplicable ? catViewMode : "percent";

  const openLimitModal = () => {
    const activeCats = categories.filter((c) => c.type === typeFilter);
    if (activeCats.length > 0) {
      const amt = catLimits[activeCats[0].id]
        ? catLimits[activeCats[0].id].toString().replace(".", ",")
        : "0";
      setLimitForm({ categoryId: activeCats[0].id, amount: amt });
    }
    setShowLimitModal(true);
  };

  const handleSaveLimit = () => {
    if (!limitForm.categoryId) return;
    const numericAmount = Number(limitForm.amount.toString().replace(",", "."));
    const newLimits = { ...catLimits };
    if (numericAmount > 0) {
      newLimits[limitForm.categoryId] = numericAmount;
    } else {
      delete newLimits[limitForm.categoryId];
    }
    setCatLimits(newLimits);
    localStorage.setItem("vys_category_limits", JSON.stringify(newLimits));
    setShowLimitModal(false);
  };

  const formatDisplayAmount = (val) => {
    if (!val || val === "0") return "";
    const parts = val.toString().split(",");
    return parts.length > 1
      ? `${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${parts[1]}`
      : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <>
      <div
        className={`h-[100dvh] w-full flex flex-col relative overflow-hidden animate-ios-page ${theme === "dark" ? "bg-black text-white" : "bg-[#f2f2f7] text-black"}`}
      >
        <div
          className={`flex-shrink-0 z-40 px-4 pb-3 flex flex-col gap-3 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] ${theme === "dark" ? "bg-black/90 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]" : "bg-[#f2f2f7]/90"}`}
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <div className="flex justify-center items-center">
            <div
              className={`relative flex rounded-full p-1 w-[240px] ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-gray-200"}`}
            >
              <div
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out ${typeFilter === "expense" ? "translate-x-0 bg-[#ff453a]" : "translate-x-[100%] bg-[#32d74b]"}`}
              ></div>
              <button
                onClick={() => setTypeFilter("expense")}
                className={`relative z-10 flex-1 py-1.5 text-sm font-semibold transition-colors duration-300 ${typeFilter === "expense" ? "text-white" : "text-[#8e8e93]"}`}
              >
                Expense
              </button>
              <button
                onClick={() => setTypeFilter("income")}
                className={`relative z-10 flex-1 py-1.5 text-sm font-semibold transition-colors duration-300 ${typeFilter === "income" ? "text-white" : "text-[#8e8e93]"}`}
              >
                Income
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {[
              { id: "week", label: "Week" },
              { id: "month", label: "Month" },
              { id: "year", label: "Year" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  setTimeFilter(filter.id);
                  setOffset(0);
                }}
                className={`flex-1 py-2 rounded-full text-[13px] font-bold transition-colors ${timeFilter === filter.id ? (theme === "dark" ? "bg-white text-black" : "bg-black text-white") : theme === "dark" ? "bg-[#1c1c1e] text-[#8e8e93]" : "bg-white text-gray-500"}`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div
            className={`flex items-center justify-between rounded-xl px-4 py-2 ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <button
              onClick={() => setOffset((o) => o - 1)}
              className="p-1 text-[#32ade6] active:opacity-50 flex-shrink-0"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="relative flex-1 mx-2 flex items-center justify-center">
              <span className="text-[13px] font-bold tracking-wide pointer-events-none text-center">
                {bounds.label}
              </span>
              {timeFilter === "year" ? (
                <select
                  className="absolute inset-0 w-full h-full opacity-0 z-10"
                  onChange={(e) => {
                    const diff =
                      parseInt(e.target.value) - new Date().getFullYear();
                    setOffset(diff);
                    e.target.value = "";
                  }}
                >
                  <option value="">Select Year</option>
                  {[...Array(15)].map((_, i) => {
                    const y = new Date().getFullYear() - 7 + i;
                    return (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type={timeFilter === "month" ? "month" : "date"}
                  className="absolute inset-0 w-full h-full opacity-0 z-10"
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const selectedDate = new Date(e.target.value);
                    const today = new Date();
                    if (timeFilter === "month") {
                      const mDiff =
                        (selectedDate.getFullYear() - today.getFullYear()) *
                          12 +
                        (selectedDate.getMonth() - today.getMonth());
                      setOffset(mDiff);
                    } else {
                      const dayDiff = Math.round(
                        (selectedDate - today) / (1000 * 60 * 60 * 24),
                      );
                      setOffset(Math.floor(dayDiff / 7));
                    }
                    e.target.value = "";
                  }}
                />
              )}
            </div>
            <button
              onClick={() => setOffset((o) => o + 1)}
              className="p-1 text-[#32ade6] active:opacity-50 flex-shrink-0"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto px-4 pt-4 pb-32 overscroll-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {timeFilter === "month" ? (
            <div className="mb-5">
              <div className="flex gap-2.5 mb-3">
                <div
                  className={`flex-1 rounded-xl p-4 ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
                >
                  <p className="text-[#8e8e93] text-xs font-semibold mb-1">
                    {typeFilter === "expense" ? "Spent" : "Earned"}
                  </p>
                  <div className="text-[22px] font-bold tracking-tight">
                    ₫{totalAmount.toLocaleString("vi-VN")}
                  </div>
                </div>
                <div
                  className={`flex-1 rounded-xl p-4 ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
                >
                  <p className="text-[#8e8e93] text-xs font-semibold mb-1">
                    {typeFilter === "expense" ? "Budget left" : "Goal left"}
                  </p>
                  <div
                    className={`text-[22px] font-bold tracking-tight ${budgetLeft < 0 ? "text-[#ff453a]" : ""}`}
                  >
                    {budgetLeft < 0 ? "-" : ""}₫
                    {Math.abs(budgetLeft).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>
              {isCurrentPeriod && typeFilter === "expense" && (
                <div className="px-1">
                  <p className="text-sm font-semibold">
                    <span className="text-[#8e8e93]">On pace for </span>
                    <span className="text-[#32ade6]">
                      ₫{Math.round(onPaceFor).toLocaleString("vi-VN")}
                    </span>
                  </p>
                  <p className="text-[13px] text-[#5c5c60] font-semibold mt-0.5">
                    ₫{Math.round(dailyAverage).toLocaleString("vi-VN")}/day
                    average
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-5">
              <div
                className={`rounded-xl p-4 mb-3 ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
              >
                <p className="text-[#8e8e93] text-xs font-semibold mb-1">
                  {typeFilter === "expense" ? `Spent` : `Earned`}
                </p>
                <div className="text-[22px] font-bold tracking-tight">
                  ₫{totalAmount.toLocaleString("vi-VN")}
                </div>
              </div>
              {isCurrentPeriod && timeFilter === "year" && (
                <div className="px-1">
                  <p className="text-sm font-semibold">
                    <span className="text-[#8e8e93]">Yearly pace </span>
                    <span className="text-[#32ade6]">
                      ₫{Math.round(onPaceFor).toLocaleString("vi-VN")}
                    </span>
                  </p>
                  <p className="text-[13px] text-[#5c5c60] font-semibold mt-0.5">
                    ₫{Math.round(onPaceFor / 12).toLocaleString("vi-VN")}/mo
                    average
                  </p>
                </div>
              )}
            </div>
          )}

          <div
            className={`rounded-2xl px-5 pt-3 pb-2 ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
          >
            <div className="flex justify-between items-center mb-3">
              {isLimitApplicable ? (
                <>
                  <button
                    onClick={() =>
                      setCatViewMode((m) =>
                        m === "percent" ? "limit" : "percent",
                      )
                    }
                    className="flex items-center gap-1 text-[#8e8e93] text-[13px] font-semibold active:opacity-60 transition-opacity"
                  >
                    By category:{" "}
                    <span
                      className={theme === "dark" ? "text-white" : "text-black"}
                    >
                      {catViewMode === "percent" ? "% of total" : "Limits"}
                    </span>
                    <ChevronDown size={14} className="opacity-70 mt-[1px]" />
                  </button>
                  <button
                    onClick={openLimitModal}
                    className="text-[#32ade6] text-[13px] font-semibold active:opacity-60 transition-opacity"
                  >
                    + Add limit
                  </button>
                </>
              ) : (
                <p className="text-[#8e8e93] text-[13px] font-semibold ml-1">
                  By category
                </p>
              )}
            </div>

            <div className="flex flex-col">
              {categoryData.map((cat, idx) => {
                let displayPercent = cat.percent;
                let limitAmt = null;
                let isOver = false;

                if (currentViewMode === "limit") {
                  const rawLimit = catLimits[cat.id];
                  if (rawLimit) {
                    limitAmt = rawLimit;
                    displayPercent = (cat.spent / limitAmt) * 100;
                    isOver = displayPercent > 100;
                  } else {
                    displayPercent = null;
                  }
                }

                return (
                  <div
                    key={cat.id}
                    onClick={() => openDetail(cat)}
                    className="relative py-2.5 cursor-pointer active:opacity-60 transition-opacity"
                  >
                    <div
                      className="absolute left-0 top-3 bottom-6 w-[3px] rounded-r-md"
                      style={{ backgroundColor: cat.color || "#32ade6" }}
                    ></div>
                    <div className="pl-4 pr-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-[20px]">{cat.icon}</span>
                          <span className="font-bold text-[15px]">
                            {cat.name}
                          </span>
                        </div>
                        <div className="font-bold text-[15px]">
                          ₫{cat.spent.toLocaleString("vi-VN")}{" "}
                          <span className="text-[#8e8e93] font-normal ml-1 text-lg leading-none">
                            ›
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        {/* WRAPPER THANH TIẾN TRÌNH */}
                        <div className="flex-1 h-1.5 relative flex items-center">
                          {/* Lớp nền và màu hiển thị % bị overflow-hidden */}
                          <div
                            className={`absolute inset-0 rounded-full overflow-hidden ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-200"}`}
                          >
                            {(currentViewMode === "percent" ||
                              displayPercent !== null) && (
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(displayPercent || 0, 100)}%`,
                                  backgroundColor: isOver
                                    ? "#ff453a"
                                    : cat.color || "#32ade6",
                                }}
                              ></div>
                            )}
                          </div>

                          {/* THANH MẢNH CHẠY THEO NGÀY (THÒ RA NGOÀI VÌ KHÔNG BỊ OVERFLOW-HIDDEN) */}
                          {currentViewMode === "limit" &&
                            limitAmt &&
                            isCurrentPeriod && (
                              <div
                                className={`absolute h-[14px] w-[2.5px] rounded-full z-10 shadow-sm ${theme === "dark" ? "bg-white" : "bg-black"}`}
                                style={{
                                  left: `calc(${Math.min(pacePercent, 100)}% - 1.25px)`,
                                }}
                              ></div>
                            )}
                        </div>

                        <span
                          className={`text-[12px] font-bold min-w-[32px] text-right ${isOver ? "text-[#ff453a]" : "text-[#8e8e93]"}`}
                        >
                          {currentViewMode === "percent"
                            ? `${Math.round(displayPercent)}%`
                            : displayPercent !== null
                              ? `${Math.round(displayPercent)}%`
                              : "—"}
                        </span>
                      </div>
                    </div>
                    {idx !== categoryData.length - 1 && (
                      <div
                        className={`absolute bottom-0 left-4 right-1 h-[1px] ${theme === "dark" ? "bg-white/5" : "bg-black/5"}`}
                      ></div>
                    )}
                  </div>
                );
              })}
              {categoryData.length === 0 && (
                <p className="text-center text-[#8e8e93] pb-4 pt-2 text-sm">
                  No data for this period.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLimitModal && (
        <div
          className="fixed inset-0 bg-black/70 z-[60] flex flex-col justify-end animate-ios-fade"
          onClick={() => setShowLimitModal(false)}
        >
          <div
            className={`w-full max-w-md mx-auto rounded-t-3xl p-5 pb-10 shadow-2xl animate-ios-slide ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg">Category Limit (Monthly)</h2>
              <button
                onClick={() => setShowLimitModal(false)}
                className={`p-1.5 rounded-full ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-[#8e8e93] text-sm mb-3">
              Select a category to set its monthly limit (Set to 0 to remove).
            </p>

            <div className="flex overflow-x-auto flex-nowrap gap-3 mb-6 pb-2 scrollbar-hide">
              {categories
                .filter((c) => c.type === typeFilter)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      const amt = catLimits[cat.id]
                        ? catLimits[cat.id].toString().replace(".", ",")
                        : "0";
                      setLimitForm({ categoryId: cat.id, amount: amt });
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all border flex-shrink-0 ${limitForm.categoryId === cat.id ? (theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-200") : theme === "dark" ? "bg-[#2c2c2e]/40 border-transparent text-[#8e8e93]" : "bg-gray-50 border-transparent text-gray-400"}`}
                    style={{
                      borderColor:
                        limitForm.categoryId === cat.id
                          ? cat.color
                          : "transparent",
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span
                      className={`text-sm font-semibold ${limitForm.categoryId === cat.id ? "" : theme === "dark" ? "" : "text-gray-500"}`}
                    >
                      {cat.name}
                    </span>
                  </button>
                ))}
            </div>

            {/* KHUNG NHẬP TIỀN AUTO XOÁ SỐ 0 VÀ CÓ NÚT DELETE GÓC PHẢI */}
            <div className="relative w-full mb-6">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={formatDisplayAmount(limitForm.amount)}
                onChange={(e) => {
                  let val = e.target.value
                    .replace(/\./g, "")
                    .replace(/[^0-9,]/g, "");
                  if (val.split(",").length > 2) val = val.slice(0, -1);
                  if (val === "") val = "0"; // Lưu biến 0 ngầm để save sẽ remove limit
                  setLimitForm({ ...limitForm, amount: val });
                }}
                className={`w-full rounded-2xl px-12 py-4 outline-none font-bold text-[24px] text-center ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-100 text-black"}`}
              />
              {limitForm.amount !== "0" && (
                <button
                  onClick={() => setLimitForm({ ...limitForm, amount: "0" })}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#3a3a3c] text-[#8e8e93]" : "bg-gray-300 text-gray-600"}`}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <button
              onClick={handleSaveLimit}
              className={`w-full py-4 rounded-2xl font-bold text-[17px] active:scale-[0.98] transition-transform ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
            >
              Save Limit
            </button>
          </div>
        </div>
      )}

      {selectedCategory && (
        <div
          className={`fixed inset-0 z-50 flex flex-col overflow-hidden transition-transform duration-300 ease-out ${showDetail ? "translate-y-0" : "translate-y-full"} ${theme === "dark" ? "bg-black" : "bg-[#f2f2f7]"}`}
        >
          <div
            className={`flex-shrink-0 z-40 pb-3 px-4 flex justify-between items-center shadow-[0_1px_0_0_rgba(0,0,0,0.05)] ${theme === "dark" ? "bg-black/90 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]" : "bg-[#f2f2f7]/90"}`}
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
          >
            <button
              onClick={closeDetail}
              className="text-[#32ade6] flex items-center text-[17px] font-semibold active:opacity-50"
            >
              <ChevronLeft size={24} className="-ml-2" /> Back
            </button>
            <h2 className="font-bold text-[17px] text-center w-full absolute left-0 -z-10">
              {selectedCategory.name}
            </h2>
            <div className="w-20"></div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 overscroll-y-auto">
            <div className="flex items-center gap-5 mb-8">
              <div
                className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-[36px] flex-shrink-0 ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
              >
                {selectedCategory.icon}
              </div>
              <div>
                <div className="text-[36px] font-bold tracking-tight leading-none mb-2">
                  ₫{catTotal.toLocaleString("vi-VN")}
                </div>
                <div className="text-[13px] font-medium text-[#8e8e93]">
                  {catTransactions.length} entries • {bounds.label}
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              {catTransactions.map((t) => (
                <div
                  key={t.id}
                  className={`flex justify-between items-center py-4 border-b ${theme === "dark" ? "border-white/5" : "border-black/5"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: selectedCategory.color || "#32ade6",
                      }}
                    ></div>
                    <div className="flex flex-col">
                      <p
                        className={`font-bold text-[16px] leading-tight mb-1 ${theme === "dark" ? "text-white" : "text-black"}`}
                      >
                        {t.note || selectedCategory.name}
                      </p>
                      <p className="text-[13px] text-[#8e8e93] leading-tight font-medium">
                        {formatDetailDate(t.date)}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`font-bold text-[16px] flex-shrink-0 ${theme === "dark" ? "text-white" : "text-black"}`}
                  >
                    ₫{t.amount.toLocaleString("vi-VN")}
                  </div>
                </div>
              ))}
              {catTransactions.length === 0 && (
                <p className="text-center text-[#8e8e93] mt-8 text-sm">
                  No transactions found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
