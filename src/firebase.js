import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Cấu hình Firebase của ông (lấy trên trang web Firebase Console)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// EXPORT 2 CÁI NÀY RA ĐỂ TRANG SETTINGS XÀI
export const auth = getAuth(app);
export const db = getFirestore(app);
