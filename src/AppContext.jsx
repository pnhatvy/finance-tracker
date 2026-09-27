import { createContext, useState, useEffect, useContext } from "react";

const AppContext = createContext();

const defaultCategories = [
  { id: "food", name: "Food", icon: "🍔", color: "#ff453a", type: "expense" },
  {
    id: "transport",
    name: "Transport",
    icon: "🚕",
    color: "#32ade6",
    type: "expense",
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: "🛍️",
    color: "#ff9f0a",
    type: "expense",
  },
  {
    id: "salary",
    name: "Salary",
    icon: "💰",
    color: "#32d74b",
    type: "income",
  },
  { id: "gift", name: "Gift", icon: "🎁", color: "#bf5af2", type: "income" },
];

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [categories, setCategories] = useState(() => {
    const localData = JSON.parse(localStorage.getItem("categories"));
    if (!localData || localData.length === 0) return defaultCategories;
    const upgraded = localData.map((c) => ({
      ...c,
      type: c.type || "expense",
    }));
    if (!upgraded.some((c) => c.type === "income")) {
      upgraded.push({
        id: "salary",
        name: "Salary",
        icon: "💰",
        color: "#32d74b",
        type: "income",
      });
    }
    return upgraded;
  });

  const [cycleStartDay, setCycleStartDay] = useState(
    Number(localStorage.getItem("cycleStartDay")) || 1,
  );
  const [monthlyBudget, setMonthlyBudget] = useState(
    Number(localStorage.getItem("monthlyBudget")) || 9700000,
  );
  const [monthlyIncomeGoal, setMonthlyIncomeGoal] = useState(
    Number(localStorage.getItem("monthlyIncomeGoal")) || 15000000,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(
    () => localStorage.setItem("categories", JSON.stringify(categories)),
    [categories],
  );
  useEffect(
    () => localStorage.setItem("cycleStartDay", cycleStartDay),
    [cycleStartDay],
  );

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        categories,
        setCategories,
        cycleStartDay,
        setCycleStartDay,
        monthlyBudget,
        setMonthlyBudget,
        monthlyIncomeGoal,
        setMonthlyIncomeGoal,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {/* BỘ ENGINE CSS HIỆU ỨNG iOS 27 CHO TOÀN APP */}
      <style>{`
        @keyframes iosPage { 0% { opacity: 0; transform: scale(0.96) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-ios-page { animation: iosPage 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes iosSlide { 0% { transform: translateY(100%); } 100% { transform: translateY(0); } }
        .animate-ios-slide { animation: iosSlide 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        @keyframes iosFade { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-ios-fade { animation: iosFade 0.3s ease-out forwards; }
        
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; outline: none; -webkit-tap-highlight-color: transparent; }
      `}</style>

      {children}
    </AppContext.Provider>
  );
}
export const useAppContext = () => useContext(AppContext);
