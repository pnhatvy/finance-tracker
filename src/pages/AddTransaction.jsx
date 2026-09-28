import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { X, Delete, Calendar, Repeat } from "lucide-react";
import { useAppContext } from "../AppContext";

export default function AddTransaction() {
  const navigate = useNavigate();
  // KHAI BÁO THÊM THEME Ở ĐÂY
  const { categories, theme } = useAppContext();

  const [amount, setAmount] = useState("0");
  const [type, setType] = useState("expense");
  const [note, setNote] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [repeat, setRepeat] = useState("none");

  const safeCategories = categories.map((c) => ({
    ...c,
    type: c.type || "expense",
  }));
  const currentCategories = safeCategories.filter((c) => c.type === type);
  const [category, setCategory] = useState(currentCategories[0] || {});

  const [startY, setStartY] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const onTouchStart = (e) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };
  const onTouchMove = (e) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) setDragY(diff);
  };
  const onTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) navigate("/");
    else setDragY(0);
  };

  useEffect(() => {
    setCategory(currentCategories[0] || {});
  }, [type, categories]);

  const handleKeyPress = (val) => {
    if (val === ",") {
      if (!amount.includes(",")) setAmount(amount + ",");
    } else {
      if (amount === "0") setAmount(val);
      else if (amount.length < 12) setAmount(amount + val);
    }
  };
  const handleDelete = () => {
    if (amount.length <= 1) setAmount("0");
    else setAmount(amount.slice(0, -1));
  };

  const handleSave = async () => {
    if (amount === "0" || amount === ",") return;
    try {
      const numericAmount = Number(amount.replace(",", "."));
      const baseDate = new Date(txDate);
      baseDate.setHours(new Date().getHours(), new Date().getMinutes());
      let count = 1;
      if (repeat === "daily") count = 30;
      if (repeat === "weekly") count = 12;
      if (repeat === "monthly") count = 12;
      if (repeat === "yearly") count = 5;
      const docsToAdd = [];
      const groupId = "rep_" + Date.now();
      for (let i = 0; i < count; i++) {
        const d = new Date(baseDate);
        if (repeat === "daily") d.setDate(d.getDate() + i);
        if (repeat === "weekly") d.setDate(d.getDate() + i * 7);
        if (repeat === "monthly") d.setMonth(d.getMonth() + i);
        if (repeat === "yearly") d.setFullYear(d.getFullYear() + i);
        docsToAdd.push({
          amount: numericAmount,
          type: type,
          note:
            note ||
            category.name ||
            (type === "expense" ? "Expense" : "Income"),
          category: category,
          date: d.toISOString(),
          recurringId: repeat !== "none" ? groupId : null,
        });
      }
      await Promise.all(
        docsToAdd.map((data) => addDoc(collection(db, "transactions"), data)),
      );
      navigate("/");
    } catch (e) {}
  };

  const displayAmount = () => {
    if (amount === "0") return "0";
    const parts = amount.split(",");
    return parts.length > 1
      ? `${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${parts[1]}`
      : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div
      className={`flex flex-col h-[100dvh] p-5 animate-ios-slide overflow-hidden ${theme === "dark" ? "bg-black text-white" : "bg-[#f2f2f7] text-black"}`}
      style={{
        transform: dragY > 0 ? `translateY(${dragY}px)` : "",
        transition: isDragging
          ? "none"
          : "transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
        paddingTop: "max(env(safe-area-inset-top), 20px)",
      }}
    >
      <div
        className="w-full flex justify-center py-2 mb-2 touch-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className={`w-14 h-1.5 rounded-full ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-300"}`}
        ></div>
      </div>

      <div className="flex justify-between items-center mb-5">
        <button
          onClick={() => navigate("/")}
          className={`p-1 active:opacity-50 flex-shrink-0 w-[42px] ${theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
        >
          <X size={26} />
        </button>
        <div
          className={`relative flex rounded-full p-1 w-[200px] ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-gray-200"}`}
        >
          <div
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out ${type === "expense" ? "translate-x-0 bg-[#ff453a]" : "translate-x-[100%] bg-[#32d74b]"}`}
          ></div>
          <button
            onClick={() => setType("expense")}
            className={`relative z-10 flex-1 py-1.5 text-sm font-semibold transition-colors duration-300 ${type === "expense" ? "text-white" : "text-[#8e8e93]"}`}
          >
            Expense
          </button>
          <button
            onClick={() => setType("income")}
            className={`relative z-10 flex-1 py-1.5 text-sm font-semibold transition-colors duration-300 ${type === "income" ? "text-white" : "text-[#8e8e93]"}`}
          >
            Income
          </button>
        </div>
        <div className="w-[42px] flex-shrink-0"></div>
      </div>

      <div className="flex overflow-x-auto flex-nowrap gap-2.5 py-1 mb-3 scrollbar-hide items-center min-h-[50px]">
        {currentCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 ${category.id === cat.id ? (theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-200") : theme === "dark" ? "bg-[#1c1c1e] text-[#8e8e93]" : "bg-white text-gray-500"}`}
            style={{
              border:
                category.id === cat.id
                  ? `1.5px solid ${cat.color}`
                  : "1.5px solid transparent",
            }}
          >
            <span className="text-base">{cat.icon}</span>
            <span
              className={`text-sm font-semibold ${category.id === cat.id ? (theme === "dark" ? "text-white" : "text-black") : theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
            >
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[100px]">
        <span
          className={`text-xs uppercase tracking-wider mb-1 font-medium ${theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
        >
          Amount
        </span>
        <div className="text-[56px] font-bold tracking-tight flex items-baseline">
          <span
            className={`text-4xl mr-1 underline underline-offset-8 ${theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
          >
            ₫
          </span>
          <span>{displayAmount()}</span>
        </div>
        <input
          type="text"
          placeholder="+ Add note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={`mt-4 bg-transparent text-center focus:outline-none w-3/4 py-1.5 ${theme === "dark" ? "text-[#8e8e93] placeholder:text-[#8e8e93]/50" : "text-gray-600 placeholder:text-gray-400"}`}
        />
      </div>

      <div className="flex gap-3 mb-4 mt-auto">
        <div
          className={`flex-1 relative rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <span
            className={`font-semibold text-[13px] flex items-center gap-2 pointer-events-none ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            <Calendar size={16} className="text-[#32ade6]" />{" "}
            {new Date(txDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <input
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
            className="absolute inset-0 opacity-0 z-20 w-full h-full"
          />
        </div>
        <div
          className={`flex-1 relative rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
        >
          <span
            className={`font-semibold text-[13px] flex items-center gap-2 pointer-events-none capitalize ${theme === "dark" ? "text-white" : "text-black"}`}
          >
            <Repeat size={16} className="text-[#32ade6]" />{" "}
            {repeat === "none" ? "No Repeat" : repeat}
          </span>
          <select
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            className="absolute inset-0 opacity-0 z-20 w-full h-full"
          >
            <option value="none">No Repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            className={`py-3 rounded-2xl text-2xl font-semibold active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black shadow-sm"}`}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => handleKeyPress(",")}
          className={`py-3 rounded-2xl text-2xl font-semibold active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black shadow-sm"}`}
        >
          ,
        </button>
        <button
          onClick={() => handleKeyPress("0")}
          className={`py-3 rounded-2xl text-2xl font-semibold active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black shadow-sm"}`}
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className={`py-3 rounded-2xl flex items-center justify-center active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-[#8e8e93]" : "bg-white text-gray-500 shadow-sm"}`}
        >
          <Delete size={26} />
        </button>
      </div>

      <button
        onClick={handleSave}
        className={`w-full py-3.5 rounded-full font-bold text-[17px] active:scale-[0.98] transition-transform flex-shrink-0 ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
      >
        Save
      </button>
    </div>
  );
}
