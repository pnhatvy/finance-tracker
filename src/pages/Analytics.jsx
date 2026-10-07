import { useEffect, useState, useRef } from "react";
import { useAppContext } from "../AppContext";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function Analytics() {
  const { monthlyBudget, monthlyIncomeGoal, cycleStartDay, theme } =
    useAppContext();
  const [transactions, setTransactions] = useState([]);

  const [timeFilter, setTimeFilter] = useState("month");
  const [typeFilter, setTypeFilter] = useState("expense");
  const [offset, setOffset] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const [, setGoalsTrigger] = useState(0);
  const rawDataRef = useRef({ tx: "", goals: "" });

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
  } catch (e) {
    console.error("Error reading Goals:", e);
  }

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

  const catTransactions = selectedCategory
    ? filteredData.filter((t) => t.category?.id === selectedCategory.id)
    : [];
  const catTotal = catTransactions.reduce((sum, t) => sum + t.amount, 0);

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

            {/* NATIVE PICKER CHO ANALYTICS */}
            <div className="relative flex-1 mx-2 flex items-center justify-center">
              <span className="text-[13px] font-bold tracking-wide pointer-events-none text-center">
                {bounds.label}
              </span>

              {/* Nếu đang xem Năm thì dùng select native để ra vòng cuộn số */}
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
            <p className="text-[#8e8e93] text-[13px] font-semibold mb-1.5 ml-1">
              By category
            </p>
            <div className="flex flex-col">
              {categoryData.map((cat, idx) => (
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
                      <div
                        className={`flex-1 h-1 rounded-full overflow-hidden ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-200"}`}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${cat.percent}%`,
                            backgroundColor: cat.color || "#32ade6",
                          }}
                        ></div>
                      </div>
                      <span className="text-[#8e8e93] text-xs font-semibold min-w-[32px] text-right">
                        {Math.round(cat.percent)}%
                      </span>
                    </div>
                  </div>
                  {idx !== categoryData.length - 1 && (
                    <div
                      className={`absolute bottom-0 left-4 right-1 h-[1px] ${theme === "dark" ? "bg-white/5" : "bg-black/5"}`}
                    ></div>
                  )}
                </div>
              ))}
              {categoryData.length === 0 && (
                <p className="text-center text-[#8e8e93] pb-4 pt-2 text-sm">
                  No data for this period.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

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
