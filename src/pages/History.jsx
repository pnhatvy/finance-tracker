import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Trash2,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Repeat,
} from "lucide-react";
import { useAppContext } from "../AppContext";

// --- COMPONENT VUỐT ĐỂ HIỆN NÚT EDIT/DELETE ---
const SwipeableItem = ({ children, onEdit, onDelete, isLast }) => {
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };
  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const diff = e.touches[0].clientX - startX;
    if (diff > 80) setOffsetX(80);
    else if (diff < -80) setOffsetX(-80);
    else setOffsetX(diff);
  };
  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (offsetX > 50) {
      onEdit();
      setOffsetX(0);
    } else if (offsetX < -50) {
      onDelete();
      setOffsetX(0);
    } else {
      setOffsetX(0);
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-black">
      <div className="absolute inset-0 flex justify-between items-center px-6 bg-[#1c1c1e]">
        <div className="text-[#32ade6] font-semibold flex items-center gap-2">
          Edit
        </div>
        <div className="text-[#ff453a] font-semibold flex items-center gap-2">
          <Trash2 size={18} />
        </div>
      </div>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative bg-black w-full transition-transform duration-200 ease-out flex items-center py-3.5 px-4 ${!isLast ? "border-b border-[#1c1c1e]" : ""}`}
        style={{ transform: `translateX(${offsetX}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [timeFilter, setTimeFilter] = useState("month");
  const { categories, setIsModalOpen, cycleStartDay } = useAppContext();

  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [offset, setOffset] = useState(0);

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

    if (timeFilter === "today") {
      base.setDate(base.getDate() + offset);
      start = new Date(base.setHours(0, 0, 0, 0));
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      label = `${months[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
    } else if (timeFilter === "week") {
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
    }
    return { start, end, label };
  };

  const bounds = timeFilter !== "all" ? getPeriodBounds() : null;

  const filteredTransactions = transactions.filter((tItem) => {
    if (timeFilter === "all") return true;
    if (!tItem.date) return false;
    const d = new Date(tItem.date);
    return d >= bounds.start && d < bounds.end;
  });

  const groupedData = filteredTransactions.reduce((acc, tran) => {
    const d = tran.date ? new Date(tran.date) : new Date();
    d.setHours(0, 0, 0, 0);
    const dateKey = d.toISOString();
    if (!acc[dateKey]) acc[dateKey] = { date: d, items: [], totalDay: 0 };
    acc[dateKey].items.push(tran);
    acc[dateKey].totalDay +=
      tran.type === "expense" ? -tran.amount : tran.amount;
    return acc;
  }, {});
  const sortedGroups = Object.values(groupedData).sort(
    (a, b) => b.date - a.date,
  );

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteDoc(doc(db, "transactions", itemToDelete));
      setItemToDelete(null);
    }
  };

  const openEdit = (item) => {
    const d = item.date ? new Date(item.date) : new Date();
    setEditingItem({
      ...item,
      amount: item.amount ? item.amount.toString().replace(".", ",") : "0",
      editDate: d.toISOString().split("T")[0],
      editTime: d.toTimeString().slice(0, 5),
      type: item.type || "expense",
      repeat: "none",
    });
    setIsModalOpen(true);
  };
  const closeEdit = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editingItem.amount || editingItem.amount === ",") return;
    try {
      const combinedDateTime = new Date(
        `${editingItem.editDate}T${editingItem.editTime}:00`,
      );
      const numericAmount = Number(
        editingItem.amount.toString().replace(",", "."),
      );

      await updateDoc(doc(db, "transactions", editingItem.id), {
        amount: numericAmount,
        type: editingItem.type,
        note: editingItem.note,
        category: editingItem.category,
        date: combinedDateTime.toISOString(),
      });

      if (editingItem.repeat !== "none") {
        let count = 0;
        if (editingItem.repeat === "daily") count = 30;
        if (editingItem.repeat === "weekly") count = 12;
        if (editingItem.repeat === "monthly") count = 12;
        if (editingItem.repeat === "yearly") count = 5;

        const docsToAdd = [];
        const groupId = "rep_" + Date.now();
        for (let i = 1; i <= count; i++) {
          const d = new Date(combinedDateTime);
          if (editingItem.repeat === "daily") d.setDate(d.getDate() + i);
          if (editingItem.repeat === "weekly") d.setDate(d.getDate() + i * 7);
          if (editingItem.repeat === "monthly") d.setMonth(d.getMonth() + i);
          if (editingItem.repeat === "yearly")
            d.setFullYear(d.getFullYear() + i);
          docsToAdd.push({
            amount: numericAmount,
            type: editingItem.type,
            note: editingItem.note,
            category: editingItem.category,
            date: d.toISOString(),
            recurringId: groupId,
          });
        }
        await Promise.all(
          docsToAdd.map((data) => addDoc(collection(db, "transactions"), data)),
        );
      }
      closeEdit();
    } catch (e) {}
  };

  const toggleEditType = () => {
    const newType = editingItem.type === "expense" ? "income" : "expense";
    setEditingItem({
      ...editingItem,
      type: newType,
      category: categories.filter((c) => c.type === newType)[0] || {},
    });
  };

  const formatDisplayAmount = (val) => {
    if (!val) return "";
    const parts = val.toString().split(",");
    return parts.length > 1
      ? `${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${parts[1]}`
      : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const formatGroupHeader = (d) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) return "TODAY";
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    const months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  };

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-black text-white relative animate-ios-page">
      {/* HEADER CỐ ĐỊNH + KÍNH MỜ */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl pt-12 pb-3 px-4 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
        <h1 className="text-[28px] font-bold w-full text-center mb-5 tracking-tight">
          History
        </h1>
        <div className="flex justify-center gap-2">
          {[
            { id: "today", label: "Day" },
            { id: "week", label: "Week" },
            { id: "month", label: "Month" },
            { id: "all", label: "All" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                setTimeFilter(filter.id);
                setOffset(0);
              }}
              className={`flex-1 py-2 rounded-full text-[13px] font-bold transition-colors ${timeFilter === filter.id ? "bg-white text-black" : "bg-[#1c1c1e] text-[#8e8e93]"}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* DANH SÁCH CUỘN BÊN DƯỚI */}
      <div className="px-4 pt-5">
        {timeFilter !== "all" && (
          <div className="flex items-center justify-between bg-[#1c1c1e] rounded-2xl px-4 py-3 mb-6">
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
        )}

        <div className="w-full">
          {sortedGroups.map((group) => (
            <div key={group.date.toISOString()} className="mb-6 w-full">
              <div className="flex justify-between items-center mb-1 px-1">
                <span className="text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">
                  {formatGroupHeader(group.date)}
                </span>
                <span className="text-xs font-semibold text-[#8e8e93]">
                  ₫{Math.abs(group.totalDay).toLocaleString("vi-VN")}
                </span>
              </div>
              <div className="w-full rounded-2xl overflow-hidden bg-[#1c1c1e]">
                {group.items.map((tItem, index) => (
                  <SwipeableItem
                    key={tItem.id}
                    onEdit={() => openEdit(tItem)}
                    onDelete={() => setItemToDelete(tItem.id)}
                    isLast={index === group.items.length - 1}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-[42px] h-[42px] bg-black/50 rounded-full flex items-center justify-center text-[22px]">
                          {tItem.category?.icon || "💰"}
                        </div>
                        <div className="flex flex-col">
                          <p className="font-bold text-[16px] leading-tight text-white">
                            {tItem.category?.name || tItem.note}
                          </p>
                          <p className="text-[13px] text-[#8e8e93] mt-0.5 leading-tight">
                            {tItem.note}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <div className="font-bold text-[16px] leading-tight text-white">
                          {tItem.type === "income" ? "+" : ""}₫
                          {tItem.amount.toLocaleString("vi-VN")}
                        </div>
                        <div className="text-[12px] text-[#8e8e93] mt-0.5 leading-tight uppercase font-medium">
                          {tItem.date
                            ? new Date(tItem.date).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : ""}
                        </div>
                      </div>
                    </div>
                  </SwipeableItem>
                ))}
              </div>
            </div>
          ))}
          {sortedGroups.length === 0 && (
            <p className="text-center text-[#8e8e93] mt-12 text-sm">
              No transactions found.
            </p>
          )}
        </div>
      </div>

      {/* MODAL XÓA */}
      {itemToDelete && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-ios-fade"
          onClick={() => setItemToDelete(null)}
        >
          <div
            className="bg-[#2c2c2e] w-full max-w-[300px] rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white font-bold text-center text-lg mb-2">
              Delete Transaction?
            </h3>
            <p className="text-[#8e8e93] text-center text-sm mb-6">
              You cannot undo this action.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 bg-[#3a3a3c] text-white py-2.5 rounded-xl font-semibold active:opacity-70"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-[#ff453a] text-white py-2.5 rounded-xl font-semibold active:opacity-70"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex flex-col justify-end animate-ios-fade"
          onClick={closeEdit}
        >
          <div
            className="bg-[#1c1c1e] w-full max-w-md mx-auto rounded-t-[32px] p-6 shadow-2xl pb-10 animate-ios-slide"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white font-bold text-center mb-6 text-lg">
              Edit {editingItem.type === "expense" ? "Expense" : "Income"}
            </h2>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                inputMode="decimal"
                value={formatDisplayAmount(editingItem.amount)}
                onChange={(e) => {
                  let val = e.target.value
                    .replace(/\./g, "")
                    .replace(/[^0-9,]/g, "");
                  if (val.split(",").length > 2) val = val.slice(0, -1);
                  setEditingItem({ ...editingItem, amount: val });
                }}
                className="flex-1 bg-[#2c2c2e] text-white rounded-xl px-4 py-3 outline-none font-bold text-lg"
              />
              <button
                onClick={toggleEditType}
                className="bg-[#2c2c2e] text-white px-4 rounded-xl font-semibold text-sm"
              >
                {editingItem.type === "expense" ? "Credit" : "Debit"}
              </button>
            </div>

            <div className="flex overflow-x-auto flex-nowrap gap-3 mb-4 pb-2 scrollbar-hide">
              {categories
                .filter((c) => c.type === editingItem.type)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setEditingItem({ ...editingItem, category: cat })
                    }
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all border flex-shrink-0 ${editingItem.category?.id === cat.id ? "bg-[#2c2c2e]" : "bg-[#2c2c2e]/40 border-transparent text-[#8e8e93]"}`}
                    style={{
                      borderColor:
                        editingItem.category?.id === cat.id
                          ? cat.color
                          : "transparent",
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span
                      className={`text-sm font-semibold ${editingItem.category?.id === cat.id ? "text-white" : ""}`}
                    >
                      {cat.name}
                    </span>
                  </button>
                ))}
            </div>

            <input
              type="text"
              value={editingItem.note}
              onChange={(e) =>
                setEditingItem({ ...editingItem, note: e.target.value })
              }
              className="w-full bg-[#2c2c2e] text-white rounded-xl px-4 py-3 outline-none mb-4 font-medium"
            />

            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative bg-[#2c2c2e] rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity">
                <span className="text-white font-semibold text-[13px] flex items-center gap-1 pointer-events-none">
                  <Calendar size={14} className="text-[#32ade6]" />{" "}
                  {new Date(editingItem.editDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <input
                  type="date"
                  value={editingItem.editDate}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, editDate: e.target.value })
                  }
                  className="absolute inset-0 opacity-0 z-20 w-full h-full"
                />
              </div>
              <div className="flex-1 relative bg-[#2c2c2e] rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity">
                <span className="text-white font-semibold text-[13px] flex items-center gap-1 pointer-events-none">
                  <Clock size={14} className="text-[#32ade6]" />{" "}
                  {editingItem.editTime}
                </span>
                <input
                  type="time"
                  value={editingItem.editTime}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, editTime: e.target.value })
                  }
                  className="absolute inset-0 opacity-0 z-20 w-full h-full"
                />
              </div>
              <div className="flex-1 relative bg-[#2c2c2e] rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity">
                <span className="text-white font-semibold text-[13px] flex items-center gap-1 pointer-events-none capitalize">
                  <Repeat size={14} className="text-[#32ade6]" />{" "}
                  {editingItem.repeat === "none" ? "Once" : editingItem.repeat}
                </span>
                <select
                  value={editingItem.repeat}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, repeat: e.target.value })
                  }
                  className="absolute inset-0 opacity-0 z-20 w-full h-full"
                >
                  <option value="none">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeEdit}
                className="flex-1 bg-[#2c2c2e] text-white py-3.5 rounded-2xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-white text-black py-3.5 rounded-2xl font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
