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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
      <div
        className={`flex justify-between items-center px-2 py-2 rounded-full transition-colors duration-300 ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]"}`}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.id;

          // Nút Add to đùng ở giữa
          if (item.isAdd) {
            return (
              <button
                key={item.id}
                onClick={() => navigate("/add")}
                className="w-12 h-12 bg-[#32d74b] rounded-full flex items-center justify-center active:scale-95 transition-transform flex-shrink-0 shadow-md"
              >
                <item.icon size={28} color="black" strokeWidth={2.5} />
              </button>
            );
          }

          // Các nút còn lại
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className="flex flex-col items-center justify-center w-14 active:scale-95 transition-transform"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300 ${isActive ? (theme === "dark" ? "bg-[#3a3a3c]" : "bg-gray-100") : "bg-transparent"}`}
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
                />
              </div>
              <span
                className={`text-[10px] font-semibold mt-0.5 ${isActive ? (theme === "dark" ? "text-white" : "text-black") : theme === "dark" ? "text-[#8e8e93]" : "text-gray-400"}`}
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
