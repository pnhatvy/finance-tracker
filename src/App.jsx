import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AppProvider, useAppContext } from "./AppContext";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import AddTransaction from "./pages/AddTransaction";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";
import BottomNav from "./components/BottomNav";

// COMPONENT ĐỒNG BỘ MÀU DYNAMIC ISLAND THEO THEME
function ThemeSync() {
  const { theme } = useAppContext();

  useEffect(() => {
    // 1. Đổi màu gốc của thẻ HTML
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    // 2. Ép trình duyệt iOS (Dynamic Island) đổi màu theo
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.name = "theme-color";
      document.head.appendChild(metaThemeColor);
    }
    // Set Đen Tuyền cho Dark Mode và Xám Nhạt (chuẩn Apple) cho Light Mode
    metaThemeColor.setAttribute(
      "content",
      theme === "dark" ? "#000000" : "#f2f2f7",
    );
  }, [theme]);

  return null; // Component này chạy ngầm, không render ra giao diện
}

function MainLayout({ children }) {
  return (
    <>
      <ThemeSync /> {/* Kích hoạt đồng bộ màu */}
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
          <Route
            path="/"
            element={
              <MainLayout>
                <History />
              </MainLayout>
            }
          />
          <Route
            path="/analytics"
            element={
              <MainLayout>
                <Analytics />
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
          {/* Trang AddTransaction nằm đè lên toàn màn hình nên không cần BottomNav */}
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
