import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Cấu hình Firebase của ông (lấy trên trang web Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyAauikItoszpNaWfT8Fc4H17uHhLT1apLI",
  authDomain: "tappyclone.firebaseapp.com",
  projectId: "tappyclone",
  storageBucket: "tappyclone.firebasestorage.app",
  messagingSenderId: "249350572898",
  appId: "1:249350572898:web:3b40753fc4fa06e6beba3b",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// EXPORT 2 CÁI NÀY RA ĐỂ TRANG SETTINGS XÀI
export const auth = getAuth(app);
export const db = getFirestore(app);
