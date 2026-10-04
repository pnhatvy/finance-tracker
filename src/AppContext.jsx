import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("vys_theme") || "light";
  });

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

  const [cycleStartDay, setCycleStartDay] = useState(() => {
    const saved = localStorage.getItem("vys_cycle_day");
    return saved ? Number(saved) : 1;
  });

  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const saved = localStorage.getItem("vys_budget");
    return saved ? Number(saved) : 9700000;
  });

  const [monthlyIncomeGoal, setMonthlyIncomeGoal] = useState(() => {
    const saved = localStorage.getItem("vys_goal");
    return saved ? Number(saved) : 15000000;
  });

  // TÍNH NĂNG MỚI: Lương theo giờ (Quy đổi giờ công)
  const [workHourlyRate, setWorkHourlyRate] = useState(() => {
    const saved = localStorage.getItem("vys_hourly_rate");
    return saved ? Number(saved) : 0; // Nếu bằng 0 thì sẽ ẩn tính năng này
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

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
  useEffect(() => {
    localStorage.setItem("vys_hourly_rate", workHourlyRate);
  }, [workHourlyRate]);

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
        workHourlyRate,
        setWorkHourlyRate,
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
