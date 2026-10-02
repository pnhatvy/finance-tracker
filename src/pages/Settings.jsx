import { useState, useEffect } from "react";
import { useAppContext } from "../AppContext";
import {
  X,
  Moon,
  Menu,
  Trash2,
  UserCircle,
  UploadCloud,
  DownloadCloud,
  LogOut,
  Download,
} from "lucide-react";

import { auth, db } from "../firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Settings() {
  const {
    theme,
    setTheme,
    categories,
    setCategories,
    cycleStartDay,
    setCycleStartDay,
    setIsModalOpen,
  } = useAppContext();

  const [modalType, setModalType] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [catForm, setCatForm] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const [user, setUser] = useState(null);
  const [syncLoading, setSyncLoading] = useState(null);
  const [syncMessage, setSyncMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Auto-backup ngầm khi mở Settings và đã đăng nhập
  useEffect(() => {
    if (user) {
      handleBackup(true);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error", error);
      // Chỉ báo lỗi nếu không phải do user tự tắt popup
      if (error.code !== "auth/popup-closed-by-user") {
        showTempMessage("Sign in failed");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const confirmLogout = () => {
    signOut(auth);
    closeModals();
  };

  const showTempMessage = (msg) => {
    setSyncMessage(msg);
    setTimeout(() => setSyncMessage(""), 3000);
  };

  const handleBackup = async (isAuto = false) => {
    if (!user) return;
    if (!isAuto) setSyncLoading("backup");

    try {
      const dataToBackup = {
        transactions: JSON.parse(
          localStorage.getItem("vys_transactions") || "[]",
        ),
        categories: JSON.parse(localStorage.getItem("vys_categories") || "[]"),
        globalGoals: JSON.parse(
          localStorage.getItem("vys_global_goals") || "{}",
        ),
        monthlyGoals: JSON.parse(
          localStorage.getItem("vys_monthly_goals") || "{}",
        ),
        initialBalance: localStorage.getItem("vys_initial_balance") || "0",
        cycleStartDay: localStorage.getItem("vys_cycle_start_day") || "1",
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), dataToBackup);

      if (!isAuto) {
        showTempMessage("Backup successful");
      }
    } catch (e) {
      console.error(e);
      if (!isAuto) showTempMessage("Backup failed");
    } finally {
      if (!isAuto) setSyncLoading(null);
    }
  };

  const handleRestore = async () => {
    if (!user) return;
    const confirmRest = window.confirm(
      "Ghi đè toàn bộ dữ liệu trên máy bằng dữ liệu đám mây?",
    );
    if (!confirmRest) return;

    setSyncLoading("restore");
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.transactions)
          localStorage.setItem(
            "vys_transactions",
            JSON.stringify(data.transactions),
          );
        if (data.categories) {
          localStorage.setItem(
            "vys_categories",
            JSON.stringify(data.categories),
          );
          setCategories(data.categories);
        }
        if (data.globalGoals)
          localStorage.setItem(
            "vys_global_goals",
            JSON.stringify(data.globalGoals),
          );
        if (data.monthlyGoals)
          localStorage.setItem(
            "vys_monthly_goals",
            JSON.stringify(data.monthlyGoals),
          );
        if (data.initialBalance)
          localStorage.setItem("vys_initial_balance", data.initialBalance);
        if (data.cycleStartDay) {
          localStorage.setItem("vys_cycle_start_day", data.cycleStartDay);
          setCycleStartDay(Number(data.cycleStartDay));
        }
        showTempMessage("Restore successful");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showTempMessage("No backup found");
        setSyncLoading(null);
      }
    } catch (e) {
      console.error(e);
      showTempMessage("Restore failed");
      setSyncLoading(null);
    }
  };

  const handleExportData = () => {
    try {
      const txs = JSON.parse(localStorage.getItem("vys_transactions") || "[]");
      let csvContent = "\uFEFFNgày,Giờ,Loại,Danh mục,Số tiền,Ghi chú\n";

      txs.forEach((t) => {
        const d = new Date(t.date);
        const date = d.toLocaleDateString("vi-VN");
        const time = d.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const type = t.type === "income" ? "Thu nhập" : "Chi tiêu";
        const cat = t.category?.name || "";
        const amt = t.amount;
        const note = `"${(t.note || "").replace(/"/g, '""')}"`;

        csvContent += `${date},${time},${type},${cat},${amt},${note}\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Vys_Finance_Data_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("Xuất dữ liệu thất bại.");
    }
  };

  const EMOJI_LIST = [
    "🍔",
    "🍜",
    "☕",
    "🧋",
    "🍺",
    "🍎",
    "🥦",
    "🛒",
    "🚕",
    "🚌",
    "🚆",
    "🛵",
    "🚲",
    "✈️",
    "⛽",
    "🅿️",
    "🛍️",
    "👕",
    "👟",
    "💄",
    "💇",
    "💅",
    "💍",
    "⌚",
    "🏠",
    "💡",
    "💧",
    "📱",
    "🔌",
    "🧹",
    "🛋️",
    "📦",
    "💰",
    "💵",
    "💳",
    "🏦",
    "📈",
    "🧾",
    "🪙",
    "💸",
    "🏥",
    "💊",
    "🦷",
    "🏋",
    "🧘",
    "⚽",
    "🏃",
    "🤕",
    "🎬",
    "🎮",
    "🎧",
    "🎸",
    "🎨",
    "📸",
    "🎟",
    "🏕️",
    "👶",
    "🧸",
    "🍼",
    "🐾",
    "🐶",
    "🐱",
    "👨‍‍👩‍👧",
    "🏫",
    "📚",
    "🎓",
    "💼",
    "💻",
    "✏️",
    "📎",
    "📊",
    "🤝",
    "🎁",
    "🛠️",
    "🚬",
    "🪴",
    "🔥",
    "🎉",
    "🛡️",
    "⚙️",
  ];

  const COLOR_LIST = [
    "#ff453a",
    "#ff9f0a",
    "#ffd60a",
    "#32d74b",
    "#00c7be",
    "#32ade6",
    "#007aff",
    "#5e5ce6",
    "#bf5af2",
    "#ff375f",
    "#a2845e",
    "#8e8e93",
  ];

  const confirmDeleteCategory = () => {
    if (itemToDelete) {
      setCategories(categories.filter((c) => c.id !== itemToDelete));
      setItemToDelete(null);
    }
  };

  const openCycleModal = () => {
    setModalType("cycle");
    setIsModalOpen(true);
  };
  const openAddCategory = () => {
    setCatForm({ name: "", icon: "🍔", color: "#ff453a", type: "expense" });
    setModalType("category");
    setIsModalOpen(true);
  };
  const openEditCategory = (cat) => {
    setCatForm({ ...cat });
    setModalType("category");
    setIsModalOpen(true);
  };
  const closeModals = () => {
    setModalType(null);
    setCatForm(null);
    setIsModalOpen(false);
  };

  const saveCategory = () => {
    if (!catForm.name.trim()) return;
    if (catForm.id) {
      setCategories(categories.map((c) => (c.id === catForm.id ? catForm : c)));
    } else {
      setCategories([...categories, { id: Date.now().toString(), ...catForm }]);
    }
    closeModals();
  };

  const handleResetData = () => {
    setIsResetting(true);
    try {
      localStorage.removeItem("vys_transactions");
      closeModals();
      window.location.href = "/";
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const onTouchStart = (e, catId, index, type) => {
    const row = e.currentTarget.closest(".cat-row");
    const height = row ? row.getBoundingClientRect().height : 58;
    setDragState({
      id: catId,
      type,
      startIndex: index,
      hoverIndex: index,
      startY: e.touches[0].clientY,
      currentY: e.touches[0].clientY,
      itemHeight: height,
    });
    document.body.style.overflow = "hidden";
  };

  const onTouchMove = (e, type) => {
    if (!dragState || dragState.type !== type) return;
    e.preventDefault();
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragState.startY;
    const offsetSteps = Math.round(deltaY / dragState.itemHeight);
    let newHover = dragState.startIndex + offsetSteps;
    const maxIndex =
      (type === "expense" ? expenseCategories : incomeCategories).length - 1;
    newHover = Math.max(0, Math.min(newHover, maxIndex));
    setDragState((prev) => ({ ...prev, currentY, hoverIndex: newHover }));
  };

  const onTouchEnd = () => {
    if (dragState && dragState.startIndex !== dragState.hoverIndex) {
      const type = dragState.type;
      const list =
        type === "expense" ? [...expenseCategories] : [...incomeCategories];
      const temp = list[dragState.startIndex];
      list.splice(dragState.startIndex, 1);
      list.splice(dragState.hoverIndex, 0, temp);
      const otherList =
        type === "expense" ? incomeCategories : expenseCategories;
      setCategories(
        type === "expense" ? [...list, ...otherList] : [...otherList, ...list],
      );
    }
    setDragState(null);
    document.body.style.overflow = "";
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  const renderCategoryList = (list, type) => (
    <div
      className={`rounded-2xl overflow-hidden relative ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
    >
      {list.map((c, index) => {
        const isDragging = dragState?.id === c.id;
        let translateY = 0;
        let zIndex = 1;
        let scale = 1;
        let shadow = "none";
        let radius = "0px";

        if (dragState && dragState.type === type) {
          if (isDragging) {
            const rawTranslateY = dragState.currentY - dragState.startY;
            const maxUp = -dragState.startIndex * dragState.itemHeight;
            const maxDown =
              (list.length - 1 - dragState.startIndex) * dragState.itemHeight;
            translateY = Math.max(maxUp, Math.min(rawTranslateY, maxDown));

            zIndex = 50;
            scale = 1.02;
            shadow =
              theme === "dark"
                ? "0 12px 24px rgba(0,0,0,0.4)"
                : "0 12px 24px rgba(0,0,0,0.08)";
            radius = "12px";
          } else {
            if (
              dragState.startIndex < dragState.hoverIndex &&
              index > dragState.startIndex &&
              index <= dragState.hoverIndex
            )
              translateY = -dragState.itemHeight;
            else if (
              dragState.startIndex > dragState.hoverIndex &&
              index < dragState.startIndex &&
              index >= dragState.hoverIndex
            )
              translateY = dragState.itemHeight;
          }
        }

        return (
          <div
            key={c.id}
            className={`cat-row relative border-b ${theme === "dark" ? "bg-[#1c1c1e] border-white/5" : "bg-white border-black/5"}`}
            style={{
              transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
              zIndex,
              boxShadow: shadow,
              borderRadius: radius,
              transition: isDragging
                ? "none"
                : "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.3s ease, border-radius 0.3s ease",
              willChange: "transform",
            }}
          >
            <div className="flex justify-between items-center p-3.5 select-none">
              <div
                className="flex-1 flex items-center gap-4 cursor-pointer active:opacity-50"
                onClick={() => {
                  if (!dragState) openEditCategory(c);
                }}
              >
                <span className="text-xl pointer-events-none">{c.icon}</span>
                <span
                  className={`font-semibold pointer-events-none ${theme === "dark" ? "text-white" : "text-black"}`}
                >
                  {c.name}
                </span>
              </div>
              <div className="flex gap-2 items-center pl-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDelete(c.id);
                  }}
                  className="text-[#ff453a] active:opacity-50 p-2"
                >
                  <X size={18} />
                </button>
                <div
                  onTouchStart={(e) => onTouchStart(e, c.id, index, type)}
                  onTouchMove={(e) => onTouchMove(e, type)}
                  onTouchEnd={onTouchEnd}
                  onTouchCancel={onTouchEnd}
                  className="cursor-grab active:cursor-grabbing p-2 text-[#8e8e93]"
                  style={{ touchAction: "none" }}
                >
                  <Menu size={18} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <button
        onClick={openAddCategory}
        className={`w-full text-center p-4 font-semibold active:opacity-50 ${theme === "dark" ? "text-white" : "text-black"}`}
      >
        + Add Category
      </button>
    </div>
  );

  return (
    <>
      <div
        className={`h-[100dvh] w-full flex flex-col relative overflow-hidden animate-ios-page ${theme === "dark" ? "bg-black text-white" : "bg-[#f2f2f7] text-black"}`}
      >
        <div
          className={`flex-shrink-0 z-40 px-4 pb-3 flex flex-col justify-end shadow-[0_1px_0_0_rgba(0,0,0,0.05)] relative ${theme === "dark" ? "bg-black/90 shadow-[0_1px_0_0_rgba(255,255,255,0.05)]" : "bg-[#f2f2f7]/90"}`}
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
        >
          <h1 className="text-[22px] font-bold tracking-tight w-full text-center">
            Settings
          </h1>
        </div>

        <div
          className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6 overscroll-y-auto"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* SECTION 1: PREFERENCES */}
          <div>
            <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest ml-4 mb-2">
              Preferences
            </h3>
            <div
              className={`rounded-2xl overflow-hidden ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Moon size={20} className="text-[#8e8e93]" />
                  <span className="font-semibold text-[15px]">Dark Mode</span>
                </div>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={`w-12 h-7 rounded-full transition-colors relative ${theme === "dark" ? "bg-[#32d74b]" : "bg-gray-400"}`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0.5"}`}
                  ></div>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: BUDGET CYCLE */}
          <div>
            <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest ml-4 mb-2">
              Budget Cycle
            </h3>
            <div
              className={`rounded-2xl overflow-hidden ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
            >
              <button
                onClick={openCycleModal}
                className="w-full flex justify-between items-center p-4 text-left active:opacity-70 transition-opacity"
              >
                <div>
                  <p className="font-semibold text-[15px]">Cycle starts on</p>
                  <p className="text-xs text-[#8e8e93] mt-0.5">
                    Budget and monthly totals reset on this day
                  </p>
                </div>
                <span className="text-[#8e8e93] text-sm">
                  {cycleStartDay} ›
                </span>
              </button>
            </div>
          </div>

          {/* SECTION 3: CATEGORIES */}
          <div>
            <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest ml-4 mb-2">
              Expense Categories
            </h3>
            {renderCategoryList(expenseCategories, "expense")}
          </div>
          <div>
            <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest ml-4 mb-2">
              Income Categories
            </h3>
            {renderCategoryList(incomeCategories, "income")}
          </div>

          {/* SECTION 4: ACCOUNT & SYNC */}
          <div>
            <div className="flex justify-between items-end mb-2 ml-4 pr-2">
              <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest">
                Account & Sync
              </h3>
              {syncMessage && (
                <span className="text-[#32d74b] text-[10px] font-bold animate-pulse">
                  {syncMessage}
                </span>
              )}
            </div>
            <div
              className={`rounded-2xl overflow-hidden ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
            >
              {!user ? (
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full flex items-center gap-3 p-4 text-left active:opacity-70 transition-opacity"
                >
                  <UserCircle size={22} className="text-[#8e8e93]" />
                  <div>
                    <p className="font-semibold text-[15px]">
                      {isLoggingIn ? "Signing in..." : "Sign in with Google"}
                    </p>
                    <p className="text-xs text-[#8e8e93] mt-0.5">
                      Backup data to cloud
                    </p>
                  </div>
                </button>
              ) : (
                <div className="flex flex-col">
                  {/* Block Thông tin tài khoản */}
                  <div
                    className={`p-4 border-b flex justify-between items-center ${theme === "dark" ? "border-white/5" : "border-black/5"}`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <UserCircle
                          size={40}
                          className="text-[#8e8e93] flex-shrink-0"
                        />
                      )}
                      <div className="overflow-hidden">
                        <p className="font-semibold text-[15px] truncate">
                          {user.displayName || "User"}
                        </p>
                        <p className="text-xs text-[#8e8e93] truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setModalType("logout");
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-[#8e8e93] active:opacity-50 flex-shrink-0"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>

                  {/* Hàng nút Backup / Restore */}
                  <div
                    className={`flex divide-x ${theme === "dark" ? "divide-white/5" : "divide-black/5"}`}
                  >
                    <button
                      onClick={() => handleBackup(false)}
                      disabled={syncLoading !== null}
                      className={`flex-1 p-3 flex flex-col items-center gap-1.5 transition-colors ${syncLoading ? "opacity-50" : "active:bg-black/5 dark:active:bg-white/5"}`}
                    >
                      <UploadCloud size={20} className="text-[#8e8e93]" />
                      <span className="text-[13px] font-semibold">
                        {syncLoading === "backup" ? "Syncing..." : "Backup"}
                      </span>
                    </button>
                    <button
                      onClick={handleRestore}
                      disabled={syncLoading !== null}
                      className={`flex-1 p-3 flex flex-col items-center gap-1.5 transition-colors ${syncLoading ? "opacity-50" : "active:bg-black/5 dark:active:bg-white/5"}`}
                    >
                      <DownloadCloud size={20} className="text-[#8e8e93]" />
                      <span className="text-[13px] font-semibold">
                        {syncLoading === "restore" ? "Restoring..." : "Restore"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: DATA */}
          <div>
            <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest ml-4 mb-2">
              Data
            </h3>
            <div
              className={`rounded-2xl overflow-hidden ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white shadow-sm"}`}
            >
              <button
                onClick={handleExportData}
                className={`w-full flex items-center gap-3 p-4 text-left font-semibold active:bg-white/5 transition-colors border-b ${theme === "dark" ? "border-white/5 text-white" : "border-black/5 text-black"}`}
              >
                <Download size={20} className="text-[#8e8e93]" />
                <span className="text-[15px]">Export to Excel (.csv)</span>
              </button>

              <button
                onClick={() => {
                  setModalType("reset");
                  setIsModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-4 text-left font-semibold text-[#ff453a] active:bg-white/5 transition-colors"
              >
                <Trash2 size={20} />
                <span className="text-[15px]">Erase All Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL ĐĂNG XUẤT */}
      {modalType === "logout" && (
        <div
          className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-ios-fade"
          onClick={closeModals}
        >
          <div
            className={`w-full max-w-[320px] rounded-[32px] p-6 shadow-2xl ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className={`font-bold text-center text-xl mb-2 ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              Sign Out?
            </h3>
            <p
              className={`text-center text-sm mb-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              Are you sure you want to sign out? You will need to sign in again
              to backup data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModals}
                className={`flex-1 py-3.5 rounded-2xl font-bold ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-200 text-black"}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 bg-[#ff453a] text-white py-3.5 rounded-2xl font-bold active:opacity-70"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CÁC MODALS CŨ */}
      {modalType === "reset" && (
        <div
          className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-ios-fade"
          onClick={!isResetting ? closeModals : undefined}
        >
          <div
            className={`w-full max-w-[320px] rounded-[32px] p-6 shadow-2xl ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-[#ff453a]/20 text-[#ff453a] flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} />
            </div>
            <h3
              className={`font-bold text-center text-xl mb-2 ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              Reset Everything?
            </h3>
            <p
              className={`text-center text-sm mb-6 leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              This will permanently delete all data.{" "}
              <strong
                className={theme === "dark" ? "text-white" : "text-black"}
              >
                This action cannot be undone.
              </strong>
            </p>
            <div className="flex gap-3">
              <button
                disabled={isResetting}
                onClick={closeModals}
                className={`flex-1 py-3.5 rounded-2xl font-bold active:opacity-70 disabled:opacity-50 ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-200 text-black"}`}
              >
                Cancel
              </button>
              <button
                disabled={isResetting}
                onClick={handleResetData}
                className="flex-1 bg-[#ff453a] text-white py-3.5 rounded-2xl font-bold active:opacity-70 flex items-center justify-center disabled:opacity-50"
              >
                {isResetting ? "Erasing..." : "Erase"}
              </button>
            </div>
          </div>
        </div>
      )}

      {itemToDelete && (
        <div
          className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-ios-fade"
          onClick={() => setItemToDelete(null)}
        >
          <div
            className={`w-full max-w-[320px] rounded-[32px] p-6 shadow-2xl ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className={`font-bold text-center text-xl mb-2 ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              Delete Category?
            </h3>
            <p
              className={`text-center text-sm mb-6 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
            >
              Transactions will lose this category.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className={`flex-1 py-3.5 rounded-2xl font-bold ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-200 text-black"}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCategory}
                className="flex-1 bg-[#ff453a] text-white py-3.5 rounded-2xl font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType === "cycle" && (
        <div
          className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-ios-fade"
          onClick={closeModals}
        >
          <div
            className={`w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className={`font-bold text-center mb-6 text-xl ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              Cycle start day
            </h2>
            <div className="grid grid-cols-7 gap-2 mb-6">
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  onClick={() => {
                    setCycleStartDay(day);
                    closeModals();
                  }}
                  className={`aspect-square flex items-center justify-center rounded-lg font-bold text-sm ${cycleStartDay === day ? "bg-[#32ade6] text-black" : theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-100 text-black"}`}
                >
                  {day}
                </button>
              ))}
            </div>
            <button
              onClick={closeModals}
              className={`w-full py-3.5 rounded-2xl font-bold ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-200 text-black"}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {modalType === "category" && catForm && (
        <div
          className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 animate-ios-fade"
          onClick={closeModals}
        >
          <div
            className={`w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2
                className={`font-bold text-xl ${theme === "dark" ? "text-white" : "text-black"}`}
              >
                {catForm.id ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={closeModals}
                className={`p-1.5 rounded-full ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-100 text-black"}`}
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={`flex rounded-xl p-1 mb-4 ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
            >
              <button
                onClick={() => setCatForm({ ...catForm, type: "expense" })}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${catForm.type === "expense" ? "bg-[#ff453a] text-white" : "text-[#8e8e93]"}`}
              >
                Expense
              </button>
              <button
                onClick={() => setCatForm({ ...catForm, type: "income" })}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${catForm.type === "income" ? "bg-[#32d74b] text-white" : "text-[#8e8e93]"}`}
              >
                Income
              </button>
            </div>
            <input
              type="text"
              placeholder="Category name"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              className={`w-full text-center rounded-xl px-4 py-3 outline-none mb-4 font-bold text-lg ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-100 text-black"}`}
            />

            <div
              className={`grid grid-cols-6 gap-2 mb-4 h-[160px] overflow-y-auto p-2 rounded-xl scrollbar-hide ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
            >
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setCatForm({ ...catForm, icon: emoji })}
                  className={`aspect-square rounded-lg text-[22px] flex items-center justify-center transition-colors ${catForm.icon === emoji ? (theme === "dark" ? "bg-[#3a3a3c]" : "bg-gray-300") : ""}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div
              className={`grid grid-cols-6 gap-y-3 mb-6 p-3 rounded-xl ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
            >
              {COLOR_LIST.map((color) => (
                <div key={color} className="flex justify-center items-center">
                  <button
                    onClick={() => setCatForm({ ...catForm, color })}
                    className="w-6 h-6 rounded-full border-2 transition-all duration-200"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        catForm.color === color
                          ? theme === "dark"
                            ? "white"
                            : "black"
                          : "transparent",
                      transform:
                        catForm.color === color ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={saveCategory}
              className={`w-full py-3.5 rounded-2xl font-bold text-[17px] active:scale-[0.98] transition-transform ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
            >
              Save Category
            </button>
          </div>
        </div>
      )}
    </>
  );
}
