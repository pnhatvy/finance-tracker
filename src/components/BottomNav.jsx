import { useNavigate, useLocation } from "react-router-dom";
import { List, PieChart, Plus, Target, Settings } from "lucide-react";
import { useAppContext } from "../AppContext";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useAppContext();

  const navItems = [
    { id: "/", icon: List, label: "History" },
    { id: "/analytics", icon: PieChart, label: "Analytics" },
    { id: "add", icon: Plus, label: "Add", isAdd: true },
    { id: "/goals", icon: Target, label: "Goals" },
    { id: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[360px]">
      <div
        className={`flex justify-between items-center px-4 py-3 rounded-[32px] transition-colors duration-300 ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]"}`}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.id;

          if (item.isAdd) {
            return (
              <button
                key={item.id}
                onClick={() => navigate("/add")}
                className="w-[42px] h-[42px] bg-[#32d74b] rounded-full flex items-center justify-center active:scale-95 transition-transform flex-shrink-0 shadow-sm mx-1"
              >
                <item.icon size={24} color="black" strokeWidth={3} />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform w-[52px]"
            >
              <item.icon
                size={22}
                className={
                  isActive
                    ? theme === "dark"
                      ? "text-white"
                      : "text-black"
                    : theme === "dark"
                      ? "text-[#8e8e93]"
                      : "text-gray-400"
                }
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-semibold leading-none ${isActive ? (theme === "dark" ? "text-white" : "text-black") : theme === "dark" ? "text-[#8e8e93]" : "text-gray-400"}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
