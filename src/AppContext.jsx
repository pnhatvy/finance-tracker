import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  // 1. Theme (Sáng / Tối)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("vys_theme") || "dark";
  });

  // 2. Danh mục Thu / Chi
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem("vys_categories");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "food",
        name: "Food",
        icon: "🍔",
        color: "#ff453a",
        type: "expense",
      },
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
      {
        id: "gift",
        name: "Gift",
        icon: "🎁",
        color: "#bf5af2",
        type: "income",
      },
    ];
  });

  // 3. Ngày bắt đầu chu kỳ ngân sách
  const [cycleStartDay, setCycleStartDay] = useState(() => {
    const saved = localStorage.getItem("vys_cycle_day");
    return saved ? Number(saved) : 1;
  });

  // 4. Ngân sách & Mục tiêu thu nhập
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const saved = localStorage.getItem("vys_budget");
    return saved ? Number(saved) : 9700000;
  });

  const [monthlyIncomeGoal, setMonthlyIncomeGoal] = useState(() => {
    const saved = localStorage.getItem("vys_goal");
    return saved ? Number(saved) : 15000000;
  });

  // Trạng thái Modal chung
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Tự động lưu vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    localStorage.setItem("vys_theme", theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem("vys_categories", JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem("vys_cycle_day", cycleStartDay);
  }, [cycleStartDay]);
  useEffect(() => {
    localStorage.setItem("vys_budget", monthlyBudget);
  }, [monthlyBudget]);
  useEffect(() => {
    localStorage.setItem("vys_goal", monthlyIncomeGoal);
  }, [monthlyIncomeGoal]);

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
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
