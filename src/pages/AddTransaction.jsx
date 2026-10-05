import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Delete, Calendar, Repeat, Clock, Timer } from "lucide-react";
import { useAppContext } from "../AppContext";

export default function AddTransaction() {
  const navigate = useNavigate();
  const { categories, theme, workHourlyRate } = useAppContext();

  const [amount, setAmount] = useState("0");
  const [type, setType] = useState("expense");
  const [note, setNote] = useState("");
  const [repeat, setRepeat] = useState("none");

  // Trạng thái theo dõi lúc ông bấm vào ô Note
  const [isNoteFocused, setIsNoteFocused] = useState(false);

  // KHÓA CHIỀU CAO ĐỂ CHỐNG BÓP MÉO LAYOUT
  const [appHeight, setAppHeight] = useState("100dvh");
  const containerRef = useRef(null);

  useEffect(() => {
    // Chốt cứng chiều cao bằng pixel ngay khi mở app
    // Cách này ngăn trình duyệt tự bóp xẹp trang khi bàn phím ảo hiện lên
    if (typeof window !== "undefined") {
      setAppHeight(`${window.innerHeight}px`);
    }
  }, []);

  const getCurrentDate = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now - tzOffset).toISOString().slice(0, 10);
  };

  const getCurrentTime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now - tzOffset).toISOString().slice(11, 16);
  };

  const [datePart, setDatePart] = useState(getCurrentDate());
  const [timePart, setTimePart] = useState(getCurrentTime());

  const safeCategories = categories.map((c) => ({
    ...c,
    type: c.type || "expense",
  }));
  const currentCategories = safeCategories.filter((c) => c.type === type);
  const [category, setCategory] = useState(currentCategories[0] || {});

  // Logic vuốt để tắt Modal
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0,
      startX = 0,
      currentY = 0;
    let isDragging = false,
      isClosing = false,
      dragDirection = null;
    let rafId = null;

    const handleTouchStart = (e) => {
      if (isClosing) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
      dragDirection = null;
      container.style.transition = "none";
      container.style.animation = "none";
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

      if (dragDirection === "vertical" && diffY > 0) {
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
        setTimeout(() => navigate("/"), 300);
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
  }, [navigate]);

  const handleCloseButton = () => {
    if (containerRef.current) {
      containerRef.current.style.transition =
        "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)";
      containerRef.current.style.transform = `translate3d(0, 100dvh, 0)`;
    }
    setTimeout(() => navigate("/"), 300);
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

  const handleSave = () => {
    if (amount === "0" || amount === ",") return;
    try {
      const numericAmount = Number(amount.replace(",", "."));
      const baseDate = new Date(`${datePart}T${timePart}`);

      let count = 1;
      if (repeat === "daily") count = 30;
      if (repeat === "weekly") count = 12;
      if (repeat === "monthly") count = 12;
      if (repeat === "yearly") count = 5;

      const newTransactions = [];
      const groupId = "rep_" + Date.now();
      const existingData = JSON.parse(
        localStorage.getItem("vys_transactions") || "[]",
      );

      for (let i = 0; i < count; i++) {
        const d = new Date(baseDate);
        if (repeat === "daily") d.setDate(d.getDate() + i);
        if (repeat === "weekly") d.setDate(d.getDate() + i * 7);
        if (repeat === "monthly") d.setMonth(d.getMonth() + i);
        if (repeat === "yearly") d.setFullYear(d.getFullYear() + i);

        newTransactions.push({
          id: Date.now().toString() + "_" + i,
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

      const updated = [...newTransactions, ...existingData];
      localStorage.setItem("vys_transactions", JSON.stringify(updated));
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  const displayAmount = () => {
    if (amount === "0") return "0";
    const parts = amount.split(",");
    return parts.length > 1
      ? `${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${parts[1]}`
      : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const calculatedHours = () => {
    if (workHourlyRate <= 0 || amount === "0" || amount === ",") return null;
    const numericAmount = Number(amount.replace(",", "."));
    const hours = (numericAmount / workHourlyRate).toFixed(1);
    return hours > 0 ? hours : null;
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col p-5 overflow-hidden fixed top-0 left-0 w-full animate-ios-slide will-change-transform ${theme === "dark" ? "bg-black text-white" : "bg-[#f2f2f7] text-black"}`}
      style={{
        height: appHeight,
        paddingTop: "max(env(safe-area-inset-top), 20px)",
      }}
    >
      <div className="w-full flex justify-center py-2 mb-2 pointer-events-none flex-shrink-0">
        <div
          className={`w-14 h-1.5 rounded-full ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-300"}`}
        ></div>
      </div>

      <div className="flex justify-between items-center mb-5 flex-shrink-0">
        <button
          onClick={handleCloseButton}
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

      <div className="flex overflow-x-auto flex-nowrap gap-2.5 py-1 mb-3 scrollbar-hide items-center min-h-[50px] flex-shrink-0">
        {currentCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={(e) => {
              e.stopPropagation();
              setCategory(cat);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 ${category.id === cat.id ? (theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-200") : theme === "dark" ? "bg-[#1c1c1e] text-[#8e8e93]" : "bg-white text-gray-500"}`}
            style={{
              border:
                category.id === cat.id
                  ? `1.5px solid ${cat.color}`
                  : "1.5px solid transparent",
            }}
          >
            <span className="text-base pointer-events-none">{cat.icon}</span>
            <span
              className={`text-sm font-semibold pointer-events-none ${category.id === cat.id ? (theme === "dark" ? "text-white" : "text-black") : theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
            >
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[100px] relative flex-shrink-0">
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

        <div className="h-6 mt-1 flex items-center justify-center">
          {calculatedHours() && (
            <span
              className={`text-[13px] font-medium flex items-center gap-1.5 animate-ios-fade ${type === "expense" ? "text-[#ff453a]/80" : "text-[#32d74b]/80"}`}
            >
              <Timer size={14} />
              {type === "expense" ? "Costs" : "Equals"} {calculatedHours()}{" "}
              {calculatedHours() === "1.0" ? "hour" : "hours"} of work
            </span>
          )}
        </div>

        <input
          type="text"
          placeholder="+ Add note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onFocus={() => setIsNoteFocused(true)}
          onBlur={() => setIsNoteFocused(false)}
          onTouchStart={(e) => e.stopPropagation()}
          className={`mt-2 bg-transparent text-center focus:outline-none w-3/4 py-1.5 ${theme === "dark" ? "text-[#8e8e93] placeholder:text-[#8e8e93]/50" : "text-gray-600 placeholder:text-gray-400"}`}
        />
      </div>

      {/* 
        SỬ DỤNG OPACITY ĐỂ ẨN ĐI (TÀNG HÌNH) MÀ KHÔNG LÀM MẤT KHÔNG GIAN BỐ CỤC 
        Giúp Layout không bị đùn lên, không giật lag.
      */}
      <div
        className={`mt-auto flex flex-col flex-shrink-0 transition-opacity duration-300 ${isNoteFocused ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <div className="flex gap-2 mb-4">
          <div
            className={`flex-[1.2] relative rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <span
              className={`font-semibold text-[12px] flex items-center gap-1.5 pointer-events-none ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              <Calendar size={14} className="text-[#32ade6]" />
              {new Date(datePart).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            <input
              type="date"
              value={datePart}
              onChange={(e) => setDatePart(e.target.value)}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute inset-0 opacity-0 z-20 w-full h-full"
            />
          </div>
          <div
            className={`flex-1 relative rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <span
              className={`font-semibold text-[12px] flex items-center gap-1.5 pointer-events-none ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              <Clock size={14} className="text-[#32ade6]" />
              {timePart}
            </span>
            <input
              type="time"
              value={timePart}
              onChange={(e) => setTimePart(e.target.value)}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute inset-0 opacity-0 z-20 w-full h-full"
            />
          </div>
          <div
            className={`flex-1 relative rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <span
              className={`font-semibold text-[12px] flex items-center gap-1.5 pointer-events-none capitalize ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              <Repeat size={14} className="text-[#32ade6]" />
              {repeat === "none" ? "None" : repeat}
            </span>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute inset-0 opacity-0 z-20 w-full h-full"
            >
              <option value="none">None</option>
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
              onClick={(e) => {
                e.stopPropagation();
                handleKeyPress(num.toString());
              }}
              className={`py-3 rounded-2xl text-2xl font-semibold active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black shadow-sm"}`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleKeyPress(",");
            }}
            className={`py-3 rounded-2xl text-2xl font-semibold active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black shadow-sm"}`}
          >
            ,
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleKeyPress("0");
            }}
            className={`py-3 rounded-2xl text-2xl font-semibold active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black shadow-sm"}`}
          >
            0
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className={`py-3 rounded-2xl flex items-center justify-center active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-[#8e8e93]" : "bg-white text-gray-500 shadow-sm"}`}
          >
            <Delete size={26} />
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          className={`w-full py-3.5 rounded-full font-bold text-[17px] active:scale-[0.98] transition-transform ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
        >
          Save
        </button>
      </div>
    </div>
  );
}
