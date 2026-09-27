import { Link, useLocation } from "react-router-dom";
import { List, PieChart, Target, Plus, Settings } from "lucide-react";
import { useAppContext } from "../AppContext";

export default function BottomNav() {
  const location = useLocation();
  const { isModalOpen } = useAppContext();
  const path = location.pathname;

  if (path === "/add" || isModalOpen) return null;

  const tabs = [
    { to: "/", icon: <List size={22} />, label: "History" },
    { to: "/analytics", icon: <PieChart size={22} />, label: "Analytics" },
    {
      to: "/add",
      icon: <Plus size={28} strokeWidth={3} className="text-black" />,
      label: "Add",
      isSpecial: true,
    },
    { to: "/goals", icon: <Target size={22} />, label: "Goals" },
    { to: "/settings", icon: <Settings size={22} />, label: "Settings" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] z-40">
      <div className="bg-[#1c1c1e]/85 backdrop-blur-xl border border-white/10 rounded-full p-2 flex justify-between items-center shadow-2xl relative">
        {tabs.map((tab) => {
          const isActive = path === tab.to;
          if (tab.isSpecial) {
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className="relative z-10 mx-1 flex flex-col items-center justify-center w-14 h-14 bg-[#32d74b] rounded-full shadow-[0_0_15px_rgba(50,215,75,0.3)] active:scale-95 transition-transform"
              >
                {tab.icon}
              </Link>
            );
          }
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className="relative z-10 flex flex-col items-center justify-center w-[18%] h-14 rounded-full transition-all duration-300"
            >
              <div
                className={`absolute inset-0 rounded-full transition-all duration-300 ${isActive ? "bg-white/10 scale-100" : "bg-transparent scale-50 opacity-0"}`}
              ></div>
              <div
                className={`relative z-20 flex flex-col items-center gap-1 transition-colors duration-300 ${isActive ? "text-white" : "text-textSub hover:text-white/70"}`}
              >
                {tab.icon}
                <span className="text-[9px] font-bold tracking-wide">
                  {tab.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
