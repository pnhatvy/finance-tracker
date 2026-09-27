import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAauikItoszpNaWfT8Fc4H17uHhLT1apLI",
  authDomain: "tappyclone.firebaseapp.com",
  projectId: "tappyclone",
  storageBucket: "tappyclone.firebasestorage.app",
  messagingSenderId: "249350572898",
  appId: "1:249350572898:web:3b40753fc4fa06e6beba3b",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
