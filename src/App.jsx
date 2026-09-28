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
    // Đổi background html
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    // Ép đổi màu Dynamic Island
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        theme === "dark" ? "#000000" : "#f2f2f7",
      );
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
