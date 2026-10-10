import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Delete,
  Calendar,
  Repeat,
  Clock,
  Timer,
  MapPin,
  Search,
} from "lucide-react";
import { useAppContext } from "../AppContext";

export default function AddTransaction() {
  const navigate = useNavigate();
  const { categories, theme, workHourlyRate } = useAppContext();

  const [amount, setAmount] = useState("0");
  const [type, setType] = useState("expense");
  const [note, setNote] = useState("");
  const [repeat, setRepeat] = useState("none");

  const [pastNotes, setPastNotes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [location, setLocation] = useState(null);
  const [coords, setCoords] = useState(null);
  const [isLocating, setIsLocating] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [searchLocation, setSearchLocation] = useState("");
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const containerRef = useRef(null);

  const getCurrentDate = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now - tzOffset).toISOString().slice(0, 10);
  };

  const getCurrentTime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now - tzOffset).toISOString().slice(11, 16);
  };

  const [datePart, setDatePart] = useState(getCurrentDate());
  const [timePart, setTimePart] = useState(getCurrentTime());

  const safeCategories = categories.map((c) => ({
    ...c,
    type: c.type || "expense",
  }));
  const currentCategories = safeCategories.filter((c) => c.type === type);
  const [category, setCategory] = useState(currentCategories[0] || {});

  useEffect(() => {
    const txs = JSON.parse(localStorage.getItem("vys_transactions") || "[]");
    const allNotes = txs
      .map((t) => t.note)
      .filter((n) => n && n.trim() !== "" && n !== "Expense" && n !== "Income");

    const uniqueNotes = [...new Set(allNotes)];
    setPastNotes(uniqueNotes);
  }, []);

  // LẤY VỊ TRÍ GPS VÀ QUÉT QUÁN XÁ XUNG QUANH THẬT 100%
  useEffect(() => {
    if (!navigator.geolocation) {
      setIsLocating(false);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        setCoords({ lat, lon });

        let placeName = "Vị trí hiện tại";
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=vi`,
          );
          if (res.ok) {
            const data = await res.json();
            const locality = data.locality || data.city || "";
            const principal = data.principalSubdivision || "";
            placeName = locality
              ? `${locality}, ${principal}`
              : principal || "Vị trí hiện tại";
          }
        } catch (e) {
          console.error(e);
        }
        setLocation(placeName);

        try {
          const query = `[out:json][timeout:5];node(around:400,${lat},${lon})["name"];out 15;`;
          const overpassRes = await fetch(
            `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
          );
          if (overpassRes.ok) {
            const overpassData = await overpassRes.json();
            const places = overpassData.elements
              .filter((el) => el.tags && el.tags.name)
              .map((el) => ({
                name: el.tags.name,
                address:
                  el.tags.amenity ||
                  el.tags.shop ||
                  el.tags.tourism ||
                  "Khu vực lân cận",
              }));

            const uniquePlaces = Array.from(
              new Map(places.map((item) => [item.name, item])).values(),
            ).slice(0, 10);
            setNearbyPlaces(uniquePlaces);
          }
        } catch (e) {
          console.error("Lỗi lấy quán:", e);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setLocation(null);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  }, []);

  // SEARCH CHUẨN XÁC: Ép sát vị trí hiện tại và bám chặt Việt Nam, không bay đi xa
  useEffect(() => {
    if (!searchLocation.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError("");
      return;
    }

    setIsSearching(true);
    setSearchError("");

    const delayDebounceFn = setTimeout(async () => {
      try {
        // Truyền tọa độ hiện tại (lat/lon) để Photon ưu tiên kết quả bán kính gần nhất
        const latLonQuery = coords
          ? `&lat=${coords.lat}&lon=${coords.lon}`
          : "";
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(searchLocation)}${latLonQuery}&limit=6`,
        );
        if (!res.ok) throw new Error("Lỗi kết nối");

        const data = await res.json();
        const results = data.features
          .map((f) => {
            const p = f.properties;
            const addressParts = [p.street, p.district, p.city]
              .filter(Boolean)
              .join(", ");
            return {
              name: p.name || p.street || "Địa điểm",
              address: addressParts || p.state || "Việt Nam",
            };
          })
          .filter((item) => item.name);

        setSearchResults(results);
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
        setSearchError("Không thể tìm kiếm lúc này.");
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchLocation, coords]);

  // HIỆU ỨNG VUỐT ĐÓNG MƯỢT MÀ CHUẨN iOS (SPRING PHYSICS)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0,
      currentY = 0;
    let isDragging = false;

    const handleTouchStart = (e) => {
      if (container.scrollTop > 0) return; // Chỉ cho phép vuốt khi đang ở đỉnh màn hình
      startY = e.touches[0].clientY;
      isDragging = true;
      container.style.transition = "none";
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY - startY;
      if (currentY > 0) {
        // Áp dụng tỷ lệ cản lực (resistance) để tạo cảm giác nặng tay mượt mà như iOS
        const dampenedY = currentY * 0.65;
        container.style.transform = `translate3d(0, ${dampenedY}px, 0)`;
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      container.style.transition =
        "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)"; // Hiệu ứng lò xo iOS cực mượt

      if (currentY > 110) {
        container.style.transform = `translate3d(0, 100dvh, 0)`;
        setTimeout(() => navigate("/"), 300);
      } else {
        currentY = 0;
        container.style.transform = `translate3d(0, 0px, 0)`;
      }
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate]);

  const handleCloseButton = () => {
    if (containerRef.current) {
      containerRef.current.style.transition =
        "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)";
      containerRef.current.style.transform = `translate3d(0, 100dvh, 0)`;
    }
    setTimeout(() => navigate("/"), 300);
  };

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNote(val);
    if (val.trim()) {
      const matches = pastNotes.filter(
        (n) =>
          n.toLowerCase().includes(val.toLowerCase()) &&
          n.toLowerCase() !== val.toLowerCase(),
      );
      setSuggestions(matches.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const acceptSuggestion = (s) => {
    setNote(s);
    setSuggestions([]);
  };

  useEffect(() => {
    setCategory(currentCategories[0] || {});
  }, [type, categories]);

  const handleKeyPress = (val) => {
    if (val === ",") {
      if (!amount.includes(",")) setAmount(amount + ",");
    } else {
      if (amount === "0") setAmount(val);
      else if (amount.length < 12) setAmount(amount + val);
    }
  };

  const handleDelete = () => {
    if (amount.length <= 1) setAmount("0");
    else setAmount(amount.slice(0, -1));
  };

  const handleSave = () => {
    if (amount === "0" || amount === ",") return;
    try {
      const numericAmount = Number(amount.replace(",", "."));
      const baseDate = new Date(`${datePart}T${timePart}`);

      let count = 1;
      if (repeat === "daily") count = 30;
      if (repeat === "weekly") count = 12;
      if (repeat === "monthly") count = 12;
      if (repeat === "yearly") count = 5;

      const newTransactions = [];
      const groupId = "rep_" + Date.now();
      const existingData = JSON.parse(
        localStorage.getItem("vys_transactions") || "[]",
      );

      for (let i = 0; i < count; i++) {
        const d = new Date(baseDate);
        if (repeat === "daily") d.setDate(d.getDate() + i);
        if (repeat === "weekly") d.setDate(d.getDate() + i * 7);
        if (repeat === "monthly") d.setMonth(d.getMonth() + i);
        if (repeat === "yearly") d.setFullYear(d.getFullYear() + i);

        newTransactions.push({
          id: Date.now().toString() + "_" + i,
          amount: numericAmount,
          type: type,
          note:
            note ||
            category.name ||
            (type === "expense" ? "Expense" : "Income"),
          category: category,
          location:
            location && !location.includes("Đang tìm") ? location : null,
          date: d.toISOString(),
          recurringId: repeat !== "none" ? groupId : null,
        });
      }

      const updated = [...newTransactions, ...existingData];
      localStorage.setItem("vys_transactions", JSON.stringify(updated));
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  const displayAmount = () => {
    if (amount === "0") return "0";
    const parts = amount.split(",");
    return parts.length > 1
      ? `${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${parts[1]}`
      : parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const calculatedHours = () => {
    if (workHourlyRate <= 0 || amount === "0" || amount === ",") return null;
    const numericAmount = Number(amount.replace(",", "."));
    const hours = (numericAmount / workHourlyRate).toFixed(1);
    return hours > 0 ? hours : null;
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`flex flex-col h-[100dvh] p-5 overflow-y-auto scrollbar-hide will-change-transform ${theme === "dark" ? "bg-black text-white" : "bg-[#f2f2f7] text-black"}`}
        style={{
          paddingTop: "max(env(safe-area-inset-top), 20px)",
          paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
        }}
      >
        <div className="w-full flex justify-center py-2 mb-2 flex-shrink-0 cursor-grab">
          <div
            className={`w-14 h-1.5 rounded-full ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-300"}`}
          ></div>
        </div>

        <div className="flex justify-between items-center mb-5 flex-shrink-0">
          <button
            onClick={handleCloseButton}
            className={`p-1 active:opacity-50 flex-shrink-0 w-[42px] ${theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
          >
            <X size={26} />
          </button>
          <div
            className={`relative flex rounded-full p-1 w-[200px] ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-gray-200"}`}
          >
            <div
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out ${type === "expense" ? "translate-x-0 bg-[#ff453a]" : "translate-x-[100%] bg-[#32d74b]"}`}
            ></div>
            <button
              onClick={() => setType("expense")}
              className={`relative z-10 flex-1 py-1.5 text-sm font-semibold transition-colors duration-300 ${type === "expense" ? "text-white" : "text-[#8e8e93]"}`}
            >
              Expense
            </button>
            <button
              onClick={() => setType("income")}
              className={`relative z-10 flex-1 py-1.5 text-sm font-semibold transition-colors duration-300 ${type === "income" ? "text-white" : "text-[#8e8e93]"}`}
            >
              Income
            </button>
          </div>
          <div className="w-[42px] flex-shrink-0"></div>
        </div>

        <div className="flex overflow-x-auto flex-nowrap gap-2.5 py-1 mb-3 scrollbar-hide items-center min-h-[50px] flex-shrink-0">
          {currentCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={(e) => {
                e.stopPropagation();
                setCategory(cat);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 ${category.id === cat.id ? (theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-200") : theme === "dark" ? "bg-[#1c1c1e] text-[#8e8e93]" : "bg-white text-gray-500"}`}
              style={{
                border:
                  category.id === cat.id
                    ? `1.5px solid ${cat.color}`
                    : "1.5px solid transparent",
              }}
            >
              <span className="text-base pointer-events-none">{cat.icon}</span>
              <span
                className={`text-sm font-semibold pointer-events-none ${category.id === cat.id ? (theme === "dark" ? "text-white" : "text-black") : theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
              >
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] relative flex-shrink-0">
          <div className="flex justify-center mb-4 min-h-[28px]">
            {isLocating ? (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium animate-pulse ${theme === "dark" ? "bg-[#2c2c2e] text-[#8e8e93]" : "bg-gray-200 text-gray-500"}`}
              >
                <MapPin size={14} />
                <span>Đang tìm vị trí thực tế...</span>
              </div>
            ) : location ? (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLocationModal(true);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-gray-100 text-black"}`}
              >
                <MapPin size={14} className="flex-shrink-0 text-[#32ade6]" />
                <span className="truncate max-w-[180px]">{location}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocation(null);
                  }}
                  className={`p-0.5 rounded-full ml-1 active:opacity-50 ${theme === "dark" ? "bg-[#3a3a3c] text-[#8e8e93]" : "bg-gray-300 text-gray-500"}`}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLocationModal(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border border-dashed transition-all active:opacity-50 ${theme === "dark" ? "border-white/20 text-[#8e8e93] hover:bg-white/5" : "border-black/20 text-gray-400 hover:bg-black/5"}`}
              >
                <MapPin size={14} />
                <span>Thêm vị trí</span>
              </button>
            )}
          </div>

          <span
            className={`text-xs uppercase tracking-wider mb-1 font-medium ${theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
          >
            Amount
          </span>

          <div className="text-[56px] font-bold tracking-tight flex items-baseline justify-center pb-2">
            <span
              className={`text-4xl mr-1 underline underline-offset-8 ${theme === "dark" ? "text-[#8e8e93]" : "text-gray-500"}`}
            >
              ₫
            </span>
            <span>{displayAmount()}</span>
          </div>

          <div className="min-h-[24px] flex items-center justify-center mb-2">
            {calculatedHours() && (
              <span
                className={`text-[13px] font-medium flex items-center gap-1.5 animate-ios-fade ${type === "expense" ? "text-[#ff453a]/80" : "text-[#32d74b]/80"}`}
              >
                <Timer size={14} />
                {type === "expense"
                  ? "Costs"
                  : "Equals"} {calculatedHours()}{" "}
                {calculatedHours() === "1.0" ? "hour" : "hours"} of work
              </span>
            )}
          </div>

          <div className="w-full flex flex-col items-center mt-2">
            <input
              type="text"
              placeholder="+ Add note..."
              value={note}
              onChange={handleNoteChange}
              onTouchStart={(e) => e.stopPropagation()}
              className={`bg-transparent text-center focus:outline-none w-3/4 py-1.5 ${theme === "dark" ? "text-[#8e8e93] placeholder:text-[#8e8e93]/50" : "text-gray-600 placeholder:text-gray-400"}`}
            />
            <div className="h-[36px] w-full mt-2 flex items-center justify-center overflow-hidden">
              {suggestions.length > 0 && (
                <div className="flex overflow-x-auto gap-2 px-4 scrollbar-hide max-w-full pb-1">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        acceptSuggestion(s);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        acceptSuggestion(s);
                      }}
                      className={`px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap shadow-sm active:scale-95 transition-transform flex-shrink-0 ${theme === "dark" ? "bg-[#2c2c2e] text-white" : "bg-white text-black border border-gray-200"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 mt-auto flex-shrink-0 pt-2">
          <div
            className={`flex-[1.2] relative rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <span
              className={`font-semibold text-[12px] flex items-center gap-1.5 pointer-events-none ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              <Calendar size={14} className="text-[#32ade6]" />
              {new Date(datePart).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            <input
              type="date"
              value={datePart}
              onChange={(e) => setDatePart(e.target.value)}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute inset-0 opacity-0 z-20 w-full h-full"
            />
          </div>
          <div
            className={`flex-1 relative rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <span
              className={`font-semibold text-[12px] flex items-center gap-1.5 pointer-events-none ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              <Clock size={14} className="text-[#32ade6]" />
              {timePart}
            </span>
            <input
              type="time"
              value={timePart}
              onChange={(e) => setTimePart(e.target.value)}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute inset-0 opacity-0 z-20 w-full h-full"
            />
          </div>
          <div
            className={`flex-1 relative rounded-xl flex items-center justify-center py-2.5 overflow-hidden active:opacity-60 transition-opacity ${theme === "dark" ? "bg-[#1c1c1e]" : "bg-white"}`}
          >
            <span
              className={`font-semibold text-[12px] flex items-center gap-1.5 pointer-events-none capitalize ${theme === "dark" ? "text-white" : "text-black"}`}
            >
              <Repeat size={14} className="text-[#32ade6]" />
              {repeat === "none" ? "None" : repeat}
            </span>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute inset-0 opacity-0 z-20 w-full h-full"
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 flex-shrink-0">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={(e) => {
                e.stopPropagation();
                handleKeyPress(num.toString());
              }}
              className={`py-3 rounded-2xl text-2xl font-semibold active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black shadow-sm"}`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleKeyPress(",");
            }}
            className={`py-3 rounded-2xl text-2xl font-semibold active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black shadow-sm"}`}
          >
            ,
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleKeyPress("0");
            }}
            className={`py-3 rounded-2xl text-2xl font-semibold active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black shadow-sm"}`}
          >
            0
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className={`py-3 rounded-2xl flex items-center justify-center active:opacity-60 ${theme === "dark" ? "bg-[#1c1c1e] text-[#8e8e93]" : "bg-white text-gray-500 shadow-sm"}`}
          >
            <Delete size={26} />
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          className={`w-full py-3.5 rounded-full font-bold text-[17px] active:scale-[0.98] transition-transform flex-shrink-0 ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
        >
          Save
        </button>
      </div>

      {showLocationModal && (
        <div
          className="fixed inset-0 bg-black/70 z-[70] flex flex-col justify-end animate-ios-fade"
          onClick={() => setShowLocationModal(false)}
        >
          <div
            className={`w-full h-[65vh] max-w-md mx-auto rounded-t-3xl flex flex-col shadow-2xl animate-ios-slide ${theme === "dark" ? "bg-[#1c1c1e] text-white" : "bg-white text-black"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 pb-3 flex-shrink-0">
              <h2 className="font-bold text-lg">Select Location</h2>
              <button
                onClick={() => setShowLocationModal(false)}
                className={`p-1.5 rounded-full ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-5 mb-2 flex-shrink-0">
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-xl ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
              >
                <Search size={18} className="text-[#8e8e93]" />
                <input
                  type="text"
                  placeholder="Tìm đường, quán cafe, cửa hàng..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className={`bg-transparent outline-none flex-1 font-medium ${theme === "dark" ? "text-white" : "text-black"}`}
                />
                {searchLocation && (
                  <button
                    onClick={() => setSearchLocation("")}
                    className="text-[#8e8e93] active:opacity-50"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-8">
              {searchLocation.trim() !== "" && (
                <>
                  <button
                    onClick={() => {
                      setLocation(searchLocation.trim());
                      setShowLocationModal(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 border-b text-left active:opacity-60 transition-opacity ${theme === "dark" ? "border-white/5" : "border-black/5"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${theme === "dark" ? "bg-[#2c2c2e] text-[#32ade6]" : "bg-[#e5f5fd] text-[#007aff]"}`}
                    >
                      <MapPin size={18} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold text-[15px] truncate text-[#32ade6]">
                        Dùng "{searchLocation}"
                      </p>
                      <p className="text-xs text-[#8e8e93] mt-0.5">
                        Địa điểm tùy chỉnh
                      </p>
                    </div>
                  </button>

                  {isSearching ? (
                    <p className="text-[#8e8e93] text-sm mt-4 ml-1 text-center py-4 animate-pulse">
                      Đang tìm kiếm...
                    </p>
                  ) : searchError ? (
                    <p className="text-[#ff453a] text-sm mt-4 ml-1 text-center py-4">
                      {searchError}
                    </p>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((place, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setLocation(place.name);
                          setShowLocationModal(false);
                        }}
                        className={`w-full flex items-center gap-3 p-4 border-b text-left active:opacity-60 transition-opacity ${theme === "dark" ? "border-white/5" : "border-black/5"}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
                        >
                          <MapPin
                            size={18}
                            className={
                              theme === "dark" ? "text-white" : "text-black"
                            }
                          />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-semibold text-[15px] truncate">
                            {place.name}
                          </p>
                          <p className="text-xs text-[#8e8e93] mt-0.5 truncate">
                            {place.address}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : null}
                </>
              )}

              {searchLocation.trim() === "" && (
                <>
                  <p className="text-xs font-bold text-[#8e8e93] uppercase tracking-wider mt-5 mb-2 ml-1">
                    Địa điểm thực tế xung quanh
                  </p>
                  {nearbyPlaces.length > 0 ? (
                    nearbyPlaces.map((place, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setLocation(place.name);
                          setShowLocationModal(false);
                        }}
                        className={`w-full flex items-center gap-3 p-4 border-b text-left active:opacity-60 transition-opacity ${theme === "dark" ? "border-white/5" : "border-black/5"}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${theme === "dark" ? "bg-[#2c2c2e]" : "bg-gray-100"}`}
                        >
                          <MapPin
                            size={18}
                            className={
                              theme === "dark" ? "text-white" : "text-black"
                            }
                          />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="font-semibold text-[15px] truncate">
                            {place.name}
                          </p>
                          <p className="text-xs text-[#8e8e93] mt-0.5 capitalize">
                            {place.address}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-[#8e8e93] text-sm mt-4 ml-1 text-center py-4">
                      Đang quét vị trí thực tế hoặc không có POI gần đây...
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
