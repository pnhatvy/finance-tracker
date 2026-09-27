import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./AppContext";
import BottomNav from "./components/BottomNav";
import History from "./pages/History";
import AddTransaction from "./pages/AddTransaction";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import Goals from "./pages/Goals"; // Thêm dòng này

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="pb-24 min-h-screen bg-appBg text-[var(--text-primary)]">
          <Routes>
            <Route path="/" element={<History />} />
            <Route path="/add" element={<AddTransaction />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/analytics" element={<Analytics />} />

            {/* Sửa lại dòng này thành Component Goals */}
            <Route path="/goals" element={<Goals />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
