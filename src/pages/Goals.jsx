import { useEffect, useState } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAppContext } from "../AppContext";
import { Target, Edit3 } from "lucide-react";

export default function Goals() {
  const {
    cycleStartDay,
    monthlyBudget,
    setMonthlyBudget,
    monthlyIncomeGoal,
    setMonthlyIncomeGoal,
    setIsModalOpen,
  } = useAppContext();

  const [spentThisMonth, setSpentThisMonth] = useState(0);
  const [earnedThisMonth, setEarnedThisMonth] = useState(0);
  const [modalType, setModalType] = useState(null);
  const [tempValue, setTempValue] = useState("");

  useEffect(() => {
    const q = query(collection(db, "transactions"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let spent = 0,
        earned = 0;
      const now = new Date();
      let startCycle = new Date(
        now.getFullYear(),
        now.getMonth(),
        cycleStartDay,
      );
      if (now.getDate() < cycleStartDay)
        startCycle.setMonth(startCycle.getMonth() - 1);
      let endCycle = new Date(startCycle);
      endCycle.setMonth(endCycle.getMonth() + 1);

      snapshot.forEach((doc) => {
        const item = doc.data();
        const itemDate = new Date(item.date);
        if (itemDate >= startCycle && itemDate < endCycle) {
          if (item.type === "expense") spent += item.amount;
          if (item.type === "income") earned += item.amount;
        }
      });
      setSpentThisMonth(spent);
      setEarnedThisMonth(earned);
    });
    return () => unsubscribe();
  }, [cycleStartDay]);

  const openModal = (type) => {
    const val = type === "budget" ? monthlyBudget : monthlyIncomeGoal;
    setTempValue(val.toString().replace(".", ","));
    setModalType(type);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setModalType(null);
    setIsModalOpen(false);
  };

  const handleSaveModal = () => {
    const val = Number(tempValue.replace(",", "."));
    if (val > 0) {
      if (modalType === "budget") setMonthlyBudget(val);
      if (modalType === "income") setMonthlyIncomeGoal(val);
    }
    closeModal();
  };

  const displayAmount = (val) => {
    if (!val) return "";
    const parts = val.toString().split(",");
    return parts.length > 1
      ? `${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${parts[1]}`
      : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div className="p-4 pt-12 max-w-md mx-auto min-h-screen pb-24 bg-black text-white animate-ios-page">
      <div className="flex items-center justify-center gap-2 mb-8">
        <Target size={28} className="text-[#32ade6]" />
        <h1 className="text-[28px] font-bold tracking-tight">Goals</h1>
      </div>

      <div className="bg-[#1c1c1e] rounded-xl p-5 mb-5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-[#8e8e93] text-xs font-semibold mb-1">
              Expense Budget
            </p>
            <div className="text-[22px] font-bold tracking-tight">
              ₫{monthlyBudget.toLocaleString("vi-VN")}
            </div>
          </div>
          <button
            onClick={() => openModal("budget")}
            className="p-2 bg-[#2c2c2e] text-white rounded-full active:opacity-50"
          >
            <Edit3 size={18} />
          </button>
        </div>
        <div className="h-1.5 w-full bg-[#2c2c2e] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${Math.min((spentThisMonth / monthlyBudget) * 100, 100)}%`,
              backgroundColor:
                spentThisMonth > monthlyBudget ? "#ff453a" : "#ffd60a",
            }}
          ></div>
        </div>
      </div>

      <div className="bg-[#1c1c1e] rounded-xl p-5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-[#8e8e93] text-xs font-semibold mb-1">
              Income Goal
            </p>
            <div className="text-[22px] font-bold tracking-tight">
              ₫{monthlyIncomeGoal.toLocaleString("vi-VN")}
            </div>
          </div>
          <button
            onClick={() => openModal("income")}
            className="p-2 bg-[#2c2c2e] text-white rounded-full active:opacity-50"
          >
            <Edit3 size={18} />
          </button>
        </div>
        <div className="h-1.5 w-full bg-[#2c2c2e] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${Math.min((earnedThisMonth / monthlyIncomeGoal) * 100, 100)}%`,
              backgroundColor: "#32d74b",
            }}
          ></div>
        </div>
      </div>

      {modalType && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-ios-fade"
          onClick={closeModal}
        >
          <div
            className="bg-[#2c2c2e] w-full max-w-[320px] rounded-3xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white font-semibold text-center mb-4 text-lg">
              {modalType === "budget" ? "Expense Budget" : "Income Goal"}
            </h2>
            <input
              type="text"
              inputMode="decimal"
              value={displayAmount(tempValue)}
              onChange={(e) => {
                let val = e.target.value
                  .replace(/\./g, "")
                  .replace(/[^0-9,]/g, "");
                if (val.split(",").length > 2) val = val.slice(0, -1);
                setTempValue(val);
              }}
              className="w-full bg-[#1c1c1e] text-white text-center text-xl font-medium rounded-xl px-4 py-3 outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 bg-[#3a3a3c] text-white py-2.5 rounded-xl font-semibold active:opacity-70"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveModal}
                className="flex-1 bg-white text-black py-2.5 rounded-xl font-semibold active:opacity-70"
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
