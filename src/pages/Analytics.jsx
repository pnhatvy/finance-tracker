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

  const [catViewMode, setCatViewMode] = useState("limit");
  const [catLimits, setCatLimits] = useState({});
  const [monthlyCatLimits, setMonthlyCatLimits] = useState({});

  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitScope, setLimitScope] = useState("all");
  const [limitForm, setLimitForm] = useState({ categoryId: null, amount: "0" });

  const [, setGoalsTrigger] = useState(0);
  const rawDataRef = useRef({ tx: "", goals: "", limits: "", mLimits: "" });

  const detailContainerRef = useRef(null);

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

      const mLimitsRaw =
        localStorage.getItem("vys_monthly_category_limits") || "{}";
      if (mLimitsRaw !== rawDataRef.current.mLimits) {
        rawDataRef.current.mLimits = mLimitsRaw;
        setMonthlyCatLimits(JSON.parse(mLimitsRaw));
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

      // ĐÃ FIX: Chìa khóa đồng bộ hoàn hảo chuẩn YYYY-MM
      monthKey = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, "0")}`;

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

  // TÍNH TOÁN BUDGET TỰ ĐỘNG THÔNG MINH
  let currentBudget = 0;
  let currentIncomeGoal = 0;

  try {
    const glob = JSON.parse(localStorage.getItem("vys_global_goals") || "{}");
    const mGoals = JSON.parse(
      localStorage.getItem("vys_monthly_goals") || "{}",
    );

    // Auto-sum Limits logic
    let autoSum = 0;
    if (timeFilter === "month" && bounds.monthKey) {
      const currentLocalLimits = monthlyCatLimits[bounds.monthKey] || {};
      const allCategoryIds = new Set([
        ...Object.keys(catLimits),
        ...Object.keys(currentLocalLimits),
      ]);
      allCategoryIds.forEach((catId) => {
        const activeVal =
          currentLocalLimits[catId] !== undefined
            ? currentLocalLimits[catId]
            : catLimits[catId];
        autoSum += Number(activeVal) || 0;
      });
    }

    if (timeFilter === "month") {
      // 1. Nếu có nhập tay đè thì xài nhập tay
      if (
        mGoals[bounds.monthKey] &&
        mGoals[bounds.monthKey].budget !== undefined
      ) {
        currentBudget = Number(mGoals[bounds.monthKey].budget);
      }
      // 2. Không nhập tay thì Auto-sum Limits
      else if (autoSum > 0) {
        currentBudget = autoSum;
      }
      // 3. Fallback mốc dùng chung
      else {
        currentBudget = Number(
          glob.expense || glob.budget || monthlyBudget || 0,
        );
      }

      // Xử lý Income
      if (
        mGoals[bounds.monthKey] &&
        mGoals[bounds.monthKey].income !== undefined
      ) {
        currentIncomeGoal = Number(mGoals[bounds.monthKey].income);
      } else {
        currentIncomeGoal = Number(
          glob.incomeGoal || glob.income || monthlyIncomeGoal || 0,
        );
      }
    } else {
      currentBudget = Number(glob.expense || glob.budget || monthlyBudget || 0);
      currentIncomeGoal = Number(
        glob.incomeGoal || glob.income || monthlyIncomeGoal || 0,
      );
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

  useEffect(() => {
    const container = detailContainerRef.current;
    if (!container || !showDetail) return;

    let startY = 0,
      startX = 0,
      currentY = 0;
    let isDragging = false,
      isClosing = false,
      dragDirection = null;
    let rafId = null;

    const handleTouchStart = (e) => {
      if (container.scrollTop > 0 || isClosing) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
      dragDirection = null;
      container.style.transition = "none";
    };

    const handleTouchMove = (e) => {
      if (!isDragging || isClosing) return;

      const diffX = e.touches[0].clientX - startX;
      const diffY = e.touches[0].clientY - startY;

      if (!dragDirection) {
        if (Math.abs(diffX) > Math.abs(diffY)) dragDirection = "horizontal";
        else dragDirection = "vertical";
      }

      if (dragDirection === "horizontal") return;

      if (
        dragDirection === "vertical" &&
        diffY > 0 &&
        container.scrollTop <= 0
      ) {
        e.preventDefault();
        currentY = diffY;

        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          container.style.transform = `translate3d(0, ${currentY}px, 0)`;
        });
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging || isClosing) return;
      isDragging = false;
      if (rafId) cancelAnimationFrame(rafId);

      container.style.transition =
        "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";

      if (currentY > 150) {
        isClosing = true;
        container.style.transform = `translate3d(0, 100dvh, 0)`;
        closeDetail();
        setTimeout(() => {
          container.style.transform = "";
        }, 300);
      } else {
        currentY = 0;
        container.style.transform = `translate3d(0, 0px, 0)`;
      }
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [showDetail]);

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

  const isLimitApplicable = typeFilter === "expense" && timeFilter === "month";
  const currentViewMode = isLimitApplicable ? catViewMode : "percent";

  const loadFormForCat = (catId) => {
    const currentMonthKey = bounds.monthKey;
    const localLimit = monthlyCatLimits[currentMonthKey]?.[catId];
    const globalLimit = catLimits[catId];

    if (localLimit !== undefined) {
      setLimitForm({
        categoryId: catId,
        amount: localLimit.toString().replace(".", ","),
      });
      setLimitScope("month");
    } else if (globalLimit !== undefined) {
      setLimitForm({
        categoryId: catId,
        amount: globalLimit.toString().replace(".", ","),
      });
      setLimitScope("all");
    } else {
      setLimitForm({ categoryId: catId, amount: "0" });
      setLimitScope("all");
    }
  };

  const openLimitModal = () => {
    const activeCats = categories.filter((c) => c.type === typeFilter);
    if (activeCats.length > 0) loadFormForCat(activeCats[0].id);
    setShowLimitModal(true);
  };

  const handleSaveLimit = () => {
    if (!limitForm.categoryId) return;
    const numericAmount = Number(limitForm.amount.toString().replace(",", "."));
    const currentMonthKey = bounds.monthKey;

    if (numericAmount === 0) {
      const newGlobalLimits = { ...catLimits };
      delete newGlobalLimits[limitForm.categoryId];
      setCatLimits(newGlobalLimits);
      localStorage.setItem(
        "vys_category_limits",
        JSON.stringify(newGlobalLimits),
      );

      const newMonthlyLimits = { ...monthlyCatLimits };
      if (newMonthlyLimits[currentMonthKey]) {
        delete newMonthlyLimits[currentMonthKey][limitForm.categoryId];
        if (Object.keys(newMonthlyLimits[currentMonthKey]).length === 0)
          delete newMonthlyLimits[currentMonthKey];
        setMonthlyCatLimits(newMonthlyLimits);
        localStorage.setItem(
          "vys_monthly_category_limits",
          JSON.stringify(newMonthlyLimits),
        );
      }
    } else if (limitScope === "month") {
      const newMonthlyLimits = { ...monthlyCatLimits };
      if (!newMonthlyLimits[currentMonthKey])
        newMonthlyLimits[currentMonthKey] = {};
      newMonthlyLimits[currentMonthKey][limitForm.categoryId] = numericAmount;

      setMonthlyCatLimits(newMonthlyLimits);
      localStorage.setItem(
        "vys_monthly_category_limits",
        JSON.stringify(newMonthlyLimits),
      );
    } else {
      const newGlobalLimits = { ...catLimits };
      newGlobalLimits[limitForm.categoryId] = numericAmount;
      setCatLimits(newGlobalLimits);
      localStorage.setItem(
        "vys_category_limits",
        JSON.stringify(newGlobalLimits),
      );

      const newMonthlyLimits = { ...monthlyCatLimits };
      if (
        newMonthlyLimits[currentMonthKey] &&
        newMonthlyLimits[currentMonthKey][limitForm.categoryId] !== undefined
      ) {
        delete newMonthlyLimits[currentMonthKey][limitForm.categoryId];
        if (Object.keys(newMonthlyLimits[currentMonthKey]).length === 0)
          delete newMonthlyLimits[currentMonthKey];
        setMonthlyCatLimits(newMonthlyLimits);
        localStorage.setItem(
          "vys_monthly_category_limits",
          JSON.stringify(newMonthlyLimits),
        );
      }
    }

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
                  const currentMonthKey = bounds.monthKey;
                  const localLimit =
                    monthlyCatLimits[currentMonthKey]?.[cat.id];
                  const globalLimit = catLimits[cat.id];
                  const activeLimit =
                    localLimit !== undefined ? localLimit : globalLimit;

                  if (activeLimit) {
                    limitAmt = activeLimit;
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
                        <div className="flex-1 h-1 relative flex items-center">
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
                          {currentViewMode === "limit" &&
                            limitAmt &&
                            isCurrentPeriod && (
                              <div
                                className={`absolute -top-1 -bottom-1 w-[2px] rounded-full z-10 shadow-sm ${theme === "dark" ? "bg-white" : "bg-black"}`}
                                style={{
                                  left: `calc(${Math.min(pacePercent, 100)}% - 1px)`,
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Category Limit</h2>
              <button
                onClick={() => setShowLimitModal(false)}
                className={`p-1.5 rounded-full ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={`flex rounded-xl p-1 mb-5 w-full ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-gray-200"}`}
            >
              <button
                onClick={() => setLimitScope("all")}
                className={`flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-colors duration-200 ${limitScope === "all" ? (theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-white text-black shadow-sm") : theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
              >
                All Months
              </button>
              <button
                onClick={() => setLimitScope("month")}
                className={`flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-colors duration-200 ${limitScope === "month" ? (theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-white text-black shadow-sm") : theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
              >
                This Month Only
              </button>
            </div>

            <div className="flex overflow-x-auto flex-nowrap gap-3 mb-6 pb-2 scrollbar-hide">
              {categories
                .filter((c) => c.type === typeFilter)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => loadFormForCat(cat.id)}
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

            <div className="relative w-full mb-6">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={
                  limitForm.amount === "0"
                    ? ""
                    : formatDisplayAmount(limitForm.amount)
                }
                onChange={(e) => {
                  let val = e.target.value
                    .replace(/\./g, "")
                    .replace(/[^0-9,]/g, "");
                  if (val.split(",").length > 2) val = val.slice(0, -1);
                  if (val === "") val = "0";
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
          ref={detailContainerRef}
          className={`fixed inset-0 z-50 flex flex-col overflow-y-auto will-change-transform ${theme === "dark" ? "bg-black" : "bg-[#f2f2f7]"}`}
          style={{
            transition: showDetail
              ? "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)"
              : "none",
            transform: showDetail
              ? "translate3d(0, 0, 0)"
              : "translate3d(0, 100dvh, 0)",
          }}
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
          <div className="flex-1 px-6 pt-6 pb-32">
            <div className="flex items-center gap-5 mb-8">
              <div
                className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-[36px] flex-shrink-0 ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
              >
                {selectedCategory.icon}
              </div>
              <div>
                <div
                  className={`text-[36px] font-bold tracking-tight leading-none mb-2 ${theme === "dark" ? "text-white" : "text-black"}`}
                >
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
