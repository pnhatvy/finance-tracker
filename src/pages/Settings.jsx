import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../AppContext";
import { ChevronLeft, X, Moon, Menu, Trash2 } from "lucide-react";
import { collection, query, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

export default function Settings() {
  const navigate = useNavigate();
  const {
    theme,
    setTheme,
    categories,
    setCategories,
    cycleStartDay,
    setCycleStartDay,
    setMonthlyBudget,
    setMonthlyIncomeGoal,
    setIsModalOpen,
  } = useAppContext();

  const [modalType, setModalType] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [catForm, setCatForm] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const EMOJI_LIST = [
    "🍔",
    "🍕",
    "☕",
    "🍎",
    "🚕",
    "🚌",
    "✈️",
    "🛍️",
    "👕",
    "🎁",
    "💰",
    "💵",
    "🏠",
    "📱",
    "💻",
    "🎬",
    "🎮",
    "💊",
    "🏥",
    "🏋️",
    "🐾",
    "✨",
    "📚",
    "⚡",
  ];
  const COLOR_LIST = [
    "#ff453a",
    "#32ade6",
    "#ffd60a",
    "#bf5af2",
    "#30d158",
    "#ff9f0a",
    "#64d2ff",
    "#5e5ce6",
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

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      const q = query(collection(db, "transactions"));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((document) =>
        deleteDoc(doc(db, "transactions", document.id)),
      );
      await Promise.all(deletePromises);
      setCategories([
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
      ]);
      setCycleStartDay(1);
      setMonthlyBudget(9700000);
      setMonthlyIncomeGoal(15000000);
      closeModals();
      navigate("/");
    } catch (e) {
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
    <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden relative">
      {list.map((c, index) => {
        const isDragging = dragState?.id === c.id;
        let translateY = 0;
        let zIndex = 1;
        let scale = 1;
        let shadow = "none";
        if (dragState && dragState.type === type) {
          if (isDragging) {
            translateY = dragState.currentY - dragState.startY;
            zIndex = 50;
            scale = 1.05;
            shadow = "0 20px 25px -5px rgba(0,0,0,0.5)";
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
            className="cat-row relative bg-[#1c1c1e] border-b border-white/5"
            style={{
              transform: `translateY(${translateY}px) scale(${scale})`,
              zIndex,
              boxShadow: shadow,
              transition: isDragging
                ? "none"
                : "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
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
                <span className="font-semibold text-white pointer-events-none">
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
        className="w-full text-center p-4 font-semibold text-white active:bg-white/5"
      >
        + Add Category
      </button>
    </div>
  );

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-black text-white relative overflow-hidden animate-ios-page">
      <div
        className="flex-shrink-0 z-40 bg-black/90 backdrop-blur-xl px-4 pb-3 flex items-center shadow-[0_1px_0_0_rgba(255,255,255,0.05)]"
        style={{ paddingTop: "max(env(safe-area-inset-top), 56px)" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 absolute active:opacity-50"
          style={{ left: "16px", top: "max(env(safe-area-inset-top), 56px)" }}
        >
          <ChevronLeft size={28} className="text-[#32ade6] -mt-1.5" />
        </button>
        <h1 className="text-[24px] font-bold tracking-tight w-full text-center">
          Settings
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-5">
        <div>
          <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest ml-4 mb-2">
            Preferences
          </h3>
          <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Moon size={20} className="text-[#32ade6]" />
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
        <div>
          <h3 className="text-[#8e8e93] text-[11px] font-bold uppercase tracking-widest ml-4 mb-2">
            Budget Cycle
          </h3>
          <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
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
              <span className="text-[#8e8e93] text-sm">{cycleStartDay} ›</span>
            </button>
          </div>
        </div>
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
        <div className="pt-4">
          <h3 className="text-[#ff453a] text-[11px] font-bold uppercase tracking-widest ml-4 mb-2">
            Danger Zone
          </h3>
          <div className="bg-[#1c1c1e] rounded-2xl overflow-hidden">
            <button
              onClick={() => {
                setModalType("reset");
                setIsModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 p-4 text-left font-semibold text-[#ff453a] active:bg-white/5 transition-colors"
            >
              <Trash2 size={18} /> Erase All Data
            </button>
          </div>
        </div>
      </div>

      {/* --- CÁC MODAL BÊN DƯỚI GIỮ NGUYÊN HOẶC COPY TỪ BẢN TRƯỚC --- */}
    </div>
  );
}
