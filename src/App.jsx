import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AppProvider, useAppContext } from "./AppContext";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import AddTransaction from "./pages/AddTransaction";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";
import BottomNav from "./components/BottomNav";

function ThemeSync() {
  const { theme } = useAppContext();

  useEffect(() => {
    const bgColor = theme === "dark" ? "#000000" : "#f2f2f7";

    // 1. Đổi class gốc cho Tailwind
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    // 2. Ép màu nền HTML/Body
    document.documentElement.style.backgroundColor = bgColor;
    document.body.style.backgroundColor = bgColor;

    // 3. Ép màu Dynamic Island theo nút bấm trong app
    const metaThemeColor = document.getElementById("theme-color-meta");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", bgColor);
    }
  }, [theme]);

  return null;
}

function MainLayout({ children }) {
  return (
    <>
      <ThemeSync />
      {children}
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Đổi trang chủ thành Analytics */}
          <Route
            path="/"
            element={
              <MainLayout>
                <Analytics />
              </MainLayout>
            }
          />
          <Route
            path="/history"
            element={
              <MainLayout>
                <History />
              </MainLayout>
            }
          />
          <Route
            path="/goals"
            element={
              <MainLayout>
                <Goals />
              </MainLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <MainLayout>
                <Settings />
              </MainLayout>
            }
          />
          <Route
            path="/add"
            element={
              <>
                <ThemeSync />
                <AddTransaction />
              </>
            }
          />
        </Routes>
      </Router>
    </AppProvider>
  );
}
