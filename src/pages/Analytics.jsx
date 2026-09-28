import { useEffect, useState } from "react";
import { useAppContext } from "../AppContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Analytics() {
  const { theme, cycleStartDay } = useAppContext();
  const [transactions, setTransactions] = useState([]);
  const [offset, setOffset] = useState(0); // 0 là tháng này, 1 là tháng sau, -1 là tháng trước

  // Load dữ liệu từ localStorage
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("vys_transactions") || "[]");
    setTransactions(data);
  }, []);

  // Tính toán khoảng thời gian của tháng (hoặc chu kỳ)
  const getPeriodBounds = () => {
    const base = new Date();
    // Nếu ngày hiện tại nhỏ hơn ngày bắt đầu chu kỳ, lùi về 1 tháng trước khi cộng offset
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

    return { start, end, label };
  };

  const bounds = getPeriodBounds();

  // Lọc giao dịch trong tháng đang chọn
  const currentTransactions = transactions.filter((t) => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return d >= bounds.start && d < bounds.end;
  });

  // Tính tổng Thu / Chi
  const totalExpense = currentTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = currentTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Gom nhóm chi tiêu theo danh mục
  const expenseByCategory = currentTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const catId = t.category?.id || "unknown";
      if (!acc[catId]) {
        acc[catId] = { ...t.category, amount: 0 };
      }
      acc[catId].amount += t.amount;
      return acc;
    }, {});

  // Sắp xếp danh mục chi tiêu nhiều nhất lên đầu
  const sortedExpenses = Object.values(expenseByCategory).sort(
    (a, b) => b.amount - a.amount,
  );

  return (
    <div
      className={`h-[100dvh] w-full flex flex-col relative overflow-hidden animate-ios-page ${theme === "dark" ? "bg-black text-white" : "bg-[#f2f2f7] text-black"}`}
    >
      {/* HEADER */}
      <div
        className={`flex-shrink-0 z-40 px-4 pb-3 flex flex-col gap-3 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] ${theme === "dark" ? "bg-black/90 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]" : "bg-[#f2f2f7]/90"}`}
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <h1 className="text-[22px] font-bold w-full text-center tracking-tight">
          Analytics
        </h1>

        {/* THANH CHUYỂN THÁNG (Cho phép xem tháng sau) */}
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-2 ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="p-1 text-[#32ade6] active:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-[14px] font-bold tracking-wide">
            {bounds.label}
          </span>
          <button
            onClick={() => setOffset((o) => o + 1)}
            className="p-1 text-[#32ade6] active:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* NỘI DUNG THỐNG KÊ */}
      <div
        className="flex-1 overflow-y-auto px-4 pt-4 pb-32 overscroll-y-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* THẺ TỔNG QUAN */}
        <div
          className={`w-full rounded-3xl p-5 mb-6 flex flex-col gap-4 shadow-sm ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-semibold text-[#8e8e93] uppercase tracking-wider mb-1">
                Net Balance
              </p>
              <p
                className={`text-2xl font-bold tracking-tight ${netBalance >= 0 ? (theme === "dark" ? "text-white" : "text-black") : "text-[#ff453a]"}`}
              >
                {netBalance > 0 ? "+" : ""}
                {netBalance === 0
                  ? "₫0"
                  : `₫${netBalance.toLocaleString("vi-VN")}`}
              </p>
            </div>
          </div>
          <div
            className={`w-full h-[1px] ${theme === "dark" ? "bg-white/10" : "bg-black/5"}`}
          ></div>
          <div className="flex justify-between">
            <div className="flex-1">
              <p className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-wider mb-0.5">
                Income
              </p>
              <p className="text-[#32d74b] font-semibold text-lg">
                +₫{totalIncome.toLocaleString("vi-VN")}
              </p>
            </div>
            <div className="flex-1 text-right">
              <p className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-wider mb-0.5">
                Expense
              </p>
              <p className="text-[#ff453a] font-semibold text-lg">
                -₫{totalExpense.toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </div>

        {/* DANH SÁCH CHI TIÊU THEO DANH MỤC */}
        <h3 className="text-[#8e8e93] text-[12px] font-bold uppercase tracking-widest ml-2 mb-3">
          Top Expenses
        </h3>
        {sortedExpenses.length > 0 ? (
          <div
            className={`w-full rounded-3xl overflow-hidden shadow-sm ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            {sortedExpenses.map((cat, index) => {
              const percentage = Math.round((cat.amount / totalExpense) * 100);
              return (
                <div
                  key={cat.id || index}
                  className={`p-4 ${index !== sortedExpenses.length - 1 ? (theme === "dark" ? "border-b border-white/5" : "border-b border-black/5") : ""}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="font-semibold text-[15px]">
                        {cat.name || "Unknown"}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[15px]">
                        ₫{cat.amount.toLocaleString("vi-VN")}
                      </p>
                      <p className="text-xs text-[#8e8e93] font-medium">
                        {percentage}%
                      </p>
                    </div>
                  </div>
                  {/* Thanh tiến độ (Progress bar) */}
                  <div
                    className={`w-full h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-black" : "bg-gray-200"}`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: cat.color || "#ff453a",
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-[#8e8e93] mt-10 text-sm">
            <p>No expenses for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
}
