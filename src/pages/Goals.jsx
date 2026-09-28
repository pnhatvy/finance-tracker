import { useAppContext } from "../AppContext";
import { Edit2 } from "lucide-react";
import { useState } from "react";

export default function Goals() {
  const {
    monthlyBudget,
    setMonthlyBudget,
    monthlyIncomeGoal,
    setMonthlyIncomeGoal,
    setIsModalOpen,
    theme,
  } = useAppContext();
  const [editingType, setEditingType] = useState(null);
  const [tempValue, setTempValue] = useState("");

  const openEdit = (type, currentVal) => {
    setEditingType(type);
    setTempValue(currentVal.toString());
    setIsModalOpen(true);
  };
  const closeEdit = () => {
    setEditingType(null);
    setIsModalOpen(false);
  };
  const handleSave = () => {
    const val = Number(tempValue.replace(/\./g, ""));
    if (editingType === "expense") setMonthlyBudget(val || 0);
    else setMonthlyIncomeGoal(val || 0);
    closeEdit();
  };
  const formatCurrency = (val) => {
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  return (
    <div
      className={`h-[100dvh] w-full flex flex-col relative overflow-hidden animate-ios-page ${theme === "dark" ? "bg-black text-white" : "bg-[#f2f2f7] text-black"}`}
    >
      <div
        className={`flex-shrink-0 z-40 px-4 pb-3 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] ${theme === "dark" ? "bg-black/90 shadow-[0_1px_0_0_rgba(255,255,255,0.05)] text-white" : "bg-[#f2f2f7]/90 text-black"}`}
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <h1 className="text-[22px] font-bold w-full text-center tracking-tight">
          Goals
        </h1>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-4 overscroll-y-auto"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          className={`rounded-2xl p-5 ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[#8e8e93] text-sm font-semibold">
              Expense Budget
            </span>
            <button
              onClick={() => openEdit("expense", monthlyBudget)}
              className="text-[#8e8e93] p-1 active:opacity-50"
            >
              <Edit2 size={16} />
            </button>
          </div>
          <div className="text-[26px] font-bold tracking-tight mb-3">
            ₫{monthlyBudget.toLocaleString("vi-VN")}
          </div>
          <div
            className={`h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-200"}`}
          >
            <div className="h-full bg-[#ff453a] rounded-full w-[30%]"></div>
          </div>
        </div>

        <div
          className={`rounded-2xl p-5 ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[#8e8e93] text-sm font-semibold">
              Income Goal
            </span>
            <button
              onClick={() => openEdit("income", monthlyIncomeGoal)}
              className="text-[#8e8e93] p-1 active:opacity-50"
            >
              <Edit2 size={16} />
            </button>
          </div>
          <div className="text-[26px] font-bold tracking-tight mb-3">
            ₫{monthlyIncomeGoal.toLocaleString("vi-VN")}
          </div>
          <div
            className={`h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-200"}`}
          >
            <div className="h-full bg-[#32d74b] rounded-full w-[10%]"></div>
          </div>
        </div>
      </div>

      {editingType && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-ios-fade"
          onClick={closeEdit}
        >
          <div
            className={`w-full max-w-[300px] rounded-3xl p-6 shadow-2xl ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-center mb-6 text-lg">
              Edit {editingType === "expense" ? "Budget" : "Income Goal"}
            </h2>
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8e93] text-lg font-bold">
                ₫
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={formatCurrency(tempValue)}
                onChange={(e) =>
                  setTempValue(e.target.value.replace(/\./g, ""))
                }
                className={`w-full text-lg font-bold rounded-xl pl-10 pr-4 py-3 outline-none ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-gray-100 text-black"}`}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={closeEdit}
                className={`flex-1 py-3 rounded-2xl font-bold ${theme === "dark" ? "bg-[#3a3a3c] text-white" : "bg-gray-200 text-black"}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`flex-1 py-3 rounded-2xl font-bold ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
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
