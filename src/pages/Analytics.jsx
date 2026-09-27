import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAppContext } from "../AppContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Analytics() {
  const { monthlyBudget, monthlyIncomeGoal, cycleStartDay } = useAppContext();
  const [transactions, setTransactions] = useState([]);
  const [timeFilter, setTimeFilter] = useState("month");
  const [typeFilter, setTypeFilter] = useState("expense");
  const [offset, setOffset] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    });
    return () => unsubscribe();
  }, []);

  const getPeriodBounds = () => {
    /* Giữ nguyên hàm bounds */
    const base = new Date();
    let start, end, label;
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
      base.setDate(base.getDate() + offset * 7);
      const day = base.getDay();
      const diff = base.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(base.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
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
      if (cycleStartDay === 1)
        label = `${months[start.getMonth()]} ${start.getFullYear()}`;
      else {
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
    return { start, end, label };
  };
  const bounds = getPeriodBounds();
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
      ? monthlyBudget - totalAmount
      : monthlyIncomeGoal - totalAmount;
  const isCurrentPeriod = offset === 0;
  const daysPassed = Math.max(
    1,
    Math.floor((new Date() - bounds.start) / (1000 * 60 * 60 * 24)) + 1,
  );
  const daysInCycle = Math.round(
    (bounds.end - bounds.start) / (1000 * 60 * 60 * 24),
  );
  const dailyAverage =
    totalAmount / (isCurrentPeriod ? daysPassed : daysInCycle);
  const onPaceFor = isCurrentPeriod ? dailyAverage * daysInCycle : totalAmount;
  const catTransactions = selectedCategory
    ? filteredData.filter((t) => t.category?.id === selectedCategory.id)
    : [];
  const catTotal = catTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      <div className="h-[100dvh] w-full flex flex-col bg-black text-white relative overflow-hidden animate-ios-page">
        {/* HEADER CỐ ĐỊNH, CÓ PADDING-TOP CHỐNG ĐÈ CAMERA */}
        <div
          className="flex-shrink-0 z-40 bg-black/90 backdrop-blur-xl px-4 pb-3 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]"
          style={{ paddingTop: "max(env(safe-area-inset-top), 56px)" }}
        >
          <div className="flex justify-center items-center mb-4">
            <div className="relative flex bg-[#1c1c1e] rounded-full p-1 w-[240px]">
              <div
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out ${typeFilter === "expense" ? "translate-x-0 bg-[#ff453a]" : "translate-x-[100%] bg-[#32d74b]"}`}
              ></div>
              <button
                onClick={() => setTypeFilter("expense")}
                className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-300 ${typeFilter === "expense" ? "text-white" : "text-[#8e8e93]"}`}
              >
                Expense
              </button>
              <button
                onClick={() => setTypeFilter("income")}
                className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-300 ${typeFilter === "income" ? "text-white" : "text-[#8e8e93]"}`}
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
                className={`flex-1 py-2.5 rounded-full text-[13px] font-bold transition-colors ${timeFilter === filter.id ? "bg-white text-black" : "bg-[#1c1c1e] text-[#8e8e93]"}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* NỘI DUNG CUỘN */}
        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-32">
          <div className="flex items-center justify-between bg-[#1c1c1e] rounded-2xl px-4 py-3 mb-5">
            <button
              onClick={() => setOffset((o) => o - 1)}
              className="p-1 text-[#32ade6] active:opacity-50"
            >
              <ChevronLeft size={22} />
            </button>
            <span className="text-sm font-bold tracking-wide">
              {bounds.label}
            </span>
            <button
              onClick={() => setOffset((o) => o + 1)}
              className="p-1 text-[#32ade6] active:opacity-50"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {timeFilter === "month" ? (
            <div className="mb-5">
              <div className="flex gap-2.5 mb-3">
                <div className="flex-1 bg-[#1c1c1e] rounded-xl p-4">
                  <p className="text-[#8e8e93] text-xs font-semibold mb-1">
                    {typeFilter === "expense" ? "Spent" : "Earned"}
                  </p>
                  <div className="text-[22px] font-bold tracking-tight">
                    ₫{totalAmount.toLocaleString("vi-VN")}
                  </div>
                </div>
                <div className="flex-1 bg-[#1c1c1e] rounded-xl p-4">
                  <p className="text-[#8e8e93] text-xs font-semibold mb-1">
                    {typeFilter === "expense" ? "Budget left" : "Goal left"}
                  </p>
                  <div className="text-[22px] font-bold tracking-tight">
                    ₫{Math.abs(budgetLeft).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>
              {isCurrentPeriod && (
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
            <div className="bg-[#1c1c1e] rounded-xl p-4 mb-5">
              <p className="text-[#8e8e93] text-xs font-semibold mb-1">
                {typeFilter === "expense" ? `Spent` : `Earned`}
              </p>
              <div className="text-[22px] font-bold tracking-tight">
                ₫{totalAmount.toLocaleString("vi-VN")}
              </div>
            </div>
          )}

          <div className="bg-[#1c1c1e] rounded-2xl px-5 pt-3 pb-2">
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
                        <span className="text-white font-bold text-[15px]">
                          {cat.name}
                        </span>
                      </div>
                      <div className="font-bold text-white text-[15px]">
                        ₫{cat.spent.toLocaleString("vi-VN")}{" "}
                        <span className="text-[#8e8e93] font-normal ml-1 text-lg leading-none">
                          ›
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 h-1 bg-[#2c2c2e] rounded-full overflow-hidden">
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
                    <div className="absolute bottom-0 left-4 right-1 h-[1px] bg-white/5"></div>
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

      {/* OVERLAY CHI TIẾT */}
      {selectedCategory && (
        <div
          className={`fixed inset-0 z-50 bg-black flex flex-col overflow-hidden transition-transform duration-300 ease-out ${showDetail ? "translate-y-0" : "translate-y-full"}`}
        >
          <div
            className="flex-shrink-0 z-40 bg-black/90 backdrop-blur-xl pb-4 px-4 flex justify-between items-center shadow-[0_1px_0_0_rgba(255,255,255,0.05)]"
            style={{ paddingTop: "max(env(safe-area-inset-top), 56px)" }}
          >
            <button
              onClick={closeDetail}
              className="text-[#32ade6] flex items-center text-[17px] font-semibold active:opacity-50"
            >
              <ChevronLeft size={24} className="-ml-2" /> Back
            </button>
            <h2 className="font-bold text-[17px]">{selectedCategory.name}</h2>
            <div className="w-20"></div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-[72px] h-[72px] bg-[#1c1c1e] rounded-full flex items-center justify-center text-[36px]">
                {selectedCategory.icon}
              </div>
              <div>
                <div className="text-[36px] font-bold text-white tracking-tight leading-none mb-2">
                  ₫{catTotal.toLocaleString("vi-VN")}
                </div>
                <div className="text-[13px] font-medium text-[#8e8e93]">
                  {catTransactions.length} entries • {bounds.label}
                </div>
              </div>
            </div>
            <div>
              {catTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex justify-between items-center py-4 border-b border-[#1c1c1e]"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: selectedCategory.color }}
                    ></div>
                    <div className="flex flex-col">
                      <p className="font-bold text-white text-[15px] leading-tight mb-1">
                        {t.note}
                      </p>
                      <p className="text-[13px] text-[#8e8e93] leading-tight">
                        {formatDetailDate(t.date)}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold text-white text-[16px]">
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
