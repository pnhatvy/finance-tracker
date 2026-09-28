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

    // 1. Đổi class gốc
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    // 2. Ép style cứng vào HTML/Body để chống cache CSS của iOS
    document.documentElement.style.backgroundColor = bgColor;
    document.body.style.backgroundColor = bgColor;

    // 3. Tiêu diệt thẻ meta cũ và sinh ra thẻ mới để ép Dynamic Island load lại màu
    let oldMeta = document.querySelector('meta[name="theme-color"]');
    if (oldMeta) {
      oldMeta.remove();
    }

    const newMeta = document.createElement("meta");
    newMeta.name = "theme-color";
    newMeta.content = bgColor;
    document.head.appendChild(newMeta);
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
