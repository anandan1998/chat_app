import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "reatchat-1a40c.firebaseapp.com",
  projectId: "reatchat-1a40c",
  storageBucket: "reatchat-1a40c.appspot.com",
  messagingSenderId: "903523258569",
  appId: "1:903523258569:web:8b1f8b3721f70887027d18",
  measurementId: "G-7ZHH972KEB"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()