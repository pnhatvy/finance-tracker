import { useState, useEffect } from "react";
import { useAppContext } from "../AppContext";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Trash2,
  Repeat,
} from "lucide-react";

export default function History() {
  const { theme, cycleStartDay, categories } = useAppContext();
  const [tab, setTab] = useState("month");
  const [offset, setOffset] = useState(0);
  const [transactions, setTransactions] = useState([]);

  // State quản lý Edit Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [editForm, setEditForm] = useState(null);

  // Load dữ liệu
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("vys_transactions") || "[]");
    setTransactions(data);
  }, [editForm]);

  // Tính toán thời gian
  const getPeriodBounds = () => {
    const base = new Date();
    let start, end, label;

    if (tab === "month") {
      start = new Date(base.getFullYear(), base.getMonth(), cycleStartDay);
      if (base.getDate() < cycleStartDay) start.setMonth(start.getMonth() - 1);
      start.setMonth(start.getMonth() + offset);
      end = new Date(start);
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
      if (cycleStartDay === 1) {
        label = `${months[start.getMonth()]} ${start.getFullYear()}`;
      } else {
        let endLabel = new Date(end);
        endLabel.setDate(endLabel.getDate() - 1);
        label = `${months[start.getMonth()]} ${start.getDate()} - ${months[endLabel.getMonth()]} ${endLabel.getDate()}`;
      }
    } else if (tab === "day") {
      start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      start.setDate(start.getDate() + offset);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      label = start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } else if (tab === "week") {
      start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      const dayOfWeek = start.getDay() === 0 ? 6 : start.getDay() - 1;
      start.setDate(start.getDate() - dayOfWeek + offset * 7);
      end = new Date(start);
      end.setDate(end.getDate() + 7);

      let endLabel = new Date(end);
      endLabel.setDate(endLabel.getDate() - 1);
      label = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endLabel.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }

    return { start, end, label };
  };

  const bounds = tab !== "all" ? getPeriodBounds() : null;

  // Lọc giao dịch
  const filteredTx = transactions
    .filter((t) => {
      if (tab === "all") return true;
      if (!t.date) return false;
      const d = new Date(t.date);
      return d >= bounds.start && d < bounds.end;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Nhóm theo ngày
  const groupedTx = {};
  filteredTx.forEach((t) => {
    const dateStr = new Date(t.date)
      .toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
      .toUpperCase();
    if (!groupedTx[dateStr]) groupedTx[dateStr] = { items: [], total: 0 };
    groupedTx[dateStr].items.push(t);
    groupedTx[dateStr].total += t.type === "expense" ? -t.amount : t.amount;
  });

  // Mở modal Edit
  const openModal = (tx) => {
    setSelectedTx(tx);
    setEditForm({
      id: tx.id,
      amount: tx.amount.toLocaleString("vi-VN"),
      type: tx.type,
      note: tx.note,
      category: tx.category,
      date: tx.date,
    });
  };

  const closeModal = () => {
    setSelectedTx(null);
    setEditForm(null);
  };

  // Lưu chỉnh sửa
  const saveTransaction = () => {
    if (!editForm.amount) return;
    const numAmount = Number(editForm.amount.replace(/\./g, ""));

    const updated = transactions.map((t) => {
      if (t.id === editForm.id) {
        return {
          ...t,
          amount: numAmount,
          type: editForm.type,
          note: editForm.note,
          category: editForm.category,
          date: editForm.date,
        };
      }
      return t;
    });

    localStorage.setItem("vys_transactions", JSON.stringify(updated));
    setTransactions(updated);
    closeModal();
  };

  // Xóa giao dịch
  const handleDeleteTransaction = () => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      const updated = transactions.filter((t) => t.id !== editForm.id);
      localStorage.setItem("vys_transactions", JSON.stringify(updated));
      setTransactions(updated);
      closeModal();
    }
  };

  return (
    <>
      <div
        className={`h-[100dvh] w-full flex flex-col relative overflow-hidden animate-ios-page ${theme === "dark" ? "bg-black text-white" : "bg-[#f2f2f7] text-black"}`}
      >
        {/* HEADER & TABS */}
        <div
          className={`flex-shrink-0 z-40 px-4 pb-3 flex flex-col justify-end shadow-[0_1px_0_0_rgba(0,0,0,0.05)] relative ${theme === "dark" ? "bg-black/90 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]" : "bg-[#f2f2f7]/90"}`}
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <h1 className="text-[22px] font-bold tracking-tight w-full text-center mb-4">
            History
          </h1>

          <div
            className={`flex rounded-full p-1 mx-auto w-full max-w-[340px] mb-4 ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-gray-200"}`}
          >
            {["Day", "Week", "Month", "All"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t.toLowerCase());
                  setOffset(0);
                }}
                className={`flex-1 py-1.5 text-[13px] font-semibold rounded-full transition-all duration-300 ${tab === t.toLowerCase() ? (theme === "dark" ? "bg-[#2c2c2e] text-white shadow-sm" : "bg-white text-black shadow-sm") : "text-[#8e8e93]"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab !== "all" && (
            <div
              className={`flex items-center justify-between rounded-xl px-4 py-2 mx-auto w-full max-w-[340px] ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
            >
              <button
                onClick={() => setOffset((o) => o - 1)}
                className="p-1 text-[#32ade6] active:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-[13px] font-bold tracking-wide">
                {bounds.label}
              </span>
              <button
                onClick={() => setOffset((o) => o + 1)}
                className="p-1 text-[#32ade6] active:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* LIST */}
        <div
          className="flex-1 overflow-y-auto px-4 pt-4 pb-32 overscroll-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {Object.keys(groupedTx).length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 text-[#8e8e93]">
              <p className="text-sm font-medium">No transactions found.</p>
            </div>
          ) : (
            Object.keys(groupedTx).map((dateStr) => (
              <div key={dateStr} className="mb-6 animate-ios-fade">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-wider">
                    {dateStr}
                  </span>
                  <span
                    className={`text-[12px] font-bold ${groupedTx[dateStr].total >= 0 ? "text-[#32d74b]" : "text-[#8e8e93]"}`}
                  >
                    {groupedTx[dateStr].total >= 0 ? "+" : "-"}₫
                    {Math.abs(groupedTx[dateStr].total).toLocaleString("vi-VN")}
                  </span>
                </div>

                <div
                  className={`rounded-2xl overflow-hidden ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
                >
                  {groupedTx[dateStr].items.map((tx, index) => (
                    <div
                      key={tx.id}
                      onClick={() => openModal(tx)}
                      className={`flex items-center p-3.5 cursor-pointer active:opacity-60 transition-opacity ${index !== groupedTx[dateStr].items.length - 1 ? (theme === "dark" ? "border-b border-white/5" : "border-b border-black/5") : ""}`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl mr-3"
                        style={{
                          backgroundColor: `${tx.category?.color || "#ff453a"}20`,
                        }}
                      >
                        {tx.category?.icon || "🍔"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold text-[15px] truncate ${theme === "dark" ? "text-white" : "text-black"}`}
                        >
                          {tx.category?.name || "Unknown"}
                        </p>
                        <p className="text-[#8e8e93] text-xs truncate mt-0.5">
                          {tx.note}
                        </p>
                      </div>
                      <div className="text-right ml-3">
                        <p
                          className={`font-bold text-[15px] ${tx.type === "expense" ? (theme === "dark" ? "text-white" : "text-black") : "text-[#32d74b]"}`}
                        >
                          {tx.type === "expense" ? "-" : "+"}₫
                          {tx.amount.toLocaleString("vi-VN")}
                        </p>
                        <p className="text-[#8e8e93] text-[11px] mt-0.5">
                          {new Date(tx.date).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* TRANSACTION EDIT MODAL - ĐÃ ÉP TEXT-WHITE TOÀN BỘ */}
      {selectedTx && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end animate-ios-fade"
          onClick={closeModal}
        >
          <div
            className={`w-full max-w-[360px] mx-auto rounded-t-[32px] p-5 pb-10 shadow-2xl animate-ios-slide ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`w-12 h-1.5 rounded-full mx-auto mb-5 ${theme === "dark" ? "bg-[#3a3a3c]" : "bg-gray-300"}`}
            ></div>

            <div className="flex justify-between items-center mb-5">
              <h2
                className={`font-bold text-xl ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                Edit {editForm.type === "expense" ? "Expense" : "Income"}
              </h2>
              <button
                onClick={closeModal}
                className={`p-1.5 rounded-full ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-100 text-black"}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <div
                className={`flex-1 flex items-center rounded-2xl px-4 py-2 ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
              >
                <span
                  className={`text-lg font-bold mr-1 ${theme === "dark" ? "text-white" : "text-black"}`}
                >
                  ₫
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editForm.amount}
                  onChange={(e) => {
                    const raw = e.target.value
                      .replace(/\./g, "")
                      .replace(/\D/g, "");
                    if (!raw) {
                      setEditForm({ ...editForm, amount: "" });
                      return;
                    }
                    setEditForm({
                      ...editForm,
                      amount: Number(raw).toLocaleString("vi-VN"),
                    });
                  }}
                  className={`flex-1 bg-transparent py-2 outline-none font-bold text-xl w-full ${theme === "dark" ? "text-white" : "text-black"}`}
                />
              </div>

              <button
                onClick={() =>
                  setEditForm({
                    ...editForm,
                    type: editForm.type === "expense" ? "income" : "expense",
                  })
                }
                className={`px-4 rounded-2xl font-bold w-24 transition-colors ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-100 text-black"}`}
              >
                {editForm.type === "expense" ? "Credit" : "Cash"}
              </button>
            </div>

            <div className="flex overflow-x-auto gap-2 py-1 mb-4 scrollbar-hide">
              {categories
                .filter((c) => c.type === editForm.type)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setEditForm({ ...editForm, category: cat })}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-colors flex-shrink-0 border-2 ${editForm.category?.id === cat.id ? `border-[${cat.color}]` : "border-transparent"} ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
                    style={{
                      borderColor:
                        editForm.category?.id === cat.id
                          ? cat.color
                          : "transparent",
                    }}
                  >
                    <span className="text-base">{cat.icon}</span>
                    <span
                      className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}
                    >
                      {cat.name}
                    </span>
                  </button>
                ))}
            </div>

            <input
              type="text"
              placeholder="Note"
              value={editForm.note}
              onChange={(e) =>
                setEditForm({ ...editForm, note: e.target.value })
              }
              className={`w-full rounded-2xl px-4 py-4 mb-4 outline-none font-medium ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-100 text-black"}`}
            />

            <div className="flex gap-2 mb-6">
              <div
                className={`flex-1 relative rounded-xl flex items-center justify-center py-2.5 ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
              >
                <span
                  className={`font-semibold text-xs flex items-center gap-1.5 ${theme === "dark" ? "text-[#32ade6]" : "text-blue-500"}`}
                >
                  <Calendar size={14} />{" "}
                  {new Date(editForm.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <input
                  type="date"
                  value={editForm.date.split("T")[0]}
                  onChange={(e) => {
                    const d = new Date(editForm.date);
                    const [y, m, day] = e.target.value.split("-");
                    d.setFullYear(y, m - 1, day);
                    setEditForm({ ...editForm, date: d.toISOString() });
                  }}
                  className="absolute inset-0 opacity-0 z-20 w-full h-full"
                />
              </div>
              <div
                className={`flex-1 relative rounded-xl flex items-center justify-center py-2.5 ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
              >
                <span
                  className={`font-semibold text-xs flex items-center gap-1.5 ${theme === "dark" ? "text-[#32ade6]" : "text-blue-500"}`}
                >
                  <Clock size={14} />{" "}
                  {new Date(editForm.date).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
                <input
                  type="time"
                  value={new Date(editForm.date).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                  onChange={(e) => {
                    const d = new Date(editForm.date);
                    const [h, m] = e.target.value.split(":");
                    d.setHours(h, m);
                    setEditForm({ ...editForm, date: d.toISOString() });
                  }}
                  className="absolute inset-0 opacity-0 z-20 w-full h-full"
                />
              </div>
              <div
                className={`flex-1 relative rounded-xl flex items-center justify-center py-2.5 ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
              >
                <span
                  className={`font-semibold text-xs flex items-center gap-1.5 ${theme === "dark" ? "text-[#32ade6]" : "text-blue-500"}`}
                >
                  <Repeat size={14} /> Once
                </span>
              </div>
              <button
                onClick={handleDeleteTransaction}
                className={`w-[46px] flex items-center justify-center rounded-xl py-2.5 ${theme === "dark" ? "bg-[#ff453a]/20 text-[#ff453a]" : "bg-red-100 text-red-500"}`}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <button
              onClick={saveTransaction}
              className={`w-full py-3.5 rounded-2xl font-bold text-[17px] active:scale-[0.98] transition-transform ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </>
  );
}
